#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Valida o ambiente antes de fazer deploy da Carta Social.

.DESCRIPTION
    Executa até 15 verificações locais, Django e IIS/rede.
    Devolve exit code 0 se pronto (OK ou só avisos) ou 1 se há falhas críticas.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER SkipDjango
    Omite manage.py check e verificação de migrações (mais rápido).

.PARAMETER SkipIIS
    Omite verificações IIS e HTTP (útil se IIS ainda não estiver configurado).

.EXAMPLE
    .\scripts\sanity-check.ps1
    .\scripts\sanity-check.ps1 -Ambiente producao -SkipDjango
    .\scripts\sanity-check.ps1 -SkipIIS
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente = "producao",
    [switch]$SkipDjango,
    [switch]$SkipIIS
)

# ── Configuração por ambiente ─────────────────────────────────────────────────
$configs = @{
    producao = @{
        AppDir      = "C:\apps\cartasocial\backend\BackEnd\mfids"
        FrontDir    = "C:\apps\cartasocial\frontend\mfids_cs_app"
        BackupDir   = "C:\apps\cartasocial\backups"
        Python      = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        IIS_API     = "CartaSocial-API"
        IIS_App     = "CartaSocial-App"
        BackendUrl  = "http://localhost:8000/api/login/"
        FrontUrl    = "http://localhost:4000/"
        MinDiskGB   = 3
    }
    staging = @{
        AppDir      = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        FrontDir    = "C:\apps\cartasocial-staging\frontend\mfids_cs_app"
        BackupDir   = "C:\apps\cartasocial-staging\backups"
        Python      = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        IIS_API     = "CartaSocial-API-Staging"
        IIS_App     = "CartaSocial-App-Staging"
        BackendUrl  = "http://localhost:8001/api/login/"
        FrontUrl    = "http://localhost:4001/"
        MinDiskGB   = 2
    }
}

$cfg = $configs[$Ambiente]
$ok = 0; $avisos = 0; $falhas = 0
$inicio = Get-Date

# ── Helpers ───────────────────────────────────────────────────────────────────
function OK($msg)    { Write-Host "  [OK]    $msg" -ForegroundColor Green;  $script:ok++ }
function AVISO($msg) { Write-Host "  [AVISO] $msg" -ForegroundColor Yellow; $script:avisos++ }
function FALHA($msg) { Write-Host "  [FALHA] $msg" -ForegroundColor Red;    $script:falhas++ }
function INFO($msg)  { Write-Host "  [INFO]  $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SANITY CHECK  ->  $($Ambiente.ToUpper())" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── [1] venv Python existe ────────────────────────────────────────────────────
INFO "A verificar venv Python..."
if (Test-Path $cfg.Python) {
    OK "venv_prod encontrado: $($cfg.Python)"
} else {
    FALHA "venv_prod não encontrado: $($cfg.Python)"
    INFO "  -> python -m venv venv_prod && venv_prod\Scripts\pip install -r requirements.txt"
}

# ── [2] .env existe ───────────────────────────────────────────────────────────
$envFile = "$($cfg.AppDir)\.env"
INFO "A verificar .env..."
if (Test-Path $envFile) {
    OK ".env encontrado"
} else {
    FALHA ".env não encontrado em $envFile"
    INFO "  -> copiar env.sample para .env e preencher os valores"
}

# ── [3] Variáveis obrigatórias no .env ────────────────────────────────────────
INFO "A verificar variáveis no .env..."
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    $varsObrigatorias = @("SECRET_KEY", "DB_ENGINE", "DB_NAME", "DB_USERNAME", "DB_PASS")
    $varsEmFalta = @()
    foreach ($v in $varsObrigatorias) {
        if ($envContent -notmatch "(?m)^$v\s*=\s*.+") { $varsEmFalta += $v }
    }
    if ($varsEmFalta.Count -eq 0) {
        OK "Todas as variáveis obrigatórias presentes no .env"
    } else {
        FALHA "Variáveis em falta no .env: $($varsEmFalta -join ', ')"
    }

    # DEBUG=False em producao
    if ($Ambiente -eq "producao") {
        if ($envContent -match "(?m)^DEBUG\s*=\s*False") {
            OK "DEBUG=False (correcto para produção)"
        } elseif ($envContent -match "(?m)^DEBUG\s*=\s*True") {
            FALHA "DEBUG=True em produção — risco de segurança e exposição de dados"
            INFO "  -> alterar para DEBUG=False no .env"
        } else {
            AVISO "DEBUG não definido no .env — Django usará False por defeito"
        }
    }

    # EMAIL_HOST_PASSWORD definido
    if ($envContent -match "(?m)^EMAIL_HOST_PASSWORD\s*=\s*.+") {
        OK "EMAIL_HOST_PASSWORD definido"
    } else {
        AVISO "EMAIL_HOST_PASSWORD vazio ou ausente — envio de email (reset de password) não funcionará"
    }
}

