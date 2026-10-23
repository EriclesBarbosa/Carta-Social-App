#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Resposta ao incidente de segurança ClickFix — verificação e limpeza do servidor.

.DESCRIPTION
    Detecta sinais do ataque ClickFix que injectou código malicioso nos ficheiros
    compilados do Next.js em produção. Verifica integridade dos ficheiros, tarefas
    agendadas suspeitas, processos, e regista tudo no Event Log.

    Corre após um compromisso suspeito para verificar o estado do servidor.
    NÃO substitui uma reinstalação limpa se o compromisso for confirmado.

.EXAMPLE
    .\incident-response.ps1
#>

$AppDir    = "C:\apps\cartasocial"
$NextDir   = "$AppDir\frontend\.next"
$LogDir    = "$AppDir\logs"
$LogFile   = "$LogDir\incident-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$Alertas   = @()

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

if (-not [System.Diagnostics.EventLog]::SourceExists("CartaSocial")) {
    try { New-EventLog -LogName Application -Source "CartaSocial" } catch {}
}

function Log($msg, $cor = "White") {
    $linha = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content $LogFile $linha
    Write-Host $linha -ForegroundColor $cor
}

function Alerta($msg) {
    Log "⚠  ALERTA: $msg" "Red"
    $script:Alertas += $msg
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 9000 -EntryType Error -Message "INCIDENTE: $msg"
}

Log "══════════════════════════════════════════════════"
Log " Carta Social — Incident Response"
Log " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "══════════════════════════════════════════════════"

# ── 1. Ficheiros .js compilados com script data: URI ──────────────────────────
Log ""
Log "── 1. Verificar ficheiros Next.js compilados ──"

if (Test-Path $NextDir) {
    $jsFiles = Get-ChildItem "$NextDir\server" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue
    foreach ($f in $jsFiles) {
        $conteudo = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($conteudo -match 'data:text/javascript' -or
            $conteudo -match 'eth_call' -or
            $conteudo -match 'eval\(atob' -or
            $conteudo -match '0xE75744C53eC' -or
            $conteudo -match 'bsctestapi' -or
            $conteudo -match 'bsc-dataseed') {
            Alerta "Ficheiro comprometido: $($f.FullName)"
        }
    }
    Log "Verificação de $($jsFiles.Count) ficheiros JS concluída." "Green"
} else {
    Log "Diretório Next.js não encontrado em $NextDir" "Yellow"
}

# ── 2. Tarefas agendadas suspeitas ────────────────────────────────────────────
Log ""
Log "── 2. Tarefas agendadas suspeitas ──"

$tarefas = Get-ScheduledTask | Where-Object {
    $_.TaskName -notlike "CartaSocial-*" -and
    $_.TaskName -notlike "Microsoft*" -and
    $_.TaskName -notlike "Windows*" -and
    $_.TaskName -notlike "Adobe*" -and
    $_.TaskName -notlike "Google*"
}

foreach ($t in $tarefas) {
    $info = Get-ScheduledTaskInfo $t.TaskName -ErrorAction SilentlyContinue
    $action = ($t.Actions | Select-Object -First 1)
    $execute = $action.Execute + " " + $action.Arguments
    if ($execute -match 'powershell' -or $execute -match 'cmd' -or $execute -match 'wscript' -or $execute -match 'mshta') {
        Log "  Tarefa: $($t.TaskName) | $execute" "Yellow"
    }
}

# ── 3. Processos suspeitos ────────────────────────────────────────────────────
Log ""
Log "── 3. Processos suspeitos ──"

$procsSuspeitos = Get-Process | Where-Object {
    $_.Name -match 'mshta|wscript|cscript|powershell' -and
    $_.Id -ne $PID
}

foreach ($p in $procsSuspeitos) {
    Alerta "Processo suspeito em execução: $($p.Name) (PID $($p.Id))"
}

if ($procsSuspeitos.Count -eq 0) {
    Log "Nenhum processo suspeito detectado." "Green"
}

# ── 4. Ficheiros recentemente modificados (últimas 48h) ───────────────────────
Log ""
Log "── 4. Ficheiros modificados nas últimas 48h ──"

if (Test-Path $AppDir) {
    $recentes = Get-ChildItem $AppDir -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-48) } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 30

    foreach ($f in $recentes) {
        Log "  $($f.LastWriteTime.ToString('yyyy-MM-dd HH:mm')) — $($f.FullName)"
    }
}

# ── 5. Verificar IIS — módulos e handlers suspeitos ──────────────────────────
Log ""
Log "── 5. Módulos IIS ──"

try {
    $modulos = & "$env:SystemRoot\system32\inetsrv\appcmd.exe" list module /xml 2>$null
    if ($modulos -match 'isapi|filter' -and $modulos -notmatch 'AspNetCore|Static|Default') {
        Log "  Módulos IIS:" "Yellow"
        Log "  $modulos"
    } else {
        Log "Módulos IIS parecem normais." "Green"
    }
} catch {
    Log "IIS não acessível via appcmd." "Yellow"
}

# ── 6. Event Log — logins RDP recentes ───────────────────────────────────────
Log ""
Log "── 6. Logins no servidor (últimas 48h) ──"

try {
    $loginEvents = Get-WinEvent -FilterHashtable @{
        LogName   = 'Security'
        Id        = 4624, 4625
        StartTime = (Get-Date).AddHours(-48)
    } -ErrorAction SilentlyContinue | Select-Object -First 20

    foreach ($ev in $loginEvents) {
        $tipo = if ($ev.Id -eq 4624) { "LOGIN OK " } else { "LOGIN FAIL" }
        Log "  $tipo $($ev.TimeCreated.ToString('yyyy-MM-dd HH:mm')) — $($ev.Message.Substring(0, [Math]::Min(120, $ev.Message.Length)))"
    }
} catch {
    Log "Não foi possível ler Event Log de segurança (requer permissão)." "Yellow"
}

# ── Resumo ────────────────────────────────────────────────────────────────────
Log ""
Log "══════════════════════════════════════════════════"

if ($Alertas.Count -gt 0) {
    Log "❌ COMPROMISSO CONFIRMADO — $($Alertas.Count) alerta(s):" "Red"
    $Alertas | ForEach-Object { Log "   • $_" "Red" }
    Log ""
    Log "PASSOS OBRIGATÓRIOS:" "Red"
    Log "  1. Isolar servidor da internet (desactivar NIC ou firewall rule)" "Red"
    Log "  2. NÃO copiar ficheiros do servidor comprometido" "Red"
    Log "  3. Fazer git clone limpo do repositório" "Red"
    Log "  4. Rodar SECRET_KEY, DB_PASS e todos os tokens em .env" "Red"
    Log "  5. Criar nova BD ou restaurar backup anterior ao incidente" "Red"
    Log "  6. Fazer build limpo: npm ci && npm run build" "Red"
    Log "  7. Activar CSP headers (já incluídos no next.config.ts)" "Red"
    Log "  8. Activar TLS (win-acme per DEPLOY.md §6.1)" "Red"
    Log "  Log guardado em: $LogFile" "Red"
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 9099 -EntryType Error `
        -Message "Incident Response: $($Alertas.Count) alerta(s) — ver $LogFile"
    exit 1
} else {
    Log "✅ Nenhum sinal de compromisso detectado nos ficheiros verificados." "Green"
    Log "   Log guardado em: $LogFile" "Green"
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 9100 -EntryType Information `
        -Message "Incident Response: sem alertas — ver $LogFile"
    exit 0
}
