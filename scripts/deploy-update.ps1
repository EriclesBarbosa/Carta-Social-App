#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Actualiza a aplicação Carta Social (backend + frontend).

.DESCRIPTION
    Executa sanity check, git pull, instala dependências (se alteradas),
    collectstatic, build Next.js, copia estáticos para standalone e
    reinicia IIS + Celery. Em caso de falha no smoke test, indica
    o backup disponível para rollback.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER SkipFrontend
    Omite o build do frontend Next.js.

.PARAMETER SkipMigrations
    Omite manage.py migrate.

.PARAMETER SkipSanityCheck
    Força o deploy ignorando o sanity check (apenas em emergência).

.EXAMPLE
    .\scripts\deploy-update.ps1
    .\scripts\deploy-update.ps1 -Ambiente staging
    .\scripts\deploy-update.ps1 -SkipFrontend
    .\scripts\deploy-update.ps1 -SkipMigrations -SkipSanityCheck

.NOTES
    Requer: PowerShell 5.1+, Git, Python venv_prod, Node.js, IIS WebAdministration
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente = "producao",
    [switch]$SkipFrontend,
    [switch]$SkipMigrations,
    [switch]$SkipSanityCheck
)

$ErrorActionPreference = "Stop"

# ── Configuração por ambiente ─────────────────────────────────────────────────
$configs = @{
    producao = @{
        AppDir      = "C:\apps\cartasocial\backend\BackEnd\mfids"
        FrontDir    = "C:\apps\cartasocial\frontend\mfids_cs_app"
        BackupDir   = "C:\apps\cartasocial\backups"
        Python      = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip         = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API     = "CartaSocial-API"
        IIS_App     = "CartaSocial-App"
        BackendUrl  = "http://localhost:8000/api/login/"
        FrontUrl    = "http://localhost:4000/"
    }
    staging = @{
        AppDir      = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        FrontDir    = "C:\apps\cartasocial-staging\frontend\mfids_cs_app"
        BackupDir   = "C:\apps\cartasocial-staging\backups"
        Python      = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip         = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API     = "CartaSocial-API-Staging"
        IIS_App     = "CartaSocial-App-Staging"
        BackendUrl  = "http://localhost:8001/api/login/"
        FrontUrl    = "http://localhost:4001/"
    }
}

$cfg       = $configs[$Ambiente]
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$snapName  = "snapshot-$timestamp-$Ambiente"
$lockFile  = "$env:TEMP\cartasocial-deploy-$Ambiente.lock"
$logFile   = "$($cfg.BackupDir)\deploy-$timestamp.log"

New-Item -ItemType Directory -Path $cfg.BackupDir -Force | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content $logFile $line
}

function Abort($msg) {
    Log "❌ ABORTADO: $msg"
    Log "   Log: $logFile"
    Log "   Rollback disponível: .\rollback-app.ps1 -BackupNome $snapName"
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    exit 1
}

# ── LOCK: prevenir deploys concorrentes ───────────────────────────────────────
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
Log " Carta Social — Deploy de Actualização ($($Ambiente.ToUpper()))"
Log " Data/hora : $(Get-Date)"
Log " AppDir    : $($cfg.AppDir)"
Log "════════════════════════════════════════════════════════"

# ── FASE 0: Sanity check ──────────────────────────────────────────────────────
if ($SkipSanityCheck) {
    Log "==> 0/7  Sanity check ignorado (-SkipSanityCheck)"
} else {
    Log "==> 0/7  Sanity check..."
    $sanityScript = Join-Path $PSScriptRoot "sanity-check.ps1"
    if (Test-Path $sanityScript) {
        & $sanityScript -Ambiente $Ambiente -SkipDjango
        if ($LASTEXITCODE -eq 1) {
            Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
            Write-Host "`n  Deploy cancelado — corrigir as FALHAs acima e voltar a tentar." -ForegroundColor Red
            Write-Host "  Para forçar sem verificações: -SkipSanityCheck`n" -ForegroundColor Red
            exit 1
        }
    } else {
        Log "    sanity-check.ps1 não encontrado — a ignorar."
    }
}

# ── FASE 1: Snapshot de segurança ─────────────────────────────────────────────
Log "==> 1/7  Snapshot de segurança..."
Copy-Item $cfg.AppDir "$($cfg.BackupDir)\$snapName" -Recurse -ErrorAction Stop
Log "    Guardado em: $($cfg.BackupDir)\$snapName"

# ── FASE 2: Obter novo código ──────────────────────────────────────────────────
Log "==> 2/7  git pull origin main..."
Set-Location $cfg.AppDir
git fetch origin 2>&1 | ForEach-Object { Log "    git: $_" }
git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | ForEach-Object { Log "    git: $_" }
if ($LASTEXITCODE -ne 0) { Abort "git pull falhou" }

