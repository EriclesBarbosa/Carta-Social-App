#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instala a aplicação Carta Social num servidor Windows novo (primeira instalação).

.DESCRIPTION
    Configura o ambiente completo: PostgreSQL, Django backend, Next.js frontend,
    IIS e serviços Celery. Requer o dump de base de dados para popular as tabelas
    de geografia, domínios e grupos/permissões.

.PARAMETER AppRoot
    Pasta raiz onde o repositório será clonado. Default: C:\apps\cartasocial

.PARAMETER DbPassword
    Password para o utilizador PostgreSQL 'mfids_user'. Obrigatório.

.PARAMETER DumpPath
    Caminho para o ficheiro SQL de dump de produção (carta_social_data_db.sql).
    Sem este ficheiro os dropdowns de geografia e domínios ficam vazios.

.PARAMETER RepoUrl
    URL do repositório git. Default: URL do repositório actual.

.EXAMPLE
    .\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql"
    .\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql" -AppRoot "D:\apps\cartasocial"

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
    [string]$AppRoot   = "C:\apps\cartasocial",
    [Parameter(Mandatory)]
    [string]$DbPassword,
    [string]$DumpPath  = "",
    [string]$RepoUrl   = "https://github.com/dgis-cv/carta-social-app.git"
)

# ── Configuração de caminhos ──────────────────────────────────────────────────
$BackendDir = "$AppRoot\backend\BackEnd\mfids"
$FrontDir   = "$AppRoot\frontend\mfids_cs_app"
$LogDir     = "$AppRoot\logs"
$Python     = "$BackendDir\venv_prod\Scripts\python.exe"
$Pip        = "$BackendDir\venv_prod\Scripts\pip.exe"
$PgPass     = $env:PGPASSWORD = "postgres"   # password do superuser postgres (ajustar se necessário)
$LogFile    = "$LogDir\deploy-new-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
# ─────────────────────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content $LogFile $line
}

function Abort($msg) {
    Log "❌ ABORTADO: $msg"
    Log "   Log: $LogFile"
    exit 1
}

function Check-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Abort "'$cmd' não encontrado. Instala o pré-requisito e volta a correr."
    }
}

Log "════════════════════════════════════════════════════════"
Log " Carta Social — Deploy de Nova Instalação"
Log " Data/hora : $(Get-Date)"
Log " AppRoot   : $AppRoot"
Log " Dump      : $(if ($DumpPath) { $DumpPath } else { 'NÃO fornecido — dados iniciais em falta' })"
Log "════════════════════════════════════════════════════════"

# ── FASE 0: Verificar pré-requisitos ─────────────────────────────────────────
Log "==> 0/9  A verificar pré-requisitos..."
Check-Command git
Check-Command python
Check-Command node
Check-Command npm
Check-Command psql

$pyVer = python --version 2>&1
$nodeVer = node --version 2>&1
Log "    Python : $pyVer"
Log "    Node   : $nodeVer"

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
New-Item -ItemType Directory -Path "$AppRoot\backend"  -Force | Out-Null
New-Item -ItemType Directory -Path "$AppRoot\frontend" -Force | Out-Null
New-Item -ItemType Directory -Path "$AppRoot\backups"  -Force | Out-Null

