<#
.SYNOPSIS
    Remove completamente uma instalacao Carta Social do servidor.

.DESCRIPTION
    Inverte o que deploy-new.ps1 fez: para e remove sites/AppPools IIS,
    servicos Celery (NSSM), base de dados PostgreSQL, directorio da app
    e variaveis de ambiente do Windows.
    Usar antes de repetir um deploy-new do zero.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER AppRoot
    Substitui a pasta raiz (igual ao parametro em deploy-new.ps1).

.PARAMETER PostgresPassword
    Password do utilizador postgres (default: "postgres").

.PARAMETER KeepEnvVars
    Nao remove as variaveis de ambiente do Windows (SECRET_KEY, DB_PASS, etc.).
    Util para repetir o deploy sem reintroduzir segredos.

.PARAMETER KeepDb
    Nao dropa a base de dados nem o utilizador PostgreSQL.

.EXAMPLE
    .\scripts\teardown-vm.ps1 -PostgresPassword "PgAdminPass2026!"
    .\scripts\teardown-vm.ps1 -Ambiente staging -PostgresPassword "PgAdminPass2026!" -KeepEnvVars
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente          = "producao",
    [string]$AppRoot           = "",
    [string]$PostgresPassword  = "postgres",
    [switch]$KeepEnvVars,
    [switch]$KeepDb
)

$ErrorActionPreference = "Stop"

# -- Configuracao (espelho do deploy-new.ps1) -----------------------------------
$configs = @{
    producao = @{
        AppRoot      = "C:\apps\cartasocial"
        BackendDir   = "C:\apps\cartasocial\backend\BackEnd\mfids"
        IIS_API      = "CartaSocial-API"
        IIS_App      = "CartaSocial-App"
        DbName       = "DB_DGIS_SITE"
        DbUser       = "mfids_user"
        CeleryWorker = "CartaSocial-Celery-Worker"
        CeleryBeat   = "CartaSocial-Celery-Beat"
    }
    staging = @{
        AppRoot      = "C:\apps\cartasocial-staging"
        BackendDir   = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        IIS_API      = "CartaSocial-API-Staging"
        IIS_App      = "CartaSocial-App-Staging"
        DbName       = "DB_DGIS_SITE_STAGING"
        DbUser       = "mfids_user_staging"
        CeleryWorker = "CartaSocial-Celery-Worker-Staging"
        CeleryBeat   = "CartaSocial-Celery-Beat-Staging"
    }
}

$cfg = $configs[$Ambiente]
if ($AppRoot) {
    $cfg.AppRoot    = $AppRoot
    $cfg.BackendDir = "$AppRoot\backend\BackEnd\mfids"
}

# -- Admin check ---------------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: requer PowerShell como Administrador." -ForegroundColor Red; exit 1
}

function Say($msg, $color = "White") { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor $color }
function Ok($msg)   { Say "  [OK] $msg" "Green"  }
function Warn($msg) { Say "  [AVISO] $msg" "Yellow" }
function Step($msg) { Say "--- $msg" "Cyan"   }

Write-Host ""
Write-Host "  === TEARDOWN $($Ambiente.ToUpper()) ===" -ForegroundColor Red
Write-Host "  Serao removidos:" -ForegroundColor Red
Write-Host "   - Sites IIS : $($cfg.IIS_API), $($cfg.IIS_App)" -ForegroundColor Red
Write-Host "   - Servicos  : $($cfg.CeleryWorker), $($cfg.CeleryBeat)" -ForegroundColor Red
if (-not $KeepDb) {
    Write-Host "   - BD        : $($cfg.DbName)" -ForegroundColor Red
}
Write-Host "   - Directorio: $($cfg.AppRoot)" -ForegroundColor Red
if (-not $KeepEnvVars) {
    Write-Host "   - Vars Win  : SECRET_KEY, DB_PASS, ..." -ForegroundColor Red
}
Write-Host ""
$confirm = Read-Host "  Confirmar teardown completo? (s/N)"
if ($confirm -ne 's' -and $confirm -ne 'S') { Write-Host "Cancelado."; exit 0 }
Write-Host ""

# -- 1. IIS: parar e remover sites e AppPools ----------------------------------
Step "1/5  IIS -- parar sites e AppPools..."
$ErrorActionPreference = "Continue"
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (Get-Module WebAdministration) {
    foreach ($siteName in @($cfg.IIS_API, $cfg.IIS_App)) {
        $site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
        if ($site) {
            Stop-Website  -Name $siteName -ErrorAction SilentlyContinue
            Remove-Website -Name $siteName -ErrorAction SilentlyContinue
            Ok "Site '$siteName' removido."
        } else {
            Warn "Site '$siteName' nao encontrado -- ignorado."
        }
        $pool = Get-WebAppPool -Name $siteName -ErrorAction SilentlyContinue
        if ($pool) {
            Stop-WebAppPool   -Name $siteName -ErrorAction SilentlyContinue
            Remove-WebAppPool -Name $siteName -ErrorAction SilentlyContinue
            Ok "AppPool '$siteName' removido."
        }
    }
} else {
    Warn "Modulo WebAdministration nao disponivel -- sites IIS NAO removidos."
    Warn "Remover manualmente no IIS Manager: $($cfg.IIS_API) e $($cfg.IIS_App)"
}
$ErrorActionPreference = "Stop"

