# Dave Integration Guide

## ✅ Integration Complete

The WhatsApp bot has been successfully integrated into the Dave environment with the following configuration:

### Network Configuration
- **External Network**: `dave_net` (shared with Dave system)
- **No standalone Redis**: Uses Dave's existing Redis instance
- **Container**: `dave_wa_bot` running in dave_net network

### Environment Configuration
```bash
NODE_ENV=production
REDIS_URL=redis://dave_redis:6379
PORT=8080
CLUB_NAME=Royal Club
RATE_LIMIT_MSGS_PER_MIN=12
```

### Docker Compose Integration
```yaml
version: '3.8'
services:
  wa-bot:
    build: ./wa-bot
    container_name: dave_wa_bot
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://dave_redis:6379
    networks:
      - dave_net

networks:
  dave_net:
    external: true
```

## Desktop App Integration

### Pack Root Path
The desktop app should point to the absolute path of this package:
```
packRoot = "/absolute/path/to/whatsapp-bot-package"
```

### Control Commands
- **Start**: `docker compose up -d --build` (in pack directory)
- **Stop**: `docker compose down` (in pack directory)
- **Status**: `curl -s http://localhost:8080/health | jq`
- **Logs**: `docker logs -f dave_wa_bot`

### API Endpoints (localhost:8080)
- `GET /health` - System status and WhatsApp pairing status
- `GET /qr` - QR code for WhatsApp pairing
- `GET/POST /api/menus` - Menu configuration
- `GET/POST /api/products` - Product pricing (R$ 60)
- `POST /api/campaigns/send` - Mass messaging campaigns

## Verification Commands
```bash
# Check network integration
docker network inspect dave_net

# Verify containers
docker ps | grep dave

# Test API
curl -s http://localhost:8080/health | jq
curl -s http://localhost:8080/api/menus | jq
curl -s http://localhost:8080/api/products | jq
```

## Royal Club Features Preserved
- ✅ Club Name: Royal Club
- ✅ Event: MC Daniel - 16 AGO (Sáb) 22h
- ✅ Pricing: Ingresso Unissex R$ 60,00
- ✅ Images: Logo, flyer, mapa de camarotes
- ✅ Commands: menu, ingresso, mapa, camarote, vip, aniversario, local
- ✅ Sales Link: https://links.totalingressos.com/mc-daniel-na-royal.html
- ✅ Rate Limiting: 12 msgs/min
