# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default environment variables
ENV BACKEND_URL=http://backend:3001
ENV PORT=80

# Expose port (must match $PORT, default 80)
EXPOSE 80

# Generate final config and start Nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
