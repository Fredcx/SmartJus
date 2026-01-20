Write-Host "🐳 Iniciando Legal System com Docker..." -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não encontrado! Instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Parar containers antigos
Write-Host "🛑 Parando containers antigos..." -ForegroundColor Yellow
docker-compose down

# Iniciar
Write-Host "🚀 Iniciando containers (isso pode demorar na primeira vez)..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 ACESSO:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:3002" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ℹ️  Para ver os logs: docker-compose logs -f" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro ao iniciar containers." -ForegroundColor Red
}
