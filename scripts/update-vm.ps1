<#
.SYNOPSIS
    Actualiza a instalação Carta Social com o código mais recente do repositório.

.DESCRIPTION
    Faz git pull, reconstrói o frontend Next.js e reinicia os sites IIS.
    Não toca na base de dados nem nas variáveis de ambiente.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER SoFrontend
    Actualiza apenas o frontend (omite pip install/migrate/collectstatic e reinício do backend).

.PARAMETER SoBackend
    Actualiza apenas o backend (omite npm build e reinício do frontend).

.EXAMPLE
    .\scripts\update-vm.ps1
    .\scripts\update-vm.ps1 -SoFrontend
    .\scripts\update-vm.ps1 -Ambiente staging
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente = "producao",
    [switch]$SoFrontend,
    [switch]$SoBackend
)

$ErrorActionPreference = "Stop"

$configs = @{
    producao = @{
        AppRoot      = "C:\apps\cartasocial"
        BackendDir   = "C:\apps\cartasocial\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial\frontend\mfids_cs_app"
        Python       = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        IIS_API      = "CartaSocial-API"
        IIS_App      = "CartaSocial-App"
        IIS_App_Port = 4000
        ApiUrl       = "http://localhost:8000"
    }
    staging = @{
        AppRoot      = "C:\apps\cartasocial-staging"
        BackendDir   = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial-staging\frontend\mfids_cs_app"
        Python       = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        IIS_API      = "CartaSocial-API-Staging"
        IIS_App      = "CartaSocial-App-Staging"
        IIS_App_Port = 4001
        ApiUrl       = "http://localhost:8001"
    }
}

$cfg = $configs[$Ambiente]

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: requer PowerShell como Administrador." -ForegroundColor Red; exit 1
}

function Say($msg, $color = "White") { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor $color }
function Ok($msg)   { Say "  [OK] $msg" "Green"  }
function Warn($msg) { Say "  [AVISO] $msg" "Yellow" }
function Step($msg) { Say "--- $msg ---" "Cyan" }
function Abort($msg){ Say "ERRO: $msg" "Red"; exit 1 }

Write-Host ""
Write-Host "  Carta Social -- Actualização ($($Ambiente.ToUpper()))" -ForegroundColor Cyan
Write-Host ""

# -- 1. git pull ---------------------------------------------------------------
Step "1. git pull"
Set-Location "$($cfg.AppRoot)\backend"
git pull origin main
if ($LASTEXITCODE -ne 0) { Abort "git pull falhou" }
Ok "Código actualizado."

# -- 2. Backend ----------------------------------------------------------------
if (-not $SoFrontend) {
    Step "2. Backend: dependências + migrate + collectstatic"
    Set-Location $cfg.BackendDir

    $ErrorActionPreference = "Continue"
    & $cfg.Python -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py migrate --no-input 2>&1 | ForEach-Object { Write-Host "    $_" }
    $ErrorActionPreference = "Stop"

    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py collectstatic --no-input 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    Ok "Backend actualizado."

    Import-Module WebAdministration -ErrorAction SilentlyContinue
    if (Get-Module WebAdministration) {
        $ErrorActionPreference = "Continue"
        Restart-WebItem "IIS:\Sites\$($cfg.IIS_API)" -ErrorAction SilentlyContinue
        $ErrorActionPreference = "Stop"
        Ok "Site IIS '$($cfg.IIS_API)' reiniciado."
    } else {
        Warn "WebAdministration não disponível — reiniciar '$($cfg.IIS_API)' manualmente."
    }
}

# -- 3. Frontend ---------------------------------------------------------------
if (-not $SoBackend) {
    Step "3. Frontend: sync source"

    # FrontDir é uma cópia do deploy inicial, não um git repo.
    # Sincronizar ficheiros fonte do repo para o directório de build.
    $backendFrontSrc = "$($cfg.AppRoot)\backend\mfids_cs_app"
    if (Test-Path $backendFrontSrc) {
        robocopy $backendFrontSrc $cfg.FrontDir /MIR /XD node_modules .next /XF "*.log" /NFL /NDL /NJH /NJS 2>&1 | Out-Null
        Ok "Ficheiros fonte sincronizados."
    } else {
        Warn "Fonte $backendFrontSrc não encontrado — a construir com ficheiros existentes."
    }

    Step "3. Frontend: npm build"
    Set-Location $cfg.FrontDir

    $ErrorActionPreference = "Continue"
    npm run build 2>&1 | ForEach-Object { Write-Host "    $_" }
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($buildExit -ne 0) { Abort "npm run build falhou" }
    Ok "Build concluído."

    $standalone = "$($cfg.FrontDir)\.next\standalone"

    # Copiar assets públicos para standalone (apagados pelo build)
    Copy-Item "$($cfg.FrontDir)\public"       "$standalone\public"       -Recurse -Force
    Copy-Item "$($cfg.FrontDir)\.next\static" "$standalone\.next\static" -Recurse -Force

    if (Test-Path "$($cfg.FrontDir)\.env.local") {
        Copy-Item "$($cfg.FrontDir)\.env.local" "$standalone\.env.local" -Force
    }

    New-Item "$standalone\logs" -ItemType Directory -Force | Out-Null

    # Recriar web.config (apagado pelo build)
    $webConfigLines = (
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<configuration>',
        '  <system.webServer>',
        '    <handlers>',
        '      <add name="httpPlatformHandler" path="*" verb="*"',
        '           modules="httpPlatformHandler" resourceType="Unspecified" />',
        '    </handlers>',
        '    <httpPlatform processPath="node.exe"',
        '                  arguments="server.js"',
        '                  startupTimeLimit="60"',
        '                  requestTimeout="00:04:00"',
        '                  stdoutLogEnabled="true"',
        '                  stdoutLogFile="logs\nextjs.log">',
        '      <environmentVariables>',
        '        <environmentVariable name="PORT"     value="%HTTP_PLATFORM_PORT%" />',
        '        <environmentVariable name="HOSTNAME" value="127.0.0.1" />',
        '        <environmentVariable name="NODE_ENV" value="production" />',
        "        <environmentVariable name=""API_URL""  value=""$($cfg.ApiUrl)"" />",
        '      </environmentVariables>',
        '    </httpPlatform>',
        '  </system.webServer>',
        '</configuration>'
    )
    [System.IO.File]::WriteAllText("$standalone\web.config", ($webConfigLines -join "`r`n"), [System.Text.Encoding]::UTF8)
    Ok "web.config recriado."

    # Permissões (apenas standalone, não node_modules inteiro)
    $ErrorActionPreference = "Continue"
    icacls $standalone /grant "IIS AppPool\$($cfg.IIS_App):(OI)(CI)RX" /T 2>&1 | Out-Null
    icacls "$standalone\logs" /grant "IIS AppPool\$($cfg.IIS_App):(OI)(CI)M" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    Import-Module WebAdministration -ErrorAction SilentlyContinue
    if (Get-Module WebAdministration) {
        $ErrorActionPreference = "Continue"
        Restart-WebItem "IIS:\Sites\$($cfg.IIS_App)" -ErrorAction SilentlyContinue
        $ErrorActionPreference = "Stop"
        Ok "Site IIS '$($cfg.IIS_App)' reiniciado."
    } else {
        Warn "WebAdministration não disponível — reiniciar '$($cfg.IIS_App)' manualmente."
    }

    Ok "Frontend actualizado e a servir."
}

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "  Actualização concluída." -ForegroundColor Green
if (-not $SoBackend) {
    Write-Host "  Frontend : http://localhost:$($cfg.IIS_App_Port)" -ForegroundColor Cyan
}
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