# -- 2. NSSM: parar e remover servicos Celery ----------------------------------
Step "2/5  NSSM -- remover servicos Celery..."
$nssmExe = Get-Command nssm -ErrorAction SilentlyContinue
$ErrorActionPreference = "Continue"
foreach ($svcName in @($cfg.CeleryWorker, $cfg.CeleryBeat)) {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc) {
        if ($nssmExe) {
            nssm stop    $svcName confirm 2>$null
            nssm remove  $svcName confirm 2>$null
            Ok "Servico '$svcName' removido via NSSM."
        } else {
            Stop-Service  $svcName -Force -ErrorAction SilentlyContinue
            sc.exe delete $svcName | Out-Null
            Ok "Servico '$svcName' removido via sc.exe."
        }
    } else {
        Warn "Servico '$svcName' nao encontrado -- ignorado."
    }
}
$ErrorActionPreference = "Stop"

# -- 3. PostgreSQL: dropar BD e user -------------------------------------------
if (-not $KeepDb) {
    Step "3/5  PostgreSQL -- dropar BD e utilizador..."
    $pgExe = Get-Command psql -ErrorAction SilentlyContinue
    if ($pgExe) {
        $env:PGPASSWORD = $PostgresPassword
        $ErrorActionPreference = "Continue"

        # Terminar ligacoes activas
        psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$($cfg.DbName)' AND pid <> pg_backend_pid();" 2>$null | Out-Null

        $tmpSql = "$env:TEMP\cs_teardown.sql"
        Set-Content $tmpSql "DROP DATABASE IF EXISTS `"$($cfg.DbName)`";" -Encoding UTF8
        psql -U postgres -f $tmpSql 2>&1 | Out-Null
        Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
        Ok "Base de dados '$($cfg.DbName)' dropada."

        Set-Content $tmpSql "DROP USER IF EXISTS $($cfg.DbUser);" -Encoding UTF8
        psql -U postgres -f $tmpSql 2>&1 | Out-Null
        Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
        Ok "Utilizador '$($cfg.DbUser)' removido."

        $env:PGPASSWORD = ""
        $ErrorActionPreference = "Stop"
    } else {
        Warn "psql nao encontrado -- BD e utilizador NAO removidos."
    }
} else {
    Step "3/5  PostgreSQL -- ignorado (-KeepDb)."
    Warn "BD '$($cfg.DbName)' e utilizador '$($cfg.DbUser)' mantidos."
}

# -- 4. Directorio da app ------------------------------------------------------
Step "4/5  A remover directorio $($cfg.AppRoot)..."
$ErrorActionPreference = "Continue"
if (Test-Path $cfg.AppRoot) {
    Start-Sleep -Seconds 2
    Remove-Item $cfg.AppRoot -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path $cfg.AppRoot) {
        Warn "Alguns ficheiros nao puderam ser removidos (handle aberto pelo IIS?)."
        Warn "Tentar: iisreset /stop ; Remove-Item '$($cfg.AppRoot)' -Recurse -Force ; iisreset /start"
    } else {
        Ok "Directorio '$($cfg.AppRoot)' removido."
    }
} else {
    Warn "Directorio '$($cfg.AppRoot)' nao existe -- ignorado."
}
$ErrorActionPreference = "Stop"

# -- 5. Variaveis de ambiente Windows ------------------------------------------
if (-not $KeepEnvVars) {
    Step "5/5  A remover variaveis de ambiente Windows (Machine)..."
    $ErrorActionPreference = "Continue"
    foreach ($varName in @("SECRET_KEY", "DB_PASS", "EMAIL_HOST_PASSWORD", "CELERY_BROKER", "DSN_KEY")) {
        $val = [System.Environment]::GetEnvironmentVariable($varName, "Machine")
        if ($val) {
            [System.Environment]::SetEnvironmentVariable($varName, $null, "Machine")
            Ok "Variavel '$varName' removida."
        }
    }
    $ErrorActionPreference = "Stop"
} else {
    Step "5/5  Variaveis de ambiente -- ignoradas (-KeepEnvVars)."
    Warn "SECRET_KEY, DB_PASS, etc. mantidas -- serao reutilizadas no proximo deploy."
}

# -- Resumo --------------------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host " [OK] Teardown '$($Ambiente.ToUpper())' concluido." -ForegroundColor Green
Write-Host ""
Write-Host " Pode agora correr o deploy do zero:" -ForegroundColor Cyan
Write-Host "   .\scripts\deploy-new.ps1 -DbPassword `"***`" -DumpPath `"C:\dumps\carta_social_data_db.sql`""
Write-Host "======================================================" -ForegroundColor Green
