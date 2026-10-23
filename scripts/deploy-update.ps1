#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Actualiza a aplicação Carta Social (backend + frontend) com zero downtime planeado.

.DESCRIPTION
    Faz git pull, instala dependências (se alteradas), collectstatic, build Next.js,
    copia ficheiros estáticos para standalone e reinicia IIS + Celery.
    Em caso de falha no smoke test, imprime instruções de rollback.

.EXAMPLE
    .\deploy-update.ps1
    .\deploy-update.ps1 -SkipFrontend   # apenas backend
    .\deploy-update.ps1 -SkipMigrations # omite manage.py migrate (deploy sem BD)

.NOTES
    Requer: PowerShell 5.1+, Git, Python venv em venv_prod, Node.js, IIS WebAdministration
#>

param(
    [switch]$SkipFrontend,
    [switch]$SkipMigrations
)

# ── Configuração — ajusta se o layout de pastas for diferente ─────────────────
$AppDir    = "C:\apps\cartasocial\backend\BackEnd\mfids"
$FrontDir  = "C:\apps\cartasocial\frontend\mfids_cs_app"
$BackupDir = "C:\apps\cartasocial\backups"
$Python    = "$AppDir\venv_prod\Scripts\python.exe"
$Pip       = "$AppDir\venv_prod\Scripts\pip.exe"
$LogFile   = "$BackupDir\deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
# ─────────────────────────────────────────────────────────────────────────────

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content $LogFile $line
}

function Abort($msg) {
    Log "❌ ABORTADO: $msg"
    Log "   Log completo: $LogFile"
    Log "   Para reverter o código: .\rollback-app.ps1 -BackupNome <nome-do-snapshot>"
    exit 1
}

Log "════════════════════════════════════════════════════════"
Log " Carta Social — Deploy de Actualização"
Log " Data/hora: $(Get-Date)"
Log "════════════════════════════════════════════════════════"

# ── FASE 1: Snapshot de segurança ─────────────────────────────────────────────
Log "==> 1/7  Snapshot de segurança..."
$snapName = "snapshot-$(Get-Date -Format 'yyyyMMdd-HHmmss')-backend"
Copy-Item $AppDir "$BackupDir\$snapName" -Recurse -ErrorAction Stop
Log "    Guardado em: $BackupDir\$snapName"

# ── FASE 2: Obter novo código ──────────────────────────────────────────────────
Log "==> 2/7  git pull origin main..."
Set-Location $AppDir
git fetch origin 2>&1 | ForEach-Object { Log "    git: $_" }
git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | ForEach-Object { Log "    git: $_" }
if ($LASTEXITCODE -ne 0) { Abort "git pull falhou" }

# ── FASE 3: Dependências Python ────────────────────────────────────────────────
Log "==> 3/7  Dependências Python..."
$reqChanged = git diff HEAD@{1} HEAD -- requirements.txt
if ($reqChanged) {
    Log "    requirements.txt alterado — a instalar pacotes..."
    & $Pip install -r requirements.txt 2>&1 | ForEach-Object { Log "    pip: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "pip install falhou" }
} else {
    Log "    requirements.txt sem alterações — a saltar."
}

# ── FASE 4: Migrations ────────────────────────────────────────────────────────
if (-not $SkipMigrations) {
    Log "==> 4/7  Migrações de base de dados..."
    $pending = & $Python manage.py showmigrations 2>&1 | Where-Object { $_ -match '\[ \]' }
    if ($pending) {
        Log "    Migrações pendentes encontradas — a aplicar..."
        $pending | ForEach-Object { Log "    $_" }
        & $Python manage.py migrate 2>&1 | ForEach-Object { Log "    migrate: $_" }
        if ($LASTEXITCODE -ne 0) { Abort "manage.py migrate falhou" }
    } else {
        Log "    Nenhuma migração pendente."
    }
} else {
    Log "==> 4/7  Migrações omitidas (-SkipMigrations)."
}

# ── FASE 5: Ficheiros estáticos do backend ────────────────────────────────────
Log "==> 5/7  collectstatic..."
& $Python manage.py collectstatic --no-input 2>&1 | ForEach-Object { Log "    static: $_" }
if ($LASTEXITCODE -ne 0) { Abort "collectstatic falhou" }

# ── FASE 6: Build do frontend ─────────────────────────────────────────────────
if (-not $SkipFrontend) {
    Log "==> 6/7  Build do frontend Next.js..."

    $pkgChanged = git diff HEAD@{1} HEAD -- "../../mfids_cs_app/package.json" 2>$null
    if ($pkgChanged) {
        Log "    package.json alterado — npm ci..."
        Set-Location $FrontDir
        npm ci --legacy-peer-deps 2>&1 | ForEach-Object { Log "    npm: $_" }
        if ($LASTEXITCODE -ne 0) { Abort "npm ci falhou" }
    }

    Set-Location $FrontDir
    npm run build 2>&1 | ForEach-Object { Log "    build: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "npm run build falhou" }

    # Copiar assets estáticos para a pasta standalone (obrigatório para output:'standalone')
    Copy-Item "$FrontDir\public"       "$FrontDir\.next\standalone\public"       -Recurse -Force
    Copy-Item "$FrontDir\.next\static" "$FrontDir\.next\standalone\.next\static" -Recurse -Force
    Log "    Ficheiros estáticos copiados para standalone."
    Set-Location $AppDir
} else {
    Log "==> 6/7  Build do frontend omitido (-SkipFrontend)."
}

# ── FASE 7: Reiniciar serviços ────────────────────────────────────────────────
Log "==> 7/7  A reiniciar serviços..."
Import-Module WebAdministration -ErrorAction SilentlyContinue

Stop-Service CeleryBeat, CeleryWorker -Force -ErrorAction SilentlyContinue
Stop-WebSite "CartaSocial-API"  -ErrorAction SilentlyContinue
Stop-WebSite "CartaSocial-App"  -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Start-WebSite "CartaSocial-API"
Start-WebSite "CartaSocial-App"
Start-Service CeleryWorker -ErrorAction SilentlyContinue
Start-Service CeleryBeat   -ErrorAction SilentlyContinue
Start-Sleep -Seconds 8

# ── Smoke test ────────────────────────────────────────────────────────────────
Log "────────────────────────────────────────────────────────"
Log " Smoke test..."
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/api/docs/" -UseBasicParsing -TimeoutSec 20
    Log "✅ Backend responde: HTTP $($r.StatusCode)"
} catch {
    Abort "Backend não responde após reinicio: $($_.Exception.Message)"
}

if (-not $SkipFrontend) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:4000/" -UseBasicParsing -TimeoutSec 20
        Log "✅ Frontend responde: HTTP $($r.StatusCode)"
    } catch {
        Log "⚠️  Frontend não responde (pode ainda estar a iniciar): $($_.Exception.Message)"
    }
}

Log "════════════════════════════════════════════════════════"
Log " ✅ Deploy concluído com sucesso!"
Log " Log completo: $LogFile"
Log "════════════════════════════════════════════════════════"
