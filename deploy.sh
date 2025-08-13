#!/bin/bash


set -e

echo "🎭 Starting Royal Club WhatsApp Automation Deployment..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📁 Creating necessary directories..."
mkdir -p data storage/session storage/campaigns logs

chmod 755 data storage logs
chmod -R 755 storage/

if [ ! -f .env ]; then
    echo "📋 Creating .env file from production template..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your actual configuration values!"
fi

echo "🔨 Building Docker images..."
docker compose build

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service health..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎭 ======================================"
    echo "   ROYAL CLUB - DEPLOYMENT COMPLETE"
    echo "======================================"
    echo "🚀 WhatsApp Bot: http://localhost:8080"
    echo "📱 QR Code: http://localhost:8080/api/whatsapp/qr"
    echo "📊 Health Check: http://localhost:8080/health"
    echo "📋 Logs: docker compose logs -f"
    echo "🛑 Stop: docker compose down"
    echo "======================================"
    echo ""
    echo "📱 Scan the QR code with WhatsApp to connect!"
else
    echo "❌ Some services failed to start. Check logs with: docker compose logs"
    exit 1
fi
