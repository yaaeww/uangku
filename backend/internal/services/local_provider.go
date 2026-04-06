package services

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

type LocalOCRProvider struct{}

func NewLocalOCRProvider() *LocalOCRProvider {
	return &LocalOCRProvider{}
}

func (p *LocalOCRProvider) Scan(imageData []byte) (*ParsedReceipt, error) {
	// 1. Send to persistent OCR service via HTTP
	// Service runs on localhost:3002
	url := "http://localhost:3002/ocr"
	
	resp, err := http.Post(url, "image/webp", bytes.NewReader(imageData))
	if err != nil {
		return nil, fmt.Errorf("failed to contact OCR service: %v. Is it running?", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OCR service error (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read OCR response: %v", err)
	}

	rawText := string(body)
	
	// 2. Extract information from raw text
	return p.parseRawText(rawText), nil
}

func (p *LocalOCRProvider) parseRawText(text string) *ParsedReceipt {
	result := &ParsedReceipt{
		IsValid: false,
	}

	lines := strings.Split(text, "\n")
	if len(lines) == 0 {
		result.ErrorMessage = "Tidak ada teks yang terdeteksi"
		return result
	}

	// 1. Extract Merchant (Top-down search)
	foundMerchant := false
	excludeMerchantKeywords := []string{"KSR:", "KASIR", "PEL:", "PELANGGAN", "SAL:", "TGL:", "WAKTU", "ITEM", "QTY", "POS", "CHECK", "NO:", "DATE"}
	for i, line := range lines {
		if i > 10 {
			break 
		}
		trimmed := strings.TrimSpace(line)
		upperTrimmed := strings.ToUpper(trimmed)
		
		isExcluded := false
		for _, kw := range excludeMerchantKeywords {
			if strings.Contains(upperTrimmed, kw) {
				isExcluded = true
				break
			}
		}

		if !isExcluded && len(trimmed) > 3 && regexp.MustCompile(`[a-zA-Z]{3,}`).MatchString(trimmed) {
			// Clean merchant name if it contains symbols
			cleanMerchant := regexp.MustCompile(`[^a-zA-Z0-9\s]`).ReplaceAllString(trimmed, "")
			result.Merchant = strings.TrimSpace(cleanMerchant)
			foundMerchant = true
			break
		}
	}
	if !foundMerchant {
		result.Merchant = "Struk Belanja"
	}

	// 2. Extract Total (Bottom-up search with priority)
	result.Total = p.extractTotal(text)
	if result.Total > 0 {
		result.IsValid = true
	} else {
		result.ErrorMessage = "Total tidak terbaca. Pastikan foto struk terang dan angka total terlihat jelas."
	}

	// 3. Extract Date
	result.Date = p.extractDate(text)

	return result
}

func (p *LocalOCRProvider) extractTotal(text string) float64 {
	lines := strings.Split(text, "\n")
	
	// Priority 1: Lines containing "Total" keywords (excluding Change/Kembali)
	totalKeywords := []string{"GRAND TOTAL", "TOTAL BAYAR", "JUMLAH TOTAL", "TOTAL DUE", "TOTAL AMOUNT", "TOTAL", "T0TAL", "TOTL"}
	// Priority 2: Lines containing Payment keywords (indicates amount paid)
	paymentKeywords := []string{"TUNAI", "DEBIT", "CASH", "KARTU", "VISA", "MASTER", "PAYMENT", "BAYAR"}
	// Keywords to strictly ignore
	excludeKeywords := []string{"KEMBALI", "CHANGE", "DISKON", "DISCOUNT", "PROMO", "REFUND", "SUBTOTAL"}

	// Priority 1 Check: Total Line
	for i := len(lines) - 1; i >= 0; i-- {
		line := lines[i]
		upperLine := strings.ToUpper(line)
		
		isTotalLine := false
		for _, kw := range totalKeywords {
			if strings.Contains(upperLine, kw) {
				isTotalLine = true
				break
			}
		}

		isExcluded := false
		for _, ekw := range excludeKeywords {
			if strings.Contains(upperLine, ekw) {
				isExcluded = true
				break
			}
		}

		if isTotalLine && !isExcluded {
			val := p.findBestNumber(line)
			if val > 0 {
				return val
			}
		}
	}

	// Priority 2 Check: Payment Lines (fallback)
	for i := len(lines) - 1; i >= 0; i-- {
		line := lines[i]
		upperLine := strings.ToUpper(line)
		
		isPaymentLine := false
		for _, kw := range paymentKeywords {
			if strings.Contains(upperLine, kw) {
				isPaymentLine = true
				break
			}
		}

		isExcluded := false
		for _, ekw := range excludeKeywords {
			if strings.Contains(upperLine, ekw) {
				isExcluded = true
				break
			}
		}

		if isPaymentLine && !isExcluded {
			val := p.findBestNumber(line)
			if val > 0 {
				return val
			}
		}
	}

	// Fallback 2: Find the largest plausible number in the bottom half of the receipt
	maxVal := 0.0
	startIdx := len(lines) / 2
	for i := len(lines) - 1; i >= startIdx; i-- {
		val := p.findBestNumber(lines[i])
		if val > maxVal && val < 50000000 { // Max sanity check 50jt
			maxVal = val
		}
	}

	return maxVal
}

// findBestNumber attempts to extract the most plausible price from a single line
func (p *LocalOCRProvider) findBestNumber(line string) float64 {
	// Pattern for numbers with markers: Rp 10.000, 10,000, 10.000,00 etc.
	re := regexp.MustCompile(`(?:Rp|USD|\$)?\s*(\d{1,3}(?:[., ]\d{3})*(?:[.,]\d+)?|\d{4,}(?:[.,]\d+)?)`)
	matches := re.FindAllStringSubmatch(line, -1)

	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		numStr := m[1]
		
		lastDot := strings.LastIndex(numStr, ".")
		lastComma := strings.LastIndex(numStr, ",")
		
		var clean string
		
		// If both dot and comma exist, the one that appears LAST is the decimal separator
		if lastDot != -1 && lastComma != -1 {
			if lastComma > lastDot {
				// ID Style: 10.000,00 -> Strip from comma onwards, remove dots
				clean = strings.ReplaceAll(numStr[:lastComma], ".", "")
			} else {
				// US Style: 10,000.00 -> Strip from dot onwards, remove commas
				clean = strings.ReplaceAll(numStr[:lastDot], ",", "")
			}
		} else if lastComma != -1 {
			// Only comma: could be 10,000 (US thousands) or 530,00 (ID decimal)
			decimalPart := numStr[lastComma+1:]
			if len(decimalPart) == 2 {
				// Likely Decimal: 530,00 -> 530
				clean = numStr[:lastComma]
			} else {
				// Likely Thousand: 10,000 -> 10000
				clean = strings.ReplaceAll(numStr, ",", "")
			}
		} else if lastDot != -1 {
			// Only dot: 10.000 (ID thousands) or 10.50 (US decimal)
			decimalPart := numStr[lastDot+1:]
			if len(decimalPart) == 2 && len(numStr[:lastDot]) <= 3 {
				// Likely Decimal (Small number + .XX): 10.50 -> 10
				clean = numStr[:lastDot]
			} else {
				// Likely Thousand: 10.000 -> 10000
				clean = strings.ReplaceAll(numStr, ".", "")
			}
		} else {
			clean = numStr
		}

		// Remove all remaining non-numeric
		numericOnly := regexp.MustCompile(`[^\d]`).ReplaceAllString(clean, "")
		if val, err := strconv.ParseFloat(numericOnly, 64); err == nil {
			if val >= 500 {
				return val
			}
		}
	}
	return 0
}

func (p *LocalOCRProvider) extractDate(text string) string {
	// 1. Try YYYY-MM-DD or similar
	reISO := regexp.MustCompile(`(\d{4})[-/](\d{1,2})[-/](\d{1,2})`)
	if m := reISO.FindStringSubmatch(text); m != nil {
		return fmt.Sprintf("%s-%02s-%02s", m[1], m[2], m[3])
	}

	// 2. Try DD-MM-YYYY or DD/MM/YYYY
	reCommon := regexp.MustCompile(`(\d{1,2})[-/](\d{1,2})[-/](\d{4})`)
	if m := reCommon.FindStringSubmatch(text); m != nil {
		return fmt.Sprintf("%s-%02s-%02s", m[3], m[2], m[1])
	}

	// 3. Try Indonesian format with month names (e.g., 9 APRIL 2021)
	months := map[string]string{
		"JANUARI": "01", "FEBRUARI": "02", "MARET": "03", "APRIL": "04",
		"MEI": "05", "JUNI": "06", "JULI": "07", "AGUSTUS": "08",
		"SEPTEMBER": "09", "OKTOBER": "10", "NOVEMBER": "11", "DESEMBER": "12",
		"JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "JUN": "06",
		"JUL": "07", "AUG": "08", "SEP": "09", "OKT": "10", "NOV": "11", "DES": "12",
	}

	upperText := strings.ToUpper(text)
	for monthName, monthNum := range months {
		reMonth := regexp.MustCompile(fmt.Sprintf(`(\d{1,2})\s*%s\s*(\d{4})`, monthName))
		if m := reMonth.FindStringSubmatch(upperText); m != nil {
			return fmt.Sprintf("%s-%s-%02s", m[2], monthNum, m[1])
		}
	}

	return ""
}
