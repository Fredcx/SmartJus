#!/bin/bash
set -e

# ==========================================
# DEPLOY SCRIPT - LEGAL SYSTEM (NATIVE)
# ==========================================

echo "🚀 Iniciando Deploy..."

APP_DIR="/var/www/legal-system"
cd $APP_DIR

# 1. Setup Backend
echo "🔙 Configurando Backend..."
cd backend
if [ ! -f .env ]; then
    echo "⚠️ .env não encontrado! Copiando exemplo..."
    cp .env.example .env
fi

npm ci --production=false # Instala devDependencies para conseguir fazer o build
npx prisma generate
npm run build
cd ..

# 2. Setup Frontend
echo "🎨 Configurando Frontend..."
cd frontend
npm ci
npm run build
cd ..

# 3. Mover Build do Frontend para local que o Nginx leia
echo "📂 Movendo frontend build..."
# Garantir permissões para o Nginx ler
chmod -R 755 /var/www/legal-system

# 4. Iniciar/Reiniciar Aplicação
echo "🔄 Reiniciando PM2..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "=========================================="
echo "✅ DEPLOY CONCLUÍDO!"
echo "=========================================="
