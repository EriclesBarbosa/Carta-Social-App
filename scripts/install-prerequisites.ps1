<#
.SYNOPSIS
    Instala todos os pre-requisitos do servidor para o Carta Social.

.DESCRIPTION
    Instala e verifica: Git, Python 3.11+, Node.js 20+, PostgreSQL 16,
    IIS com modulos de gestao, WebAdministration PowerShell e guia a
    instalacao do httpPlatformHandler (nao disponivel no winget).

    Deve ser corrido UMA VEZ num servidor novo, antes de deploy-new.ps1.

.PARAMETER SkipPostgres
    Nao instala PostgreSQL (util se ja estiver instalado ou for remoto).

.PARAMETER SkipIIS
    Nao activa IIS (util se for usar outro reverse proxy).

.EXAMPLE
    .\scripts\install-prerequisites.ps1
    .\scripts\install-prerequisites.ps1 -SkipPostgres
#>

param(
    [switch]$SkipPostgres,
    [switch]$SkipIIS
)

$ErrorActionPreference = "Stop"

# -- Admin check ---------------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: requer PowerShell como Administrador." -ForegroundColor Red
    Write-Host "  Abrir PowerShell como Administrador e voltar a correr." -ForegroundColor Gray
    exit 1
}

function Say($msg, $color = "White") { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor $color }
function Ok($msg)   { Say "  [OK]    $msg" "Green"  }
function Warn($msg) { Say "  [AVISO] $msg" "Yellow" }
function Step($msg) { Say ""             ; Say "=== $msg ===" "Cyan" }
function Already($msg) { Say "  [JA OK] $msg" "DarkGreen" }

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "   Carta Social -- Instalacao de Pre-Requisitos do Servidor" -ForegroundColor Cyan
Write-Host "   Requer ligacao a internet para descarregar software." -ForegroundColor Gray
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""

# -- Verificar winget ----------------------------------------------------------
Step "0. Verificar winget"
$winget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $winget) {
    Write-Host ""
    Write-Host "  ERRO: winget nao encontrado." -ForegroundColor Red
    Write-Host "  Instalar App Installer da Microsoft Store:" -ForegroundColor Yellow
    Write-Host "    https://apps.microsoft.com/store/detail/app-installer/9NBLGGH4NNS1" -ForegroundColor Yellow
    Write-Host "  Ou actualizar o Windows para a versao mais recente." -ForegroundColor Gray
    exit 1
}
Ok "winget disponivel."

# -- Git -----------------------------------------------------------------------
Step "1. Git"
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    Already "Git ja instalado: $(git --version 2>&1)"
} else {
    Say "  A instalar Git..." "Gray"
    winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Ok "Git instalado."
}

# -- Python 3.11+ --------------------------------------------------------------
Step "2. Python 3.11+"
$pyCmd = Get-Command python -ErrorAction SilentlyContinue
$pyOk  = $false
if ($pyCmd) {
    $pyVer = python --version 2>&1
    $m = [regex]::Match("$pyVer", 'Python (\d+)\.(\d+)')
    if ($m.Success -and ([int]$m.Groups[1].Value -ge 3) -and ([int]$m.Groups[2].Value -ge 11)) {
        Already "Python ja instalado: $pyVer"
        $pyOk = $true
    } else {
        Warn "Python encontrado mas versao insuficiente ($pyVer) -- a instalar 3.11..."
    }
}
if (-not $pyOk) {
    Say "  A instalar Python 3.11..." "Gray"
    winget install --id Python.Python.3.11 -e --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Ok "Python 3.11 instalado. Fechar e reabrir o PowerShell para o PATH ser actualizado."
}

# -- Node.js 20+ ---------------------------------------------------------------
Step "3. Node.js 20+"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodeOk  = $false
if ($nodeCmd) {
    $nodeVer = node --version 2>&1
    $m = [regex]::Match("$nodeVer", 'v(\d+)')
    if ($m.Success -and ([int]$m.Groups[1].Value -ge 20)) {
        Already "Node.js ja instalado: $nodeVer"
        $nodeOk = $true
    } else {
        Warn "Node.js encontrado mas versao insuficiente ($nodeVer) -- a instalar 20..."
    }
}
if (-not $nodeOk) {
    Say "  A instalar Node.js 20 LTS..." "Gray"
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Ok "Node.js 20 instalado."
}

# -- PostgreSQL 16 -------------------------------------------------------------
if (-not $SkipPostgres) {
    Step "4. PostgreSQL 16"
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        Already "PostgreSQL ja instalado: $(psql --version 2>&1)"
    } else {
        Say "  A instalar PostgreSQL 16..." "Gray"
        winget install --id PostgreSQL.PostgreSQL.16 -e --silent --accept-package-agreements --accept-source-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        Ok "PostgreSQL 16 instalado. Servico iniciado automaticamente."
        Warn "Password padrao do utilizador 'postgres': verificar durante a instalacao."
    }
} else {
    Step "4. PostgreSQL -- ignorado (-SkipPostgres)"
}