# ── [4] .next/standalone existe (build feito) ─────────────────────────────────
INFO "A verificar build Next.js..."
$standaloneServer = "$($cfg.FrontDir)\.next\standalone\server.js"
if (Test-Path $standaloneServer) {
    $buildDate = (Get-Item $standaloneServer).LastWriteTime
    OK "Build standalone encontrado (gerado em $($buildDate.ToString('yyyy-MM-dd HH:mm')))"
} else {
    AVISO "Build standalone não encontrado — frontend não está compilado"
    INFO "  -> cd mfids_cs_app && npm run build"
}

# ── [5] Espaço em disco ───────────────────────────────────────────────────────
INFO "A verificar espaço em disco..."
$drive = Split-Path $cfg.AppDir -Qualifier
$disk  = Get-PSDrive ($drive.TrimEnd(':'))
$freeGB = [math]::Round($disk.Free / 1GB, 1)
if ($freeGB -ge $cfg.MinDiskGB) {
    OK "Espaço livre em $drive`: $freeGB GB (mínimo $($cfg.MinDiskGB) GB)"
} else {
    FALHA "Espaço insuficiente em $drive`: $freeGB GB (mínimo $($cfg.MinDiskGB) GB)"
    INFO "  -> libertar espaço antes de continuar (backups antigos, logs, etc.)"
}

# ── [6] Pasta de backups existe ───────────────────────────────────────────────
INFO "A verificar pasta de backups..."
if (Test-Path $cfg.BackupDir) {
    $nBackups = (Get-ChildItem $cfg.BackupDir -Directory -ErrorAction SilentlyContinue).Count
    OK "Pasta de backups existe ($nBackups backup(s) guardados)"
} else {
    AVISO "Pasta de backups não existe — será criada pelo deploy"
    INFO "  -> New-Item -ItemType Directory -Path '$($cfg.BackupDir)' -Force"
}

# ── [7] Git: sem alterações não commitadas ────────────────────────────────────
INFO "A verificar estado git..."
Set-Location $cfg.AppDir
$gitStatus = git status --porcelain 2>$null
if (-not $gitStatus) {
    OK "Git: working tree limpa"
} else {
    AVISO "Git: existem alterações não commitadas no servidor"
    INFO "  -> git stash ou git checkout . para limpar"
}

# Branch correcta
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if ($branch -eq "main") {
    OK "Git: branch 'main' (correcto)"
} else {
    AVISO "Git: branch actual é '$branch' (esperado 'main')"
}

# ── [8] Django checks ─────────────────────────────────────────────────────────
if (-not $SkipDjango) {
    INFO "A executar manage.py check..."
    Set-Location $cfg.AppDir
    $checkOut = & $cfg.Python manage.py check 2>&1
    $checkStr = $checkOut -join " "
    if ($checkStr -match "System check identified no issues") {
        OK "manage.py check: sem erros"
    } elseif ($checkStr -match "System check identified \d+ issue") {
        if ($checkStr -match "0 silenced") {
            AVISO "manage.py check: avisos encontrados"
            $checkOut | Where-Object { $_ -match "WARN|ERROR" } | ForEach-Object { INFO "  $_" }
        } else {
            OK "manage.py check: apenas avisos menores (0 silenced)"
        }
    } else {
        FALHA "manage.py check falhou"
        $checkOut | Select-Object -Last 5 | ForEach-Object { INFO "  $_" }
    }

    # Migrações pendentes
    INFO "A verificar migrações pendentes..."
    $pending = & $cfg.Python manage.py showmigrations 2>&1 | Where-Object { $_ -match '\[ \]' }
    if ($pending) {
        AVISO "$($pending.Count) migração(ões) pendente(s) — serão aplicadas durante o deploy"
        $pending | ForEach-Object { INFO "  $_" }
    } else {
        OK "Nenhuma migração pendente"
    }

    # BD acessível (testa via Django)
    INFO "A verificar ligação à base de dados..."
    $dbTest = & $cfg.Python -c "
import django, os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
try:
    django.setup()
    from django.db import connection
    connection.ensure_connection()
    print('OK')
except Exception as e:
    print(f'ERRO:{e}')
" 2>&1
    if ($dbTest -match "^OK") {
        OK "Base de dados acessível (PostgreSQL)"
    } else {
        FALHA "Base de dados inacessível: $dbTest"
        INFO "  -> verificar DB_HOST, DB_PORT, DB_USERNAME, DB_PASS no .env"
        INFO "  -> verificar se o serviço PostgreSQL está a correr"
    }
} else {
    INFO "(verificações Django ignoradas — -SkipDjango)"
}

