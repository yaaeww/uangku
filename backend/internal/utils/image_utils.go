package utils

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/nickalie/go-webpbin"
)

func ensureWebPBinary() error {
	binDir := "bin"
	exePath := filepath.Join(binDir, "cwebp.exe")

	if _, err := os.Stat(exePath); err == nil {
		return nil // Already exists
	}

	log.Println("[WebP] cwebp.exe not found. Downloading...")

	if err := os.MkdirAll(binDir, 0755); err != nil {
		return err
	}

	url := "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0-windows-x64.zip"
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	tmpFile, err := os.CreateTemp("", "libwebp-*.zip")
	if err != nil {
		return err
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		return err
	}

	reader, err := zip.OpenReader(tmpFile.Name())
	if err != nil {
		return err
	}
	defer reader.Close()

	for _, f := range reader.File {
		if strings.HasSuffix(f.Name, "cwebp.exe") {
			rc, err := f.Open()
			if err != nil {
				return err
			}
			defer rc.Close()

			outFile, err := os.OpenFile(exePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
			if err != nil {
				return err
			}
			defer outFile.Close()

			if _, err := io.Copy(outFile, rc); err != nil {
				return err
			}
			log.Println("[WebP] cwebp.exe downloaded and extracted successfully.")
			return nil
		}
	}

	return fmt.Errorf("cwebp.exe not found in downloaded zip")
}

// ConvertToWebP converts an image file to WebP format with specified quality.
func ConvertToWebP(inputPath, outputPath string, quality uint) error {
	if err := ensureWebPBinary(); err != nil {
		log.Printf("[ConvertToWebP] Warning: Binary ensure failed: %v", err)
	}

	c := webpbin.NewCWebP()
	c.Dest("bin")
	err := c.InputFile(inputPath).
		OutputFile(outputPath).
		Quality(quality).
		Run()
	
	if err != nil {
		log.Printf("[ConvertToWebP] Error: %v", err)
		return err
	}
	
	return nil
}
