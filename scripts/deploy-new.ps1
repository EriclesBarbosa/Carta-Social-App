#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instala a aplicação Carta Social num servidor Windows novo (primeira instalação).

.DESCRIPTION
    Configura o ambiente completo: PostgreSQL, Django backend, Next.js frontend,
    IIS e serviços Celery. Suporta os ambientes 'producao' e 'staging'.
    Requer o dump de base de dados para popular as tabelas de geografia,
    domínios e grupos/permissões.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER AppRoot
    Substitui a pasta raiz do ambiente. Usar apenas se não quiser o caminho padrão.

.PARAMETER DbPassword
    Password para o utilizador PostgreSQL. Obrigatório.

.PARAMETER DumpPath
    Caminho para o ficheiro SQL de dump de produção (carta_social_data_db.sql).
    Sem este ficheiro os dropdowns de geografia e domínios ficam vazios.

.PARAMETER RepoUrl
    URL do repositório git.

.EXAMPLE
    .\scripts\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql"
    .\scripts\deploy-new.ps1 -Ambiente staging -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql"
    .\scripts\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql" -AppRoot "D:\apps\cartasocial"

.NOTES
    Pré-requisitos (instalar manualmente antes de correr este script):
      - Git
      - Python 3.11+  (python.org)
      - Node.js 20+   (nodejs.org)
      - PostgreSQL 16 (postgresql.org) — serviço a correr
      - IIS com módulos: URL Rewrite, Application Request Routing
      - WebAdministration PowerShell module (vem com IIS)

    Dados críticos que vêm do dump:
      - Tabela 'geografia'     → dropdowns ilha/concelho/freguesia/zona/lugar
      - Tabela 'dominio'       → tipos de equipamento, serviço, regime propriedade, etc.
      - auth_group             → grupos DGIS, Agentes, Proprietário, Gestor, MFIDS
      - auth_group_permissions → permissões por grupo (can_access_frontend, etc.)

    Sem o dump estas tabelas ficam vazias e o sistema não é utilizável.
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente  = "producao",
    [string]$AppRoot   = "",
    [Parameter(Mandatory)]
    [string]$DbPassword,
    [string]$DumpPath  = "",
    [string]$RepoUrl   = "https://github.com/dgis-cv/carta-social-app.git"
)

$ErrorActionPreference = "Stop"

# ── Configuração por ambiente ─────────────────────────────────────────────────
$configs = @{
    producao = @{
        AppRoot      = "C:\apps\cartasocial"
        BackendDir   = "C:\apps\cartasocial\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial\frontend\mfids_cs_app"
        LogDir       = "C:\apps\cartasocial\logs"
        BackupDir    = "C:\apps\cartasocial\backups"
        Python       = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip          = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API      = "CartaSocial-API"
        IIS_App      = "CartaSocial-App"
        IIS_API_Port = 8000
        IIS_App_Port = 4000
        DbName       = "DB_DGIS_SITE"
        DbUser       = "mfids_user"
        ApiUrl       = "http://localhost:8000"
        SmokePort    = 8099
    }
    staging = @{
        AppRoot      = "C:\apps\cartasocial-staging"
        BackendDir   = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial-staging\frontend\mfids_cs_app"
        LogDir       = "C:\apps\cartasocial-staging\logs"
        BackupDir    = "C:\apps\cartasocial-staging\backups"
        Python       = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip          = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API      = "CartaSocial-API-Staging"
        IIS_App      = "CartaSocial-App-Staging"
        IIS_API_Port = 8001
        IIS_App_Port = 4001
        DbName       = "DB_DGIS_SITE_STAGING"
        DbUser       = "mfids_user_staging"
        ApiUrl       = "http://localhost:8001"
        SmokePort    = 8098
    }
}

$cfg = $configs[$Ambiente]

# Override AppRoot se fornecido explicitamente
if ($AppRoot) {
    $cfg.AppRoot     = $AppRoot
    $cfg.BackendDir  = "$AppRoot\backend\BackEnd\mfids"
    $cfg.FrontDir    = "$AppRoot\frontend\mfids_cs_app"
    $cfg.LogDir      = "$AppRoot\logs"
    $cfg.BackupDir   = "$AppRoot\backups"
    $cfg.Python      = "$AppRoot\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
    $cfg.Pip         = "$AppRoot\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$lockFile  = "$env:TEMP\cartasocial-deploy-new-$Ambiente.lock"
$LogFile   = "$($cfg.LogDir)\deploy-new-$timestamp.log"

New-Item -ItemType Directory -Path $cfg.LogDir -Force | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content $LogFile $line
}

