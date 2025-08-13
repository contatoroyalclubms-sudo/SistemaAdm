FROM node:20-alpine

WORKDIR /app

# Install system dependencies including OpenSSL for Prisma and NSS for Puppeteer
RUN apk add --no-cache openssl openssl-dev libc6-compat nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont chromium

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY config/ ./config/
COPY prisma/ ./prisma/

# Generate Prisma client and build TypeScript
RUN npm run prisma:generate && npm run build

# Create storage directories
RUN mkdir -p storage/session storage/campaigns logs data

# Expose port
EXPOSE 8080

# Set Puppeteer environment variables for Docker
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Start the application
CMD ["npm", "start"]
