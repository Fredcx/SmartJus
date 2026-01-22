#!/bin/bash
set -e

# ==========================================
# SETUP VPS - LEGAL SYSTEM (NATIVE)
# ==========================================

echo "🚀 Iniciando configuração do servidor..."

# 1. Atualizar sistema
echo "📦 Atualizando pacotes..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip nginx ufw certbot python3-certbot-nginx

# 2. Instalar Node.js 20
if ! command -v node &> /dev/null; then
    echo "🟢 Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js já instalado: $(node -v)"
fi

# 3. Instalar PM2 (Gerenciador de Processos)
if ! command -v pm2 &> /dev/null; then
    echo "🔄 Instalando PM2..."
    sudo npm install -g pm2
    sudo pm2 startup systemd
else
    echo "✅ PM2 já instalado."
fi

# 4. Configurar Firewall
echo "🛡️ Configurando Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 5. Criar diretório da aplicação
echo "📂 Criando pastas..."
mkdir -p /var/www/legal-system

echo "=========================================="
echo "✅ SETUP BÁSICO CONCLUÍDO!"
echo "Agora você pode rodar o deploy."
echo "=========================================="
