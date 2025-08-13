# 🎭 GUIA DE IMPLANTAÇÃO - ROYAL CLUB WHATSAPP AUTOMATION

## 📋 Pré-requisitos

### Sistema Operacional
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Windows 10/11 com WSL2
- macOS 12+

### Software Necessário
- **Docker** (versão 20.10+)
- **Docker Compose** (versão 2.0+)
- **Git**
- **Node.js** 18+ (opcional, para desenvolvimento)

## 🚀 Instalação Rápida

### 1. Instalar Docker e Docker Compose

#### Ubuntu/Debian:
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Reiniciar sessão ou executar:
newgrp docker
```

#### CentOS/RHEL:
```bash
# Instalar Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. Clonar o Repositório

```bash
# Clonar o projeto
git clone https://github.com/contatoroyalclubms-sudo/SistemaAdm.git
cd SistemaAdm

# Mudar para o branch funcional
git checkout devin/1755063270-whatsapp-automation-deployment
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações (opcional)
nano .env
```

**Configurações importantes no .env:**
```env
# Porta da aplicação
PORT=8080

# Configurações do WhatsApp
WA_SESSION_NAME=royal-club-session
WA_SESSION_PATH=./storage/session

# Configurações do Chrome/Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
CHROME_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

# Configurações do Redis
REDIS_URL=redis://redis:6379

# Ambiente
NODE_ENV=production
```

## 🐳 Implantação com Docker

### 1. Construir e Iniciar os Serviços

```bash
# Construir todas as imagens
docker compose build --no-cache

# Iniciar todos os serviços
docker compose up -d

# Verificar status dos serviços
docker compose ps
```

**Saída esperada:**
```
NAME                     IMAGE                  STATUS
sistemaadm-app-1         sistemaadm-app         Up
sistemaadm-python-ai-1   sistemaadm-python-ai   Up (healthy)
sistemaadm-redis-1       redis:7-alpine         Up
```

### 2. Verificar Logs

```bash
# Ver logs de todos os serviços
docker compose logs

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs app
docker compose logs python-ai
```

## ✅ Verificação e Testes

### 1. Verificar Saúde dos Serviços

```bash
# Testar endpoint de saúde principal
curl http://localhost:8080/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","uptime":...,"environment":"production"}
```

### 2. Testar WhatsApp Service

```bash
# Verificar status do WhatsApp
curl http://localhost:8080/api/whatsapp/status

# Obter QR Code para conexão
curl http://localhost:8080/api/whatsapp/qr
```

### 3. Acessar Interface Web

Abra seu navegador e acesse:

- **Aplicação Principal**: http://localhost:8080
- **QR Code WhatsApp**: http://localhost:8080/api/whatsapp/qr
- **Documentação API**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/health

### 4. Conectar WhatsApp

1. Acesse: http://localhost:8080/api/whatsapp/qr
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde a mensagem "✅ WhatsApp connected successfully!" nos logs

```bash
# Verificar conexão nos logs
docker compose logs app | grep "WhatsApp"
```

## 🔧 Comandos Úteis

### Gerenciamento de Serviços

```bash
# Parar todos os serviços
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v

# Reiniciar um serviço específico
docker compose restart app

# Reconstruir e reiniciar
docker compose down && docker compose build --no-cache && docker compose up -d
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker compose logs -f app

# Executar comandos dentro do container
docker compose exec app bash
docker compose exec python-ai bash
```

### Backup e Restauração

```bash
# Backup do banco de dados
docker compose exec app npm run backup

# Backup dos dados de sessão WhatsApp
tar -czf whatsapp-session-backup.tar.gz storage/session/

# Restaurar sessão WhatsApp
tar -xzf whatsapp-session-backup.tar.gz
```

## 🐛 Solução de Problemas

### Problema: Serviços não iniciam

```bash
# Verificar logs de erro
docker compose logs

# Verificar portas em uso
sudo netstat -tulpn | grep :8080

# Limpar containers antigos
docker system prune -a
```

### Problema: WhatsApp não conecta

```bash
# Limpar sessão WhatsApp
rm -rf storage/session/*

# Reiniciar serviço WhatsApp
docker compose restart app

# Verificar logs específicos
docker compose logs app | grep -i whatsapp
```

### Problema: Erro de permissões

```bash
# Corrigir permissões de arquivos
sudo chown -R $USER:$USER storage/
chmod -R 755 storage/

# Verificar se usuário está no grupo docker
groups $USER
```

### Problema: Erro de memória/Chrome

```bash
# Verificar recursos disponíveis
free -h
df -h

# Aumentar limite de memória compartilhada
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 📊 Monitoramento de Produção

### Health Checks Automáticos

```bash
# Script de monitoramento (salvar como monitor.sh)
#!/bin/bash
while true; do
    echo "$(date): Checking services..."
    
    # Verificar app principal
    if curl -s http://localhost:8080/health > /dev/null; then
        echo "✅ App service: OK"
    else
        echo "❌ App service: FAILED"
    fi
    
    # Verificar WhatsApp
    if curl -s http://localhost:8080/api/whatsapp/status > /dev/null; then
        echo "✅ WhatsApp service: OK"
    else
        echo "❌ WhatsApp service: FAILED"
    fi
    
    sleep 60
done
```

### Logs Estruturados

```bash
# Configurar rotação de logs
sudo tee /etc/logrotate.d/royal-club << EOF
/var/log/royal-club/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

## 🔒 Segurança

### Configurações Recomendadas

```bash
# Configurar firewall
sudo ufw allow 8080/tcp
sudo ufw enable

# Configurar SSL/HTTPS (produção)
# Use nginx ou traefik como proxy reverso
```

### Backup Automático

```bash
# Script de backup diário (salvar como backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/royal-club"

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker compose exec -T app npm run backup > $BACKUP_DIR/db_$DATE.sql

# Backup da sessão WhatsApp
tar -czf $BACKUP_DIR/session_$DATE.tar.gz storage/session/

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 📞 Suporte

### Informações do Sistema

```bash
# Coletar informações para suporte
echo "=== SYSTEM INFO ===" > debug-info.txt
uname -a >> debug-info.txt
docker --version >> debug-info.txt
docker compose version >> debug-info.txt
echo "=== DOCKER SERVICES ===" >> debug-info.txt
docker compose ps >> debug-info.txt
echo "=== LOGS ===" >> debug-info.txt
docker compose logs --tail=100 >> debug-info.txt
```

### Contatos

- **Desenvolvedor**: @contatoroyalclubms-sudo
- **Repositório**: https://github.com/contatoroyalclubms-sudo/SistemaAdm
- **Issues**: https://github.com/contatoroyalclubms-sudo/SistemaAdm/issues

---

## 🎉 Conclusão

Após seguir este guia, você terá:

✅ Sistema Royal Club WhatsApp Automation 100% funcional  
✅ Todos os serviços rodando em Docker  
✅ WhatsApp conectado e operacional  
✅ Monitoramento e logs configurados  
✅ Backup e segurança implementados  

**O sistema está pronto para uso em produção!** 🎭
