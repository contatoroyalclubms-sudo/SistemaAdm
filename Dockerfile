FROM node:20-alpine

WORKDIR /app

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

# Start the application
CMD ["npm", "start"]