function Abort($msg) {
    Log "❌ ABORTADO: $msg"
    Log "   Log: $LogFile"
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    exit 1
}

function Check-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Abort "'$cmd' não encontrado. Instala o pré-requisito e volta a correr."
    }
}

# ── LOCK: prevenir instalações concorrentes ───────────────────────────────────
if (Test-Path $lockFile) {
    $lockInfo = Get-Content $lockFile -Raw -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "ERRO: Deploy já em curso para '$($Ambiente.ToUpper())'!" -ForegroundColor Red
    Write-Host "  Iniciado por: $lockInfo" -ForegroundColor Yellow
    Write-Host "  Se não há deploy activo, remover: $lockFile`n" -ForegroundColor Gray
    exit 1
}
"$(whoami) | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $env:COMPUTERNAME" `
    | Set-Content $lockFile -Encoding UTF8

try {

Log "════════════════════════════════════════════════════════"
Log " Carta Social — Deploy de Nova Instalação ($($Ambiente.ToUpper()))"
Log " Data/hora : $(Get-Date)"
Log " AppRoot   : $($cfg.AppRoot)"
Log " Dump      : $(if ($DumpPath) { $DumpPath } else { 'NÃO fornecido — dados iniciais em falta' })"
Log "════════════════════════════════════════════════════════"

# ── FASE 0: Verificar pré-requisitos ─────────────────────────────────────────
Log "==> 0/9  A verificar pré-requisitos..."
Check-Command git
Check-Command python
Check-Command node
Check-Command npm
Check-Command psql

$pyVer   = python --version 2>&1
$nodeVer = node --version 2>&1
Log "    Python : $pyVer"
Log "    Node   : $nodeVer"

# Espaço em disco (mínimo 5 GB para nova instalação)
$drive  = Split-Path $cfg.AppRoot -Qualifier
$disk   = Get-PSDrive ($drive.TrimEnd(':'))
$freeGB = [math]::Round($disk.Free / 1GB, 1)
if ($freeGB -lt 5) {
    Abort "Espaço insuficiente em $drive`: $freeGB GB disponíveis (mínimo 5 GB)"
}
Log "    Disco  : $freeGB GB livres em $drive"

if ($DumpPath -and -not (Test-Path $DumpPath)) {
    Abort "DumpPath '$DumpPath' não existe."
}
if (-not $DumpPath) {
    Log "⚠️  AVISO: dump não fornecido."
    Log "   As tabelas 'geografia', 'dominio', grupos e permissões ficarão vazias."
    Log "   O sistema arranca mas não é utilizável sem estes dados."
}

# ── FASE 1: Criar estrutura de pastas ─────────────────────────────────────────
Log "==> 1/9  A criar estrutura de pastas..."
New-Item -ItemType Directory -Path "$($cfg.AppRoot)\backend"  -Force | Out-Null
New-Item -ItemType Directory -Path "$($cfg.AppRoot)\frontend" -Force | Out-Null
New-Item -ItemType Directory -Path $cfg.BackupDir             -Force | Out-Null