# ── FASE 2: Clonar repositório ────────────────────────────────────────────────
Log "==> 2/9  A clonar repositório..."
if (Test-Path "$AppRoot\backend\.git") {
    Log "    Repositório já existe — a fazer pull..."
    Set-Location "$AppRoot\backend"
    git pull origin main 2>&1 | ForEach-Object { Log "    git: $_" }
} else {
    git clone $RepoUrl "$AppRoot\backend" 2>&1 | ForEach-Object { Log "    git: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "git clone falhou" }
}

# Copiar frontend para pasta separada (ou usar symlink)
if (-not (Test-Path $FrontDir)) {
    Copy-Item "$AppRoot\backend\mfids_cs_app" $FrontDir -Recurse
}

# ── FASE 3: Configurar base de dados PostgreSQL ───────────────────────────────
Log "==> 3/9  A configurar base de dados PostgreSQL..."

$createUser = "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mfids_user') THEN CREATE USER mfids_user WITH PASSWORD '$DbPassword'; END IF; END `$`$;"
$createDb   = "SELECT 'CREATE DATABASE ""DB_DGIS_SITE"" OWNER mfids_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'DB_DGIS_SITE')\gexec"

psql -U postgres -c $createUser 2>&1 | ForEach-Object { Log "    pg: $_" }
psql -U postgres -c $createDb   2>&1 | ForEach-Object { Log "    pg: $_" }

if ($DumpPath) {
    Log "    A restaurar dump de produção (pode demorar alguns minutos)..."
    psql -U mfids_user -d "DB_DGIS_SITE" -f $DumpPath 2>&1 | ForEach-Object { Log "    pg: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "Restauro do dump falhou" }
    Log "    ✅ Dump restaurado — geografia, domínios, grupos e permissões disponíveis."
}

# ── FASE 4: Configurar .env do backend ────────────────────────────────────────
Log "==> 4/9  A verificar .env do backend..."
$envFile = "$BackendDir\.env"
if (-not (Test-Path $envFile)) {
    Log "    .env não encontrado — a criar a partir do env.sample..."
    Copy-Item "$BackendDir\env.sample" $envFile

    # Injectar valores obrigatórios
    $secretKey = python -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits + '!@#%^&*(-_=+)') for _ in range(50)))"

    $envContent = @"
DEBUG=False
SECRET_KEY=$secretKey
DB_ENGINE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DB_DGIS_SITE
DB_USERNAME=mfids_user
DB_PASS=$DbPassword
EMAIL_HOST_PASSWORD=
"@
    Set-Content $envFile $envContent -Encoding UTF8
    Log "    ✅ .env criado. Preenche EMAIL_HOST_PASSWORD antes de usar o sistema."
} else {
    Log "    .env já existe — mantido sem alterações."
}

# ── FASE 5: Instalar dependências Python e migrar ─────────────────────────────
Log "==> 5/9  A instalar dependências Python..."
Set-Location $BackendDir

python -m venv venv_prod 2>&1 | ForEach-Object { Log "    venv: $_" }
& $Pip install --upgrade pip 2>&1 | Out-Null
& $Pip install -r requirements.txt 2>&1 | ForEach-Object { Log "    pip: $_" }
if ($LASTEXITCODE -ne 0) { Abort "pip install falhou" }

Log "    A aplicar migrações Django..."
& $Python manage.py migrate 2>&1 | ForEach-Object { Log "    migrate: $_" }
if ($LASTEXITCODE -ne 0) { Abort "migrate falhou" }

Log "    A recolher ficheiros estáticos..."
& $Python manage.py collectstatic --no-input 2>&1 | ForEach-Object { Log "    static: $_" }
if ($LASTEXITCODE -ne 0) { Abort "collectstatic falhou" }

# ── FASE 6: Verificar dados críticos ──────────────────────────────────────────
Log "==> 6/9  A verificar dados críticos na base de dados..."

$geoCount = & $Python -c "
import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
django.setup()
from apps.organizacoes.models import Geografia
print(Geografia.objects.count())
" 2>$null
Log "    Registos em 'geografia' : $geoCount"

$groupCount = & $Python -c "
import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
django.setup()
from django.contrib.auth.models import Group
print(Group.objects.count())
" 2>$null
Log "    Grupos em 'auth_group'  : $groupCount"

if ([int]$geoCount -eq 0) {
    Log "⚠️  AVISO: tabela 'geografia' vazia — dropdowns de ilha/concelho não vão funcionar."
    Log "   Solução: restaurar o dump de produção ou importar fixture de geografias."
}
if ([int]$groupCount -lt 5) {
    Log "⚠️  AVISO: menos de 5 grupos encontrados — permissões podem estar incompletas."
    Log "   Solução: restaurar o dump ou executar:"
    Log "      python manage.py loaddata fixtures/groups_permissions.json"
}

