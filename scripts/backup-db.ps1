#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Faz backup diário da base de dados PostgreSQL com retenção de 30 dias.

.DESCRIPTION
    Cria um dump SQL da BD DB_DGIS_SITE, comprime com 7-Zip,
    apaga dumps com mais de 30 dias e regista o resultado no Windows Event Log.

    Podes correr manualmente a qualquer momento:
        .\backup-db.ps1

    Para agendar automaticamente às 02:00 todos os dias:
        .\backup-db.ps1 -Agendar

.PARAMETER Agendar
    Regista o script no Task Scheduler para correr diariamente às 02:00.

.PARAMETER RetencaoDias
    Número de dias a guardar backups (padrão: 30).

.EXAMPLE
    .\backup-db.ps1
    .\backup-db.ps1 -Agendar
    .\backup-db.ps1 -RetencaoDias 60
#>

param(
    [switch]$Agendar,
    [int]$RetencaoDias = 30
)

$PgBin   = "C:\Program Files\PostgreSQL\16\bin"
$DbName  = "DB_DGIS_SITE"
$DbUser  = "mfids_user"
$BackDir = "C:\apps\cartasocial\backups\daily"
$SevenZip = "C:\Program Files\7-Zip\7z.exe"

# ── Modo -Agendar: regista no Task Scheduler e sai ────────────────────────────
if ($Agendar) {
    $scriptPath = $MyInvocation.MyCommand.Path

    $action   = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`""

    $trigger  = New-ScheduledTaskTrigger -Daily -At 02:00
    $settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable -StartWhenAvailable

    $existente = Get-ScheduledTask -TaskName "CartaSocial-BackupDiario" -ErrorAction SilentlyContinue
    if ($existente) {
        Unregister-ScheduledTask -TaskName "CartaSocial-BackupDiario" -Confirm:$false
    }

    Register-ScheduledTask `
        -TaskName "CartaSocial-BackupDiario" `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -RunLevel Highest `
        -User "SYSTEM"

    Write-Host "✅ Backup diário agendado para as 02:00 (Task: CartaSocial-BackupDiario)"
    Write-Host "   Para testar agora: Start-ScheduledTask 'CartaSocial-BackupDiario'"
    exit 0
}

# ── Backup ────────────────────────────────────────────────────────────────────
New-Item -ItemType Directory -Path $BackDir -Force | Out-Null

# Registar source de eventos se necessário
if (-not [System.Diagnostics.EventLog]::SourceExists("CartaSocial")) {
    try { New-EventLog -LogName Application -Source "CartaSocial" } catch {}
}

$ts       = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpFile = "$BackDir\$DbName-$ts.sql"

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ==> A criar backup de $DbName..."

# Ler password de forma segura (não a guardar no script)
if (-not $env:PGPASSWORD) {
    $pgPass = Read-Host "Password do utilizador PostgreSQL '$DbUser'" -AsSecureString
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPass))
}

& "$PgBin\pg_dump.exe" `
    -U $DbUser `
    -d $DbName `
    -F plain `
    --no-owner `
    --no-acl `
    -f $dumpFile

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dumpFile)) {
    $msg = "FALHA no backup de $DbName (pg_dump exit code $LASTEXITCODE)"
    Write-Host "❌ $msg" -ForegroundColor Red
    Write-EventLog -LogName Application -Source "CartaSocial" `
        -EventId 5020 -EntryType Error -Message $msg
    $env:PGPASSWORD = ""
    exit 1
}

$dumpMB = [math]::Round((Get-Item $dumpFile).Length / 1MB, 2)
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ==> Dump criado: $dumpFile ($dumpMB MB)"

# ── Comprimir com 7-Zip ───────────────────────────────────────────────────────
if (Test-Path $SevenZip) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ==> A comprimir..."
    & $SevenZip a "$dumpFile.gz" $dumpFile -sdel | Out-Null
    $compMB = [math]::Round((Get-Item "$dumpFile.gz").Length / 1MB, 2)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ==> Comprimido: $dumpFile.gz ($compMB MB)"
    $finalFile = "$dumpFile.gz"
} else {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⚠️  7-Zip não encontrado — ficheiro não comprimido."
    $finalFile = $dumpFile
}

# ── Limpeza de backups antigos ────────────────────────────────────────────────
$cortaData = (Get-Date).AddDays(-$RetencaoDias)
$removidos = Get-ChildItem $BackDir -File |
             Where-Object { $_.LastWriteTime -lt $cortaData }

$removidos | Remove-Item -Force
if ($removidos.Count -gt 0) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ==> $($removidos.Count) backup(s) antigo(s) removido(s) (> $RetencaoDias dias)."
}

# ── Registo no Event Log ──────────────────────────────────────────────────────
$msg = "Backup diário concluído: $finalFile ($([math]::Round((Get-Item $finalFile).Length / 1MB, 2)) MB)"
Write-EventLog -LogName Application -Source "CartaSocial" `
    -EventId 5010 -EntryType Information -Message $msg

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ $msg"
$env:PGPASSWORD = ""
