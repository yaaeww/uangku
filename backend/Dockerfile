# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o main ./cmd/server

# Final stage
FROM alpine:latest

WORKDIR /root/

# Install runtime dependencies (e.g., for CA certificates or OCR if needed)
RUN apk add --no-cache ca-certificates tesseract-ocr

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy environment template
COPY .env.example .env

# Expose port
EXPOSE 3000

# Run the binary
CMD ["./main"]