# ── FASE 7: Build do frontend Next.js ─────────────────────────────────────────
Log "==> 7/9  A construir frontend Next.js..."
Set-Location $FrontDir

$envLocal = "$FrontDir\.env.local"
if (-not (Test-Path $envLocal)) {
    Set-Content $envLocal "API_URL=http://localhost:8000" -Encoding UTF8
    Log "    .env.local criado com API_URL=http://localhost:8000"
}

npm ci --legacy-peer-deps 2>&1 | ForEach-Object { Log "    npm: $_" }
if ($LASTEXITCODE -ne 0) { Abort "npm ci falhou" }

npm run build 2>&1 | ForEach-Object { Log "    build: $_" }
if ($LASTEXITCODE -ne 0) { Abort "npm run build falhou" }

Copy-Item "$FrontDir\public"       "$FrontDir\.next\standalone\public"       -Recurse -Force
Copy-Item "$FrontDir\.next\static" "$FrontDir\.next\standalone\.next\static" -Recurse -Force
Log "    ✅ Build completo e assets copiados para standalone."

# ── FASE 8: Configurar IIS ────────────────────────────────────────────────────
Log "==> 8/9  A configurar IIS..."
Import-Module WebAdministration -ErrorAction SilentlyContinue

if (-not (Get-Module WebAdministration)) {
    Log "⚠️  Módulo WebAdministration não disponível — configuração IIS ignorada."
    Log "   Configura manualmente os dois sites IIS:"
    Log "     CartaSocial-API  → porta 8000 → $BackendDir (Python/FastCGI ou proxy para gunicorn)"
    Log "     CartaSocial-App  → porta 4000 → $FrontDir\.next\standalone (node server.js)"
} else {
    # Backend (porta 8000)
    if (-not (Get-Website -Name "CartaSocial-API" -ErrorAction SilentlyContinue)) {
        New-Website -Name "CartaSocial-API" -Port 8000 -PhysicalPath $BackendDir -Force
        Log "    Site CartaSocial-API criado na porta 8000."
    } else {
        Log "    Site CartaSocial-API já existe."
    }

    # Frontend (porta 4000)
    if (-not (Get-Website -Name "CartaSocial-App" -ErrorAction SilentlyContinue)) {
        New-Website -Name "CartaSocial-App" -Port 4000 -PhysicalPath "$FrontDir\.next\standalone" -Force
        Log "    Site CartaSocial-App criado na porta 4000."
    } else {
        Log "    Site CartaSocial-App já existe."
    }
}

# ── FASE 9: Smoke test ────────────────────────────────────────────────────────
Log "==> 9/9  Smoke test..."
Set-Location $BackendDir

# Testar Django directamente (sem IIS)
$djProc = Start-Process -FilePath $Python -ArgumentList "manage.py runserver 8001 --noreload" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 6

try {
    $r = Invoke-WebRequest -Uri "http://localhost:8001/api/login/" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($r.StatusCode -in 200, 405) {
        Log "✅ Django responde: HTTP $($r.StatusCode)"
    }
} catch {
    Log "⚠️  Django não respondeu no teste rápido: $($_.Exception.Message)"
}
$djProc | Stop-Process -ErrorAction SilentlyContinue

Log "════════════════════════════════════════════════════════"
Log " ✅ Deploy de nova instalação concluído!"
Log ""
Log " PASSOS MANUAIS RESTANTES:"
Log "  1. Preencher EMAIL_HOST_PASSWORD no $envFile"
Log "  2. Se o dump não foi restaurado, importar:"
Log "     psql -U mfids_user -d DB_DGIS_SITE -f <dump>.sql"
Log "  3. Criar superutilizador:"
Log "     $Python manage.py createsuperuser"
Log "  4. Configurar IIS reverse proxy para gunicorn (backend)"
Log "     e para 'node server.js' (frontend standalone)"
Log "  5. Instalar e configurar serviços Windows para Celery"
Log "     (ver docs\celery.md)"
Log ""
Log " Log completo: $LogFile"
Log "════════════════════════════════════════════════════════"
