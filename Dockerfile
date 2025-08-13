FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Create storage directories
RUN mkdir -p storage/session storage/campaigns logs

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "src/index.js"]
