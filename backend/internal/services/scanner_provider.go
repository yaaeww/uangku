package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type ReceiptProvider interface {
	Scan(imageData []byte) (*ParsedReceipt, error)
}

type OpenAIProvider struct {
	client *openai.Client
}

func NewOpenAIProvider() *OpenAIProvider {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil
	}
	return &OpenAIProvider{
		client: openai.NewClient(apiKey),
	}
}

func (p *OpenAIProvider) Scan(imageData []byte) (*ParsedReceipt, error) {
	if p.client == nil {
		return nil, fmt.Errorf("OpenAI API Key not configured")
	}

	base64Image := base64.StdEncoding.EncodeToString(imageData)
	
	prompt := `
		Analyze this receipt image and extract the following information in JSON format:
		- merchant: name of the store
		- date: date of transaction (ISO format)
		- items: list of objects with:
			- name: item name
			- quantity: number of items
			- price: price per item
			- total: total price for this item
			- category: suggested category (e.g. Food, Transport, Household, etc.)
		- total: total amount spent on the receipt
		
		Context: This is for an Indonesian family finance app. Please translate/normalize categories to common Indonesian categories if possible (e.g. Makan, Jajan, Sembako, Kebutuhan Rumah).
		Important: Return ONLY the raw JSON object.
	`

	resp, err := p.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleUser,
					MultiContent: []openai.ChatMessagePart{
						{
							Type: openai.ChatMessagePartTypeText,
							Text: prompt,
						},
						{
							Type: openai.ChatMessagePartTypeImageURL,
							ImageURL: &openai.ChatMessageImageURL{
								URL: fmt.Sprintf("data:image/jpeg;base64,%s", base64Image),
							},
						},
					},
				},
			},
		},
	)

	if err != nil {
		return nil, err
	}

	content := resp.Choices[0].Message.Content
	// Clean up markdown if any
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var result ParsedReceipt
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %v", err)
	}

	return &result, nil
}
