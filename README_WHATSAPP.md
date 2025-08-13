# 🎉 Royal Club WhatsApp Bot

Sistema completo de WhatsApp Bot para o **ROYAL CLUB** com Baileys + Redis, API REST e campanhas automatizadas.

## 🚀 Instalação Rápida

### Pré-requisitos
- Docker e Docker Compose instalados
- Porta 8080 disponível

### Comando Único de Instalação

```bash
# Descompactar e configurar
unzip devin_whatsapp_pack.zip && cd devin_whatsapp_pack

# Copiar configurações
cp wa-bot/.env.example wa-bot/.env

# Subir containers
docker compose up -d --build

# Verificar status
echo "🔍 Verificando serviços..."
sleep 5
curl -s http://localhost:8080/health | jq
curl -s http://localhost:8080/qr | jq

# Ver logs para QR Code
echo "📱 Visualizando QR Code para pareamento:"
docker logs -f dave_wa_bot
```

## 📱 Pareamento WhatsApp

1. Execute o comando acima
2. Aguarde aparecer o QR Code nos logs
3. Abra o WhatsApp no seu celular
4. Vá em **Dispositivos Conectados** > **Conectar um dispositivo**
5. Escaneie o QR Code
6. Aguarde a mensagem "✅ WhatsApp connected successfully!"

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```bash
# Nome do clube
CLUB_NAME=ROYAL CLUB

# Rate limiting (mensagens por minuto)
RATE_LIMIT_MSGS_PER_MIN=12

# Configurações da API
PORT=8080
NODE_ENV=production
REDIS_URL=redis://redis:6379
```

### Arquivos de Configuração

- **`config/menus.json`** - Menu principal do bot
- **`config/products.json`** - Produtos e preços (ingressos, VIP, etc.)
- **`storage/campaigns.csv`** - Campanhas em massa (phone,message)

## 📡 API Endpoints

### Status e Saúde
```bash
# Verificar saúde do sistema
GET /health

# Obter QR Code para pareamento
GET /qr
```

### Gerenciamento de Menus
```bash
# Listar menus
GET /api/menus

# Atualizar menus
POST /api/menus
Content-Type: application/json
```

### Gerenciamento de Produtos
```bash
# Listar produtos
GET /api/products

# Atualizar produtos
POST /api/products
Content-Type: application/json
```

### Campanhas
```bash
# Enviar campanha via CSV
POST /api/campaigns/send
Content-Type: application/json
{
  "file": "storage/campaigns.csv",
  "message": "Mensagem personalizada (opcional)"
}
```

## 🤖 Intenções Automáticas

O bot responde automaticamente às seguintes palavras-chave:

| Palavra-chave | Resposta |
|---------------|----------|
| `menu`, `oi`, `olá` | Menu principal com opções |
| `ingresso`, `ticket` | Lista de ingressos e preços |
| `vip` | Informações sobre área VIP |
| `aniversário`, `birthday` | Pacotes de festa de aniversário |
| `local`, `endereço` | Localização e como chegar |
| `promoter` | Informações para ser divulgador |
| `comprovante` | Envio de comprovante de pagamento |

## 💳 Sistema PIX (Stub)

O arquivo `src/lib/pix.js` contém um stub preparado para integração com provedores PIX:

- **Asaas**
- **MercadoPago** 
- **Stripe**
- **Outros provedores**

### Exemplo de Integração (Asaas)

```javascript
// Substitua o método generatePaymentLink em src/lib/pix.js
async generatePaymentLink(customerPhone, productId, amount) {
  const response = await fetch('https://www.asaas.com/api/v3/payments', {
    method: 'POST',
    headers: {
      'access_token': process.env.ASAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: customerPhone,
      billingType: 'PIX',
      value: amount,
      dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      description: `${productId} - Royal Club`
    })
  });
  
  const payment = await response.json();
  return payment.invoiceUrl;
}
```

## 📊 Comandos de Teste

### Verificar Status
```bash
# Status geral
curl -s http://localhost:8080/health | jq

# Status do WhatsApp
curl -s http://localhost:8080/qr | jq
```