# -- IIS + WebAdministration ---------------------------------------------------
if (-not $SkipIIS) {
    Step "5. IIS + modulo WebAdministration (PowerShell)"

    $w3svc = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
    if ($w3svc) {
        Already "IIS ja instalado (W3SVC encontrado)."
    } else {
        Say "  A activar IIS..." "Gray"
        $ErrorActionPreference = "Continue"

        # Windows Server
        $serverFeature = Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue
        if ($serverFeature) {
            Install-WindowsFeature -Name Web-Server, Web-Scripting-Tools, Web-Common-Http, Web-Static-Content, Web-Http-Errors, Web-Http-Logging -IncludeManagementTools
        } else {
            # Windows 10/11
            Enable-WindowsOptionalFeature -Online -FeatureName `
                IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-StaticContent, `
                IIS-HttpErrors, IIS-HttpLogging, IIS-ManagementConsole, IIS-ManagementScriptingTools `
                -All -NoRestart
        }
        $ErrorActionPreference = "Stop"

        # Iniciar W3SVC
        Start-Service W3SVC -ErrorAction SilentlyContinue
        $w3svcAfter = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
        if ($w3svcAfter) {
            Ok "IIS activado e a correr."
        } else {
            Warn "IIS pode precisar de reiniciar o servidor. Correr: Restart-Computer"
        }
    }

    # Verificar modulo WebAdministration
    $waModule = Get-Module -ListAvailable -Name WebAdministration
    if ($waModule) {
        Already "Modulo WebAdministration disponivel."
    } else {
        Warn "Modulo WebAdministration nao encontrado."
        Warn "Instalar: Install-WindowsFeature Web-Scripting-Tools  (Windows Server)"
        Warn "       ou: Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementScriptingTools"
    }
} else {
    Step "5. IIS -- ignorado (-SkipIIS)"
}

# -- httpPlatformHandler (descarregar e instalar automaticamente) --------------
Step "6. httpPlatformHandler"

$hphPath   = "$env:SystemRoot\system32\inetsrv\HttpPlatformHandler.dll"
$hphPathV2 = "${env:ProgramFiles}\IIS\HttpPlatformHandlerV2\httpPlatformHandlerV2.dll"

if ((Test-Path $hphPath) -or (Test-Path $hphPathV2)) {
    Already "httpPlatformHandler ja instalado."
} else {
    Say "  A descarregar httpPlatformHandler v1.12 (x64)..." "Gray"
    $msiUrl  = "https://download.microsoft.com/download/C/F/F/CFF3A0B8-99D4-41A2-AE1A-496C08BEB904/httpPlatformHandler_amd64.msi"
    $msiPath = "$env:TEMP\httpPlatformHandler_amd64.msi"
    $downloaded = $false
    $ErrorActionPreference = "Continue"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing -TimeoutSec 60
        $downloaded = $true
    } catch {
        Warn "Download falhou: $_"
    }
    $ErrorActionPreference = "Stop"

    if ($downloaded -and (Test-Path $msiPath)) {
        Say "  A instalar httpPlatformHandler..." "Gray"
        $ErrorActionPreference = "Continue"
        $proc = Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait -PassThru
        $ErrorActionPreference = "Stop"
        Remove-Item $msiPath -Force -ErrorAction SilentlyContinue

        if ((Test-Path $hphPath) -or (Test-Path $hphPathV2)) {
            Ok "httpPlatformHandler instalado com sucesso."
            # Reiniciar IIS para carregar o novo modulo
            $ErrorActionPreference = "Continue"
            & "$env:SystemRoot\system32\inetsrv\appcmd.exe" stop APPPOOL /apppool.name:"DefaultAppPool" 2>$null | Out-Null
            Start-Service W3SVC -ErrorAction SilentlyContinue
            $ErrorActionPreference = "Stop"
        } else {
            Write-Host ""
            Write-Host "  ============================================================" -ForegroundColor Yellow
            Write-Host "   Instalacao do MSI concluiu mas o modulo nao foi detectado." -ForegroundColor Yellow
            Write-Host "   Tentar instalar manualmente:" -ForegroundColor Yellow
            Write-Host "   https://www.iis.net/downloads/microsoft/httpplatformhandler" -ForegroundColor Cyan
            Write-Host "  ============================================================" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "  ============================================================" -ForegroundColor Yellow
        Write-Host "   Nao foi possivel descarregar automaticamente." -ForegroundColor Yellow
        Write-Host "   Instalar manualmente:" -ForegroundColor Yellow
        Write-Host "   1. Abrir: https://www.iis.net/downloads/microsoft/httpplatformhandler" -ForegroundColor Cyan
        Write-Host "   2. Descarregar o .msi (x64) e executar" -ForegroundColor White
        Write-Host "  ============================================================" -ForegroundColor Yellow
        Write-Host ""
    }
}

# -- Resumo final --------------------------------------------------------------
Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host "   Instalacao de pre-requisitos concluida." -ForegroundColor Green
Write-Host ""
Write-Host "   PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Se httpPlatformHandler nao estava instalado:" -ForegroundColor White
Write-Host "      -> Instalar agora (link acima) e reiniciar o IIS:" -ForegroundColor White
Write-Host "         iisreset /restart" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Fechar e reabrir o PowerShell como Administrador" -ForegroundColor White
Write-Host "      (para o PATH actualizado ser reconhecido)" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Correr o deploy:" -ForegroundColor White
Write-Host "      .\scripts\deploy-new.ps1 -DbPassword `"***`" -DumpPath `"C:\...\dump.sql`"" -ForegroundColor Gray
Write-Host "  ============================================================" -ForegroundColor Green
Write-Host ""