# ── FASE 2: Clonar repositório ────────────────────────────────────────────────
Log "==> 2/9  A clonar repositório..."
if (Test-Path "$($cfg.AppRoot)\backend\.git") {
    Log "    Repositório já existe — a fazer pull..."
    Set-Location "$($cfg.AppRoot)\backend"
    git pull origin main 2>&1 | ForEach-Object { Log "    git: $_" }
} else {
    git clone $RepoUrl "$($cfg.AppRoot)\backend" 2>&1 | ForEach-Object { Log "    git: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "git clone falhou" }
}

# Copiar frontend para pasta separada
if (-not (Test-Path $cfg.FrontDir)) {
    Copy-Item "$($cfg.AppRoot)\backend\mfids_cs_app" $cfg.FrontDir -Recurse
    Log "    Frontend copiado para $($cfg.FrontDir)"
}

# ── FASE 3: Configurar base de dados PostgreSQL ───────────────────────────────
Log "==> 3/9  A configurar base de dados PostgreSQL..."

$env:PGPASSWORD = "postgres"   # password do superuser postgres (ajustar se necessário)

$createUser = "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$($cfg.DbUser)') THEN CREATE USER $($cfg.DbUser) WITH PASSWORD '$DbPassword'; END IF; END `$`$;"
$createDb   = "SELECT 'CREATE DATABASE ""$($cfg.DbName)"" OWNER $($cfg.DbUser)' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$($cfg.DbName)')\gexec"

psql -U postgres -c $createUser 2>&1 | ForEach-Object { Log "    pg: $_" }
psql -U postgres -c $createDb   2>&1 | ForEach-Object { Log "    pg: $_" }

if ($DumpPath) {
    Log "    A restaurar dump de produção (pode demorar alguns minutos)..."
    $env:PGPASSWORD = $DbPassword
    psql -U $cfg.DbUser -d $cfg.DbName -f $DumpPath 2>&1 | ForEach-Object { Log "    pg: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "Restauro do dump falhou" }
    Log "    ✅ Dump restaurado — geografia, domínios, grupos e permissões disponíveis."
    $env:PGPASSWORD = ""
}

# ── FASE 4: Configurar .env do backend ────────────────────────────────────────
Log "==> 4/9  A configurar .env do backend..."
$envFile = "$($cfg.BackendDir)\.env"
if (-not (Test-Path $envFile)) {
    Log "    .env não encontrado — a iniciar configuração guiada..."

    # Gerar SECRET_KEY via Python stdlib (secrets module, criptograficamente seguro)
    $secretKey = python -c "import secrets, string; chars = string.ascii_letters + string.digits + '!@#%^&*(-_=+)'; print(''.join(secrets.choice(chars) for _ in range(50)))"

    Write-Host ""
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   Configuração de Secrets — responde às perguntas abaixo." -ForegroundColor Cyan
    Write-Host "   Prima ENTER para deixar vazio (pode preencher depois no .env)." -ForegroundColor Gray
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # EMAIL_HOST_PASSWORD — necessário para reset de password
    Write-Host "  [1/4] EMAIL_HOST_PASSWORD" -ForegroundColor Yellow
    Write-Host "        App Password do Gmail (conta mfids.dgis@gmail.com)." -ForegroundColor Gray
    Write-Host "        Gerar em: Conta Google → Segurança → Palavras-passe de aplicações" -ForegroundColor Gray
    $emailPass = Read-Host "        Valor"

    # Domínio de produção — para referência (ALLOWED_HOSTS está em settings.py)
    Write-Host ""
    Write-Host "  [2/4] DOMÍNIO DE PRODUÇÃO" -ForegroundColor Yellow
    Write-Host "        Ex: cartasocial.dgis.gov.cv  ou  84.247.171.243" -ForegroundColor Gray
    Write-Host "        (Usado para gerar nota sobre ALLOWED_HOSTS e CORS)" -ForegroundColor Gray
    $prodDomain = Read-Host "        Valor"

    # CELERY_BROKER — Redis broker URL
    Write-Host ""
    Write-Host "  [3/4] CELERY_BROKER_URL  (deixar vazio se não usar Celery)" -ForegroundColor Yellow
    Write-Host "        Ex: redis://localhost:6379" -ForegroundColor Gray
    $celeryBroker = Read-Host "        Valor"

    # DSN_KEY — Sentry error tracking
    Write-Host ""
    Write-Host "  [4/4] DSN_KEY do Sentry  (deixar vazio se não usar Sentry)" -ForegroundColor Yellow
    Write-Host "        Ex: https://abc123@o123456.ingest.sentry.io/789" -ForegroundColor Gray
    $sentryDsn = Read-Host "        Valor"

    Write-Host ""

    $envContent = @"
DEBUG=False
SECRET_KEY=$secretKey
DB_ENGINE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$($cfg.DbName)
DB_USERNAME=$($cfg.DbUser)
DB_PASS=$DbPassword
EMAIL_HOST_PASSWORD=$emailPass
"@

    if ($celeryBroker) {
        $envContent += "`nCELERY_BROKER=$celeryBroker"
    }
    if ($sentryDsn) {
        $envContent += "`nDSN_KEY=$sentryDsn"
    }

    Set-Content $envFile $envContent -Encoding UTF8
    Log "    ✅ .env criado com as variáveis configuradas."

    # Nota sobre ALLOWED_HOSTS se domínio foi fornecido
    if ($prodDomain) {
        Log "    ⚠️  Domínio '$prodDomain' fornecido — adicionar manualmente a:"
        Log "       BackEnd\mfids\core\settings.py → ALLOWED_HOSTS e CORS_ALLOWED_ORIGINS"
        Log "       (não são lidos do .env; estão hardcoded no ficheiro)"
    }
    if (-not $emailPass) {
        Log "    ⚠️  EMAIL_HOST_PASSWORD vazio — reset de password não vai funcionar."
        Log "       Preencher depois em: $envFile"
    }
} else {
    Log "    .env já existe — mantido sem alterações."
}

# ── FASE 5: Instalar dependências Python e migrar ─────────────────────────────
Log "==> 5/9  A instalar dependências Python..."
Set-Location $cfg.BackendDir

if (-not (Test-Path $cfg.Python)) {
    python -m venv venv_prod 2>&1 | ForEach-Object { Log "    venv: $_" }
} else {
    Log "    venv_prod já existe."
}
& $cfg.Pip install --upgrade pip 2>&1 | Out-Null
& $cfg.Pip install -r requirements.txt 2>&1 | ForEach-Object { Log "    pip: $_" }
if ($LASTEXITCODE -ne 0) { Abort "pip install falhou" }

Log "    A aplicar migrações Django..."
& $cfg.Python manage.py migrate 2>&1 | ForEach-Object { Log "    migrate: $_" }
if ($LASTEXITCODE -ne 0) { Abort "manage.py migrate falhou" }

Log "    A recolher ficheiros estáticos..."
& $cfg.Python manage.py collectstatic --no-input 2>&1 | ForEach-Object { Log "    static: $_" }
if ($LASTEXITCODE -ne 0) { Abort "collectstatic falhou" }

# ── FASE 6: Verificar dados críticos ──────────────────────────────────────────
Log "==> 6/9  A verificar dados críticos na base de dados..."

$geoCount = & $cfg.Python -c "
import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
django.setup()
from apps.organizacoes.models import Geografia
print(Geografia.objects.count())
" 2>$null

$groupCount = & $cfg.Python -c "
import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
django.setup()
from django.contrib.auth.models import Group
print(Group.objects.count())
" 2>$null

Log "    Registos em 'geografia' : $geoCount"
Log "    Grupos em 'auth_group'  : $groupCount"

if ([int]$geoCount -eq 0) {
    Log "⚠️  AVISO: tabela 'geografia' vazia — dropdowns de ilha/concelho não vão funcionar."
    Log "   Solução: restaurar o dump ou:"
    Log "      psql -U $($cfg.DbUser) -d $($cfg.DbName) -f <dump>.sql"
}
if ([int]$groupCount -lt 5) {
    Log "⚠️  AVISO: menos de 5 grupos — permissões podem estar incompletas."
    Log "   Solução: restaurar o dump ou:"
    Log "      $($cfg.Python) manage.py loaddata fixtures/groups_permissions.json"
}

# ── FASE 7: Build do frontend Next.js ─────────────────────────────────────────
Log "==> 7/9  A construir frontend Next.js..."
Set-Location $cfg.FrontDir

$envLocal = "$($cfg.FrontDir)\.env.local"
if (-not (Test-Path $envLocal)) {
    Set-Content $envLocal "API_URL=$($cfg.ApiUrl)" -Encoding UTF8
    Log "    .env.local criado com API_URL=$($cfg.ApiUrl)"
}

npm ci --legacy-peer-deps 2>&1 | ForEach-Object { Log "    npm: $_" }
if ($LASTEXITCODE -ne 0) { Abort "npm ci falhou" }

npm run build 2>&1 | ForEach-Object { Log "    build: $_" }
if ($LASTEXITCODE -ne 0) { Abort "npm run build falhou" }

Copy-Item "$($cfg.FrontDir)\public"       "$($cfg.FrontDir)\.next\standalone\public"       -Recurse -Force
Copy-Item "$($cfg.FrontDir)\.next\static" "$($cfg.FrontDir)\.next\standalone\.next\static" -Recurse -Force
Log "    ✅ Build completo e assets copiados para standalone."

# ── FASE 8: Configurar IIS ────────────────────────────────────────────────────
Log "==> 8/9  A configurar IIS..."
Import-Module WebAdministration -ErrorAction SilentlyContinue

if (-not (Get-Module WebAdministration)) {
    Log "⚠️  Módulo WebAdministration não disponível — configuração IIS ignorada."
    Log "   Configura manualmente os dois sites IIS:"
    Log "     $($cfg.IIS_API)  → porta $($cfg.IIS_API_Port) → $($cfg.BackendDir)"
    Log "     $($cfg.IIS_App)  → porta $($cfg.IIS_App_Port) → $($cfg.FrontDir)\.next\standalone"
} else {
    if (-not (Get-Website -Name $cfg.IIS_API -ErrorAction SilentlyContinue)) {
        New-Website -Name $cfg.IIS_API -Port $cfg.IIS_API_Port -PhysicalPath $cfg.BackendDir -Force
        Log "    Site $($cfg.IIS_API) criado na porta $($cfg.IIS_API_Port)."
    } else {
        Log "    Site $($cfg.IIS_API) já existe."
    }

    if (-not (Get-Website -Name $cfg.IIS_App -ErrorAction SilentlyContinue)) {
        New-Website -Name $cfg.IIS_App -Port $cfg.IIS_App_Port -PhysicalPath "$($cfg.FrontDir)\.next\standalone" -Force
        Log "    Site $($cfg.IIS_App) criado na porta $($cfg.IIS_App_Port)."
    } else {
        Log "    Site $($cfg.IIS_App) já existe."
    }
}

# ── FASE 9: Smoke test (Django directo, sem IIS) ──────────────────────────────
Log "==> 9/9  Smoke test (servidor de teste directo)..."
Set-Location $cfg.BackendDir

$smokeUrl = "http://127.0.0.1:$($cfg.SmokePort)/api/login/"
$djProc   = Start-Process -FilePath $cfg.Python `
                          -ArgumentList "manage.py runserver 127.0.0.1:$($cfg.SmokePort) --noreload" `
                          -PassThru -WindowStyle Hidden
Log "    Servidor de teste a iniciar (PID $($djProc.Id), porta $($cfg.SmokePort))..."

$maxTries = 10; $interval = 3
$smokeOK  = $false
for ($i = 1; $i -le $maxTries; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $smokeUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -in 200, 405) {
            Log "✅ Django responde: HTTP $($r.StatusCode) (tentativa $i)"
            $smokeOK = $true; break
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -in 200, 405) { Log "✅ Django: HTTP $code"; $smokeOK = $true; break }
        }
        if ($i -lt $maxTries) { Start-Sleep -Seconds $interval }
    }
}
$djProc | Stop-Process -ErrorAction SilentlyContinue