### Testar Menus
```bash
# Ver menus atuais
curl -s http://localhost:8080/api/menus | jq

# Atualizar menu
curl -s -X POST http://localhost:8080/api/menus \
  -H "Content-Type: application/json" \
  -d @wa-bot/config/menus.json | jq
```

### Testar Produtos
```bash
# Ver produtos
curl -s http://localhost:8080/api/products | jq

# Atualizar produtos
curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d @wa-bot/config/products.json | jq
```

### Testar Campanha
```bash
# Enviar campanha
curl -s -X POST http://localhost:8080/api/campaigns/send \
  -H "Content-Type: application/json" \
  -d '{"file":"storage/campaigns.csv"}' | jq
```

## 🔍 Monitoramento

### Logs dos Containers
```bash
# Logs do bot WhatsApp
docker logs -f dave_wa_bot

# Logs do Redis
docker logs -f dave_redis

# Logs de todos os serviços
docker compose logs -f
```

### Status dos Containers
```bash
# Ver containers rodando
docker ps

# Status dos serviços
docker compose ps
```

## 🛠️ Comandos Úteis

### Reiniciar Serviços
```bash
# Reiniciar apenas o bot
docker compose restart wa-bot

# Reiniciar tudo
docker compose restart

# Rebuild completo
docker compose down && docker compose up -d --build
```

### Backup da Sessão
```bash
# Fazer backup da sessão WhatsApp
cp -r wa-bot/storage/session wa-bot/storage/session_backup_$(date +%Y%m%d_%H%M%S)
```

### Limpar Dados
```bash
# Parar containers
docker compose down

# Remover volumes (CUIDADO: apaga sessão WhatsApp)
docker compose down -v

# Rebuild do zero
docker compose up -d --build
```

## 📁 Estrutura do Projeto

```
devin_whatsapp_pack/
├── docker-compose.yml          # Configuração Docker
├── README.md                   # Este arquivo
└── wa-bot/
    ├── Dockerfile              # Container do bot
    ├── package.json            # Dependências Node.js
    ├── .env.example            # Variáveis de ambiente
    ├── src/
    │   ├── index.js            # Aplicação principal
    │   ├── services/
    │   │   ├── whatsapp.js     # Serviço WhatsApp (Baileys)
    │   │   └── redis.js        # Serviço Redis
    │   ├── handlers/
    │   │   └── messageHandler.js # Processamento de mensagens
    │   ├── routes/
    │   │   └── index.js        # Rotas da API
    │   └── lib/
    │       ├── pix.js          # Stub PIX (para integração)
    │       └── rateLimiter.js  # Rate limiting
    ├── config/
    │   ├── menus.json          # Configuração de menus
    │   └── products.json       # Produtos e preços
    └── storage/
        ├── campaigns.csv       # Campanhas em massa
        └── session/            # Sessão WhatsApp (criada automaticamente)
```

## ⚠️ Importante

1. **Sessão WhatsApp**: A pasta `storage/session/` contém os dados de autenticação. Faça backup regularmente.

2. **Rate Limiting**: O sistema respeita o limite de 12 mensagens por minuto por padrão. Ajuste via `RATE_LIMIT_MSGS_PER_MIN`.

3. **PIX Integration**: O arquivo `src/lib/pix.js` é um stub. Substitua pela integração real com seu provedor.

4. **Segurança**: Em produção, adicione autenticação na API e configure HTTPS.

5. **Backup**: Faça backup regular da pasta `storage/` para não perder dados importantes.

## 🆘 Solução de Problemas

### Bot não conecta
```bash
# Verificar logs
docker logs dave_wa_bot

# Limpar sessão e reconectar
rm -rf wa-bot/storage/session/*
docker compose restart wa-bot
```

### API não responde
```bash
# Verificar se porta está livre
netstat -tlnp | grep 8080

# Verificar container
docker ps | grep dave_wa_bot
```

### Redis não conecta
```bash
# Verificar Redis
docker logs dave_redis

# Testar conexão
docker exec -it dave_redis redis-cli ping
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs: `docker logs -f dave_wa_bot`
2. Consulte este README
3. Verifique se todas as portas estão disponíveis
4. Certifique-se que o Docker está rodando corretamente

---

**🎉 Royal Club WhatsApp Bot - Pronto para usar!**
