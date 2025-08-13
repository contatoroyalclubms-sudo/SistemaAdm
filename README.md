# 🎭 Royal Club - WhatsApp Sales Automation

> **Automação profissional de vendas via WhatsApp para eventos da Royal Club**

Sistema completo de automação de vendas para o show do **MC Daniel Falcão** na Royal Club, desenvolvido com **TypeScript**, **Clean Architecture** e **WhatsApp integration**.

## 📋 Índice

- [🚀 Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura](#️-arquitetura)
- [💻 Tecnologias](#-tecnologias)
- [⚙️ Instalação](#️-instalação)
- [🔧 Configuração](#-configuração)
- [📱 Uso](#-uso)
- [🧪 Testes](#-testes)
- [📊 API](#-api)
- [🔄 Funil de Vendas](#-funil-de-vendas)
- [💳 Integrações](#-integrações)
- [📈 Monitoramento](#-monitoramento)

## 🚀 Funcionalidades

### ✨ Principais Features

- **🤖 Bot WhatsApp Inteligente**: Atendimento automático 24/7
- **🎯 Funil de Vendas Automatizado**: Conversão otimizada
- **📊 CRM Integrado**: Gestão completa de leads
- **💳 Pagamentos**: Integração Stripe + PIX
- **📈 Analytics**: Métricas de conversão e vendas
- **🔒 Segurança**: Rate limiting, validação e logs
- **🌐 API REST**: Interface completa para integrações
- **📱 Multi-dispositivo**: Web + WhatsApp

### 🎪 Produtos Disponíveis

1. **🎫 Ingressos** - A partir de R$ 80
2. **🍽️ Bistrô** - Mesa para até 6 pessoas
3. **👑 Camarote VIP** - Experiência premium exclusiva

## 🏗️ Arquitetura

```
src/
├── domain/          # Regras de negócio
│   ├── entities/    # Entidades do domínio
│   └── repositories/ # Contratos dos repositórios
├── application/     # Casos de uso
│   └── use-cases/   # Lógica de aplicação
├── infrastructure/ # Implementações técnicas
│   ├── database/   # Prisma + SQLite/PostgreSQL
│   ├── whatsapp/   # WPPConnect integration
│   └── repositories/ # Implementações Prisma
├── presentation/   # Interface da aplicação
│   ├── routes/     # Rotas da API
│   ├── middleware/ # Auth, rate limit, etc.
│   └── handlers/   # Handlers de mensagens
└── shared/         # Utilitários compartilhados
    ├── dtos/       # Validação com Zod
    └── logger.ts   # Logs estruturados (Pino)
```

### 🔄 Clean Architecture Benefits

- **🎯 Separação de responsabilidades**
- **🧪 Testabilidade máxima**
- **🔧 Manutenibilidade**
- **⚡ Performance otimizada**
- **🛡️ Tipos seguros (TypeScript)**

## 💻 Tecnologias

### Backend Core
- **Node.js 18+** - Runtime
- **TypeScript** - Linguagem principal
- **Express.js** - Framework web
- **Prisma** - ORM e migrations
- **SQLite** (dev) / **PostgreSQL** (prod)

### WhatsApp Integration
- **@wppconnect-team/wppconnect** - Cliente WhatsApp
- **QRCode** - Geração de QR para autenticação

### Segurança & Validação
- **Zod** - Validação de schemas
- **Helmet** - Headers de segurança
- **Rate Limiter Flexible** - Rate limiting
- **CORS** - Cross-origin requests

### Pagamentos
- **Stripe** - Cartão de crédito
- **PIX** - Pagamento instantâneo brasileiro

### Logging & Monitoring
- **Pino** - Logs estruturados e performáticos
- **Pino Pretty** - Logs formatados (dev)

### Testes
- **Vitest** - Framework de testes
- **Supertest** - Testes E2E da API
- **Coverage V8** - Cobertura de código

## ⚙️ Instalação

### 📋 Pré-requisitos

- **Node.js 18+**
- **npm** ou **yarn**
- **SQLite** (development)
- **PostgreSQL** (production)

### 🔧 Setup Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/royal-club/whatsapp-automation.git
cd whatsapp-automation

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Configure o banco de dados
npm run prisma:generate
npm run prisma:migrate

# 5. Build do projeto
npm run build

# 6. Inicie o servidor
npm start
```

### 🚀 Desenvolvimento

```bash
# Modo desenvolvimento (hot reload)
npm run dev

# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e

# Linting
npm run lint
npm run lint:fix
```

## 🔧 Configuração

### 📄 Arquivo .env

```bash
# Ambiente
NODE_ENV=development
PORT=8080

# Aplicação
CLUB_NAME="Royal Club"
API_KEY=your-secure-api-key-here

# Banco de Dados
DATABASE_URL="file:./dev.db"
# Para produção: "postgresql://user:pass@host:5432/db"

# WhatsApp
WA_SESSION_NAME=royal-club-session
WA_LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MSGS_PER_MIN=12
API_RATE_LIMIT_ENABLED=true

# Pagamentos
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
PIX_API_KEY=your-pix-key

# Notificações
ADMIN_PHONE=5511999999999
ADMIN_EMAIL=admin@royalclub.com
```

### 🎪 Configuração de Produtos

Edite `config/products.json` para personalizar:

```json
{
  "event": {
    "name": "MC Daniel Falcão na Royal Club",
    "date": "2025-02-15T22:00:00.000Z",
    "headliner": "MC Daniel Falcão"
  },
  "products": [
    {
      "type": "CAMAROTE",
      "name": "Camarote VIP",
      "price": 250.00,
      "capacity": 10,
      "minimumConsumption": 800.00
    }
  ]
}
```

## 📱 Uso

### 🔄 Primeira Execução

1. **Inicie o servidor**: `npm start`
2. **Acesse o QR Code**: http://localhost:8080/api/whatsapp/qr
3. **Escaneie com WhatsApp** no seu celular
4. **Aguarde a conexão** ser estabelecida
5. **Bot pronto!** ✅

### 💬 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `menu` | Menu principal |
| `ingressos` | Ver ingressos disponíveis |
| `bistro` | Informações sobre bistrô |
| `camarote` | Detalhes do camarote VIP |
| `disponibilidade` | Consultar vagas |
| `preço` | Ver valores |
| `quero` | Iniciar processo de compra |
| `ajuda` | Falar com atendente |

### 🔄 Fluxo de Conversação

```
👤 Cliente: "oi"
🤖 Bot: "Bem-vindo! Digite 'menu' para ver opções"

👤 Cliente: "camarote"
🤖 Bot: "🏆 CAMAROTE VIP - R$ 250,00
         Experiência premium para 10 pessoas..."

👤 Cliente: "quero"
🤖 Bot: "Perfeito! Preciso do seu CPF..."
```

## 🧪 Testes

### 🎯 Estratégia de Testes

- **Unit Tests**: Entidades e casos de uso
- **Integration Tests**: Repositórios e serviços
- **E2E Tests**: API endpoints críticos
- **Coverage Target**: > 80%

### 🚀 Executar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Watch mode
npm test -- --watch

# Específico
npm test src/domain/entities/Lead.test.ts
```

### 📊 Cenários Testados

- ✅ Criação e gestão de leads
- ✅ Funil de vendas automático
- ✅ Validação de dados (Zod)
- ✅ Rate limiting
- ✅ Autenticação API
- ✅ Processamento de mensagens
- ✅ Escalação para humanos

## 📊 API

### 🔐 Autenticação

Inclua o header em requests protegidos:
```bash
X-API-Key: your-api-key-here
```

### 🌐 Endpoints Principais

#### WhatsApp
```bash
GET  /api/whatsapp/status     # Status da conexão
GET  /api/whatsapp/qr        # QR Code para conectar
POST /api/whatsapp/send      # Enviar mensagem
POST /api/whatsapp/broadcast # Envio em massa
```

#### Leads (🔒 Protegido)
```bash
GET    /api/leads           # Listar leads
GET    /api/leads/:id       # Detalhes do lead
POST   /api/leads           # Criar lead
PUT    /api/leads/:id       # Atualizar lead
DELETE /api/leads/:id       # Remover lead
```

#### Eventos
```bash
GET  /api/events            # Listar eventos
GET  /api/events/:id        # Detalhes do evento
POST /api/events            # Criar evento (🔒)
PUT  /api/events/:id        # Atualizar evento (🔒)
```

#### Reservas (🔒 Protegido)
```bash
GET    /api/reservations     # Listar reservas
POST   /api/reservations     # Nova reserva
PUT    /api/reservations/:id # Atualizar reserva
DELETE /api/reservations/:id # Cancelar reserva
```

#### Estatísticas (🔒 Protegido)
```bash
GET /api/stats/leads        # Métricas de leads
GET /api/stats/reservations # Métricas de reservas
GET /api/stats/revenue      # Métricas de receita
```

### 📝 Exemplo de Request

```bash
# Enviar mensagem
curl -X POST http://localhost:8080/api/whatsapp/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "body": "Olá! Temos novidades sobre o show!"
  }'
```

### 📋 Response Format

```json
{
  "success": true,
  "data": {
    "sent": true,
    "to": "5511999999999",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🔄 Funil de Vendas

### 🎯 Etapas do Funil

1. **👋 Primeiro Contato**
   - Boas-vindas automáticas
   - Apresentação do evento
   - Menu de opções

2. **🎪 Demonstração de Interesse**
   - Escolha do produto
   - Informações detalhadas
   - Sugestões de upsell

3. **💰 Cotação e Disponibilidade**
   - Preços atualizados
   - Vagas disponíveis
   - Urgência (lotes limitados)

4. **📝 Coleta de Dados**
   - Nome completo
   - CPF para reserva
   - E-mail para confirmação

5. **💳 Pagamento**
   - Link de pagamento Stripe
   - Opções PIX com desconto
   - Confirmação automática

6. **✅ Confirmação**
   - Comprovante por e-mail
   - Instruções do evento
   - Suporte pós-venda

### 🤖 Inteligência do Bot

- **🧠 Processamento de Linguagem Natural**
- **🎯 Reconhecimento de Intenções**
- **⚡ Respostas Contextuais**
- **🔄 Follow-up Automático**
- **👨‍💼 Escalação Inteligente**

## 💳 Integrações

### 💰 Stripe (Cartão de Crédito)

```typescript
// Webhook de pagamento confirmado
POST /api/webhook/stripe
```

- ✅ Parcelamento até 3x
- ✅ Processamento seguro
- ✅ Confirmação automática
- ✅ Estorno facilitado

### 🇧🇷 PIX (Pagamento Instantâneo)

```typescript
// Webhook PIX confirmado
POST /api/webhook/pix
```

- ✅ Desconto de 5%
- ✅ Confirmação em tempo real
- ✅ QR Code dinâmico
- ✅ Conciliação automática

### 📧 Notificações

- **📱 WhatsApp**: Confirmações e lembretes
- **📧 E-mail**: Comprovantes e instruções
- **🔔 Admin**: Alertas de vendas e problemas

## 📈 Monitoramento

### 📊 Métricas Coletadas

- **💬 Mensagens**: Enviadas/recebidas por hora
- **🎯 Conversões**: Taxa de leads → vendas
- **💰 Receita**: Faturamento por produto
- **⏱️ Tempo de Resposta**: Performance do bot
- **🚨 Escalações**: Transferências para humanos

### 🔍 Logs Estruturados

```json
{
  "level": "INFO",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "message": "Sales Event",
  "event": "product_interest",
  "leadId": "lead_12345",
  "data": {
    "productType": "CAMAROTE",
    "phone": "551199****999"
  }
}
```

### ⚠️ Alertas Automáticos

- **🔴 Erro crítico**: Falha na integração
- **🟡 Rate limit**: Muitas mensagens
- **🟢 Meta atingida**: Vendas do dia
- **📱 Escalação**: Cliente precisa de atendimento

## 🚀 Deploy

### 🐳 Docker

```dockerfile
# Build da imagem
docker build -t royal-club-bot .

# Executar container
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e API_KEY="your-key" \
  royal-club-bot
```

### ☁️ Cloud Platforms

- **✅ Heroku**: Deploy com git push
- **✅ Railway**: Automação completa
- **✅ DigitalOcean**: VPS personalizada
- **✅ AWS**: Escalabilidade enterprise

### 📊 Production Checklist

- [ ] PostgreSQL configurado
- [ ] Variáveis de ambiente setadas
- [ ] SSL/HTTPS habilitado
- [ ] Backups automáticos
- [ ] Monitoring ativo
- [ ] Rate limits ajustados

## 🔒 Segurança

### 🛡️ Medidas Implementadas

- **🔐 API Key Authentication**
- **⚡ Rate Limiting Inteligente**
- **🚫 Input Validation (Zod)**
- **📝 Logs Sem Dados Sensíveis**
- **🔒 Headers de Segurança (Helmet)**
- **🌐 CORS Configurado**

### 🔍 Dados Protegidos

Informações automaticamente mascaradas nos logs:
- CPF, telefones, e-mails
- Tokens e chaves de API
- Dados de cartão de crédito
- Senhas e segredos

## 📞 Suporte

### 🆘 Em Caso de Problemas

1. **📖 Consulte a documentação**
2. **🔍 Verifique os logs**: `tail -f logs/app.log`
3. **⚡ Restart do serviço**: `npm start`
4. **💬 Contato**: admin@royalclub.com

### 🐛 Reportar Bugs

```bash
# Inclua nas informações:
- Versão do Node.js
- Sistema operacional
- Logs de erro
- Passos para reproduzir
```

## 🎯 Roadmap

### 🚀 Próximas Features

- [ ] **🤖 IA Conversacional** (GPT integration)
- [ ] **📊 Dashboard Analytics** (React admin)
- [ ] **📱 App Mobile** (React Native)
- [ ] **🔄 Multi-eventos** (gerenciamento completo)
- [ ] **💬 Chat ao vivo** (integração humana)
- [ ] **📈 A/B Testing** (otimização de conversão)

### 🌟 Melhorias Planejadas

- [ ] **⚡ Performance**: Cache Redis
- [ ] **🔐 Segurança**: 2FA para admin
- [ ] **📊 Analytics**: Google Analytics
- [ ] **🌍 I18n**: Suporte multi-idioma
- [ ] **🎨 Templates**: Mensagens personalizáveis

---

## 📄 Licença

MIT License - Use livremente para seus projetos!

## 👥 Equipe

Desenvolvido com ❤️ pela equipe **Royal Club**

- **🎭 Cliente**: Royal Club
- **🎵 Evento**: MC Daniel Falcão
- **💻 Tecnologia**: WhatsApp + TypeScript + Clean Architecture

---

**🎉 Pronto para automatizar suas vendas? Vamos fazer acontecer! 🚀**