# ── FASE 3: Dependências Python ────────────────────────────────────────────────
Log "==> 3/7  Dependências Python..."
$reqChanged = git diff HEAD@{1} HEAD -- requirements.txt
if ($reqChanged) {
    Log "    requirements.txt alterado — a instalar pacotes..."
    & $cfg.Pip install -r requirements.txt 2>&1 | ForEach-Object { Log "    pip: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "pip install falhou" }
} else {
    Log "    requirements.txt sem alterações — a saltar."
}

# ── FASE 4: Migrations ────────────────────────────────────────────────────────
if (-not $SkipMigrations) {
    Log "==> 4/7  Migrações de base de dados..."
    $pending = & $cfg.Python manage.py showmigrations 2>&1 | Where-Object { $_ -match '\[ \]' }
    if ($pending) {
        Log "    $($pending.Count) migração(ões) pendente(s) — a aplicar..."
        $pending | ForEach-Object { Log "    $_" }
        & $cfg.Python manage.py migrate 2>&1 | ForEach-Object { Log "    migrate: $_" }
        if ($LASTEXITCODE -ne 0) { Abort "manage.py migrate falhou" }
    } else {
        Log "    Nenhuma migração pendente."
    }
} else {
    Log "==> 4/7  Migrações omitidas (-SkipMigrations)."
}

# ── FASE 5: Ficheiros estáticos do backend ────────────────────────────────────
Log "==> 5/7  collectstatic..."
& $cfg.Python manage.py collectstatic --no-input 2>&1 | ForEach-Object { Log "    static: $_" }
if ($LASTEXITCODE -ne 0) { Abort "collectstatic falhou" }

# ── FASE 6: Build do frontend ─────────────────────────────────────────────────
if (-not $SkipFrontend) {
    Log "==> 6/7  Build do frontend Next.js..."

    $pkgChanged = git diff HEAD@{1} HEAD -- "../../mfids_cs_app/package.json" 2>$null
    if ($pkgChanged) {
        Log "    package.json alterado — npm ci..."
        Set-Location $cfg.FrontDir
        npm ci --legacy-peer-deps 2>&1 | ForEach-Object { Log "    npm: $_" }
        if ($LASTEXITCODE -ne 0) { Abort "npm ci falhou" }
    }

    Set-Location $cfg.FrontDir
    npm run build 2>&1 | ForEach-Object { Log "    build: $_" }
    if ($LASTEXITCODE -ne 0) { Abort "npm run build falhou" }

    Copy-Item "$($cfg.FrontDir)\public"       "$($cfg.FrontDir)\.next\standalone\public"       -Recurse -Force
    Copy-Item "$($cfg.FrontDir)\.next\static" "$($cfg.FrontDir)\.next\standalone\.next\static" -Recurse -Force
    Log "    Ficheiros estáticos copiados para standalone."
    Set-Location $cfg.AppDir
} else {
    Log "==> 6/7  Build do frontend omitido (-SkipFrontend)."
}

# ── FASE 7: Reiniciar serviços ────────────────────────────────────────────────
Log "==> 7/7  A reiniciar serviços..."
Import-Module WebAdministration -ErrorAction SilentlyContinue

Stop-Service CeleryBeat, CeleryWorker -Force -ErrorAction SilentlyContinue
Stop-WebSite $cfg.IIS_API -ErrorAction SilentlyContinue
Stop-WebSite $cfg.IIS_App -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Start-WebSite $cfg.IIS_API -ErrorAction SilentlyContinue
Start-WebSite $cfg.IIS_App -ErrorAction SilentlyContinue
Start-Service CeleryWorker -ErrorAction SilentlyContinue
Start-Service CeleryBeat   -ErrorAction SilentlyContinue

# ── Smoke test com retry (10 tentativas × 3s = 30s máx) ──────────────────────
Log "────────────────────────────────────────────────────────"
Log " Smoke test (aguardar até 30s)..."

$maxTries = 10; $interval = 3

# Backend
$backendOK = $false
for ($i = 1; $i -le $maxTries; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $cfg.BackendUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -in 200, 405) {
            Log "✅ Backend responde: HTTP $($r.StatusCode) (tentativa $i)"
            $backendOK = $true; break
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -in 200, 405) { Log "✅ Backend: HTTP $code"; $backendOK = $true; break }
        }
        if ($i -lt $maxTries) { Start-Sleep -Seconds $interval }
    }
}
if (-not $backendOK) { Abort "Backend não responde após $($maxTries * $interval)s: $($cfg.BackendUrl)" }

# Frontend
if (-not $SkipFrontend) {
    $frontOK = $false
    for ($i = 1; $i -le $maxTries; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $cfg.FrontUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($r.StatusCode -in 200, 301, 302) {
                Log "✅ Frontend responde: HTTP $($r.StatusCode) (tentativa $i)"
                $frontOK = $true; break
            }
        } catch {
            if ($i -lt $maxTries) { Start-Sleep -Seconds $interval }
        }
    }
    if (-not $frontOK) {
        Log "⚠️  Frontend não responde após 30s — pode ainda estar a iniciar."
        Log "   Verificar manualmente: $($cfg.FrontUrl)"
    }
}

Log "════════════════════════════════════════════════════════"
Log " ✅ Deploy concluído com sucesso!"
Log "    Ambiente : $($Ambiente.ToUpper())"
Log "    Snapshot : $($cfg.BackupDir)\$snapName"
Log "    Log      : $logFile"
Log "════════════════════════════════════════════════════════"

} finally {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
