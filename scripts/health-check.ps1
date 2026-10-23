#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Verifica a saúde dos serviços da aplicação Carta Social.

.DESCRIPTION
    Testa os endpoints HTTP do backend e frontend, verifica o estado dos serviços
    Windows (IIS, Celery, Redis, PostgreSQL) e regista o resultado no Windows Event Log.

    Qualquer falha cria um evento de erro (EventID 5000/5001) no Application Log,
    permitindo alertas via Task Scheduler ou ferramentas de monitorização.

    Para correr manualmente:
        .\health-check.ps1

    Para agendar às 08:00 e 20:00:
        .\health-check.ps1 -Agendar

.PARAMETER Agendar
    Regista o script no Task Scheduler para correr às 08:00 e 20:00 todos os dias.

.PARAMETER Silencioso
    Não imprime output no terminal (útil quando corre como tarefa agendada).
#>

param(
    [switch]$Agendar,
    [switch]$Silencioso
)

# ── Modo -Agendar ─────────────────────────────────────────────────────────────
if ($Agendar) {
    $scriptPath = $MyInvocation.MyCommand.Path

    $action   = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`" -Silencioso"

    $trigger1 = New-ScheduledTaskTrigger -Daily -At 08:00
    $trigger2 = New-ScheduledTaskTrigger -Daily -At 20:00
    $settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable

    $existente = Get-ScheduledTask -TaskName "CartaSocial-HealthCheck" -ErrorAction SilentlyContinue
    if ($existente) {
        Unregister-ScheduledTask -TaskName "CartaSocial-HealthCheck" -Confirm:$false
    }

    Register-ScheduledTask `
        -TaskName "CartaSocial-HealthCheck" `
        -Action $action `
        -Trigger @($trigger1, $trigger2) `
        -Settings $settings `
        -RunLevel Highest `
        -User "SYSTEM"

    Write-Host "✅ Health check agendado para as 08:00 e 20:00 (Task: CartaSocial-HealthCheck)"
    exit 0
}

# ── Setup ─────────────────────────────────────────────────────────────────────
$LogDir  = "C:\apps\cartasocial\logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

$LogFile = "$LogDir\health-$(Get-Date -Format 'yyyyMMdd').log"
$falhas  = @()

if (-not [System.Diagnostics.EventLog]::SourceExists("CartaSocial")) {
    try { New-EventLog -LogName Application -Source "CartaSocial" } catch {}
}

function Escrever($msg, $cor = "White") {
    $linha = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content $LogFile $linha
    if (-not $Silencioso) {
        Write-Host $linha -ForegroundColor $cor
    }
}

# ── Verificar endpoint HTTP ───────────────────────────────────────────────────
function VerificarEndpoint($nome, $uri) {
    try {
        $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10
        Escrever "OK  $nome → HTTP $($r.StatusCode)   ($uri)" "Green"
    } catch {
        Escrever "FALHA  $nome → $($_.Exception.Message)   ($uri)" "Red"
        $script:falhas += $nome
        Write-EventLog -LogName Application -Source "CartaSocial" `
            -EventId 5000 -EntryType Error `
            -Message "FALHA endpoint $nome ($uri): $($_.Exception.Message)"
    }
}

# ── Verificar serviço Windows ─────────────────────────────────────────────────
function VerificarServico($nome) {
    $svc = Get-Service $nome -ErrorAction SilentlyContinue
    if ($null -eq $svc) {
        Escrever "N/A  Serviço '$nome' não instalado" "Yellow"
        return
    }
    if ($svc.Status -ne "Running") {
        Escrever "FALHA  Serviço $nome → $($svc.Status)" "Red"
        $script:falhas += "Serviço:$nome"
        Write-EventLog -LogName Application -Source "CartaSocial" `
            -EventId 5001 -EntryType Warning `
            -Message "Serviço $nome não está Running (Status: $($svc.Status))"
    } else {
        Escrever "OK  Serviço $nome → Running" "Green"
    }
}

# ── Verificar espaço em disco ─────────────────────────────────────────────────
function VerificarDisco($letra, $limitePercent = 85) {
    $disco = Get-PSDrive $letra -ErrorAction SilentlyContinue
    if ($null -eq $disco) { return }
    $total = $disco.Used + $disco.Free
    if ($total -eq 0) { return }
    $usado = [math]::Round(($disco.Used / $total) * 100, 1)
    if ($usado -ge $limitePercent) {
        Escrever "AVISO  Disco ${letra}: → $usado% usado (limite: $limitePercent%)" "Yellow"
        Write-EventLog -LogName Application -Source "CartaSocial" `
            -EventId 5002 -EntryType Warning `
            -Message "Disco ${letra}: está $usado% cheio (limite configurado: $limitePercent%)"
        $script:falhas += "Disco:$letra"
    } else {
        Escrever "OK  Disco ${letra}: → $usado% usado" "Green"
    }
}

# ── Executar verificações ─────────────────────────────────────────────────────
Escrever "════════════════════════════════════════"
Escrever " Carta Social — Health Check"
Escrever " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Escrever "════════════════════════════════════════"

Escrever "-- Endpoints --"
VerificarEndpoint "Backend API"  "http://localhost:8000/api/docs/"
VerificarEndpoint "Frontend App" "http://localhost:4000/"

Escrever "-- Serviços Windows --"
VerificarServico "W3SVC"               # IIS
VerificarServico "postgresql-x64-16"   # PostgreSQL
VerificarServico "Redis"               # Redis (se instalado)
VerificarServico "CeleryWorker"
VerificarServico "CeleryBeat"

Escrever "-- Espaço em disco --"
VerificarDisco "C" 85

# ── Resumo ────────────────────────────────────────────────────────────────────
Escrever "────────────────────────────────────────"
if ($falhas.Count -gt 0) {
    $msg = "Health check: $($falhas.Count) falha(s) — $($falhas -join ', ')"
    Escrever "❌ $msg" "Red"
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 5099 -EntryType Error -Message $msg
    exit 1
} else {
    $msg = "Health check OK — todos os componentes a funcionar"
    Escrever "✅ $msg" "Green"
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 5100 -EntryType Information -Message $msg
    exit 0
}