if (-not $smokeOK) {
    Log "⚠️  Django não respondeu após $($maxTries * $interval)s — verificar log acima para erros."
    Log "   A instalação pode ainda funcionar após configurar IIS correctamente."
}

Log "════════════════════════════════════════════════════════"
Log " ✅ Deploy de nova instalação concluído!"
Log ""
Log " PASSOS MANUAIS RESTANTES:"
Log "  1. Preencher EMAIL_HOST_PASSWORD no ficheiro .env:"
Log "     $envFile"
Log "  2. Se o dump não foi restaurado, importar:"
Log "     psql -U $($cfg.DbUser) -d $($cfg.DbName) -f <dump>.sql"
Log "     $($cfg.Python) manage.py migrate"
Log "  3. Criar superutilizador:"
Log "     $($cfg.Python) manage.py createsuperuser"
Log "  4. Configurar IIS reverse proxy:"
Log "     - Backend (gunicorn/wsgi): porta $($cfg.IIS_API_Port)"
Log "     - Frontend (node server.js): porta $($cfg.IIS_App_Port)"
Log "  5. Instalar serviços Windows para Celery (ver docs\celery.md)"
Log ""
Log " Ambiente : $($Ambiente.ToUpper())"
Log " Log      : $LogFile"
Log "════════════════════════════════════════════════════════"

} finally {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