# ── [9] IIS e HTTP ────────────────────────────────────────────────────────────
if (-not $SkipIIS) {
    Import-Module WebAdministration -ErrorAction SilentlyContinue

    if (Get-Module WebAdministration) {
        # Site CartaSocial-API
        INFO "A verificar site IIS $($cfg.IIS_API)..."
        $siteAPI = Get-Website -Name $cfg.IIS_API -ErrorAction SilentlyContinue
        if ($siteAPI) {
            if ($siteAPI.State -eq "Started") {
                OK "Site '$($cfg.IIS_API)' existe e está Started"
            } else {
                AVISO "Site '$($cfg.IIS_API)' existe mas está $($siteAPI.State) — o deploy irá reiniciá-lo"
            }
        } else {
            FALHA "Site '$($cfg.IIS_API)' não encontrado no IIS"
            INFO "  -> criar o site no IIS Manager ou executar deploy-new.ps1"
        }

        # Site CartaSocial-App
        INFO "A verificar site IIS $($cfg.IIS_App)..."
        $siteApp = Get-Website -Name $cfg.IIS_App -ErrorAction SilentlyContinue
        if ($siteApp) {
            if ($siteApp.State -eq "Started") {
                OK "Site '$($cfg.IIS_App)' existe e está Started"
            } else {
                AVISO "Site '$($cfg.IIS_App)' existe mas está $($siteApp.State) — o deploy irá reiniciá-lo"
            }
        } else {
            FALHA "Site '$($cfg.IIS_App)' não encontrado no IIS"
            INFO "  -> criar o site no IIS Manager ou executar deploy-new.ps1"
        }
    } else {
        AVISO "Módulo WebAdministration não disponível — verificações IIS ignoradas"
    }

    # Backend HTTP
    INFO "A testar resposta HTTP do backend ($($cfg.BackendUrl))..."
    try {
        $r = Invoke-WebRequest -Uri $cfg.BackendUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($r.StatusCode -in 200, 405) {
            OK "Backend responde: HTTP $($r.StatusCode)"
        } else {
            AVISO "Backend devolveu HTTP $($r.StatusCode) inesperado"
        }
    } catch {
        AVISO "Backend não responde em $($cfg.BackendUrl) — pode estar parado (o deploy irá reiniciá-lo)"
    }

    # Frontend HTTP
    INFO "A testar resposta HTTP do frontend ($($cfg.FrontUrl))..."
    try {
        $r = Invoke-WebRequest -Uri $cfg.FrontUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($r.StatusCode -in 200, 301, 302) {
            OK "Frontend responde: HTTP $($r.StatusCode)"
        } else {
            AVISO "Frontend devolveu HTTP $($r.StatusCode) inesperado"
        }
    } catch {
        AVISO "Frontend não responde em $($cfg.FrontUrl) — pode estar parado (o deploy irá reiniciá-lo)"
    }
} else {
    INFO "(verificações IIS/HTTP ignoradas — -SkipIIS)"
}

# ── Resultado final ───────────────────────────────────────────────────────────
$duracao = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($falhas -gt 0) {
    Write-Host "  RESULTADO: BLOQUEADO  $falhas falha(s) | $avisos aviso(s) | $ok OK  ($duracao`s)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    exit 1
} elseif ($avisos -gt 0) {
    Write-Host "  RESULTADO: PRONTO (com $avisos aviso(s))  —  $ok OK  ($duracao`s)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "  RESULTADO: PRONTO  —  $ok verificações OK  ($duracao`s)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}
