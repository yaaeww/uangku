package utils

import (
	"log"
	"github.com/nickalie/go-webpbin"
)

// ConvertToWebP converts an image file to WebP format with specified quality.
func ConvertToWebP(inputPath, outputPath string, quality uint) error {
	err := webpbin.NewCWebP().
		InputFile(inputPath).
		OutputFile(outputPath).
		Quality(quality).
		Run()
	
	if err != nil {
		log.Printf("[ConvertToWebP] Error: %v", err)
		return err
	}
	
	return nil
}
