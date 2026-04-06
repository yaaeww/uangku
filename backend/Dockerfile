# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies for Tesseract OCR and Node.js
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-ind tesseract-ocr-data-eng build-base nodejs npm

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Install OCR service dependencies
RUN cd scripts && npm install

# Build the application
RUN go build -o main ./cmd/server/main.go

# Final stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies for Tesseract OCR and Node.js
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-ind tesseract-ocr-data-eng nodejs npm

# Copy the binary and other necessary files from the builder
COPY --from=builder /app/main .
COPY .env .
COPY --from=builder /app/ind.traineddata .
COPY --from=builder /app/eng.traineddata .
COPY --from=builder /app/scripts ./scripts

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["./main"]
