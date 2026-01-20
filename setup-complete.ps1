Write-Host "🚀 Setup Completo do Sistema Jurídico" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Cyan
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js não encontrado! Instale em https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Backend
Write-Host ""
Write-Host "🔧 Configurando Backend..." -ForegroundColor Cyan
cd backend

# Limpar instalações anteriores
Write-Host "🧹 Limpando instalações anteriores..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Instalar dependências
Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# Prisma
Write-Host ""
Write-Host "🗄️ Configurando Banco de Dados..." -ForegroundColor Cyan

# Limpar banco anterior
Remove-Item -Recurse -Force .\prisma\migrations -ErrorAction SilentlyContinue
Remove-Item .\prisma\dev.db -ErrorAction SilentlyContinue
Remove-Item .\dev.db -ErrorAction SilentlyContinue

# Gerar Prisma Client
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Criar migrations
Write-Host "📋 Criando tabelas..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Criar usuário admin
Write-Host "👤 Criando usuário admin..." -ForegroundColor Yellow
npx prisma db seed

# Frontend
Write-Host ""
Write-Host "🎨 Configurando Frontend..." -ForegroundColor Cyan
cd ../frontend

# Limpar
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Instalar
Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
npm install

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:3001/api
"@ | Out-File -FilePath ".env" -Encoding utf8
}

# Sucesso
Write-Host ""
Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📋 CREDENCIAIS DE LOGIN" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Email: " -NoNewline -ForegroundColor White
Write-Host "admin@legal.com" -ForegroundColor Cyan
Write-Host "Senha: " -NoNewline -ForegroundColor White
Write-Host "admin123" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🚀 PARA INICIAR O SISTEMA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Abra um terminal e execute:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  Abra OUTRO terminal e execute:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣  Acesse no navegador:" -ForegroundColor White
Write-Host "   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray