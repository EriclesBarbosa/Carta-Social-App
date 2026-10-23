#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Reverte a base de dados para um dump SQL anterior.

.DESCRIPTION
    ATENÇÃO: Esta operação apaga PERMANENTEMENTE todos os dados criados após o backup.
    É irreversível. Exige confirmação de dois membros sénior antes de executar.

    O script:
    1. Mostra um aviso bem visível com os detalhes
    2. Pede aprovação de dois membros sénior (nomes registados no log)
    3. Para IIS e Celery para libertar conexões à BD
    4. Termina sessões activas na base de dados
    5. Drop + recreate da base de dados
    6. Restaura o dump com session_replication_role='replica' (ignora FK temporariamente)
    7. Reinicia os serviços

.PARAMETER DumpFile
    Caminho completo para o ficheiro .sql de backup.

.EXAMPLE
    .\rollback-db.ps1 -DumpFile "C:\apps\cartasocial\backups\pre-migrate-20261023-143000.sql"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$DumpFile
)

$PgBin      = "C:\Program Files\PostgreSQL\16\bin"
$DbName     = "DB_DGIS_SITE"
$DbUser     = "mfids_user"
$PgSuperUser = "postgres"

# ── Validações iniciais ───────────────────────────────────────────────────────
if (-not (Test-Path $DumpFile)) {
    Write-Error "Ficheiro '$DumpFile' não encontrado."
    exit 1
}

$tamanhoMB = [math]::Round((Get-Item $DumpFile).Length / 1MB, 1)
$dataDump  = (Get-Item $DumpFile).LastWriteTime

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║           ⚠️  ROLLBACK DA BASE DE DADOS — IRREVERSÍVEL           ║" -ForegroundColor Red
Write-Host "║                                                                   ║" -ForegroundColor Red
Write-Host "║  Esta operação vai APAGAR TODOS OS DADOS desde o backup abaixo.  ║" -ForegroundColor Red
Write-Host "║  Não é possível recuperar os dados apagados depois disto.         ║" -ForegroundColor Red
Write-Host "║                                                                   ║" -ForegroundColor Red
Write-Host "║  Dump   : $DumpFile" -ForegroundColor Yellow
Write-Host "║  Tamanho: $tamanhoMB MB   |   Data: $($dataDump.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Yellow
Write-Host "║  BD     : $DbName" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

$aprovacao1 = Read-Host "Aprovação 1 — Nome do primeiro membro sénior"
if (-not $aprovacao1) { Write-Host "Cancelado — aprovação em branco."; exit 0 }

$aprovacao2 = Read-Host "Aprovação 2 — Nome do segundo membro sénior"
if (-not $aprovacao2) { Write-Host "Cancelado — aprovação em branco."; exit 0 }

$confirmacao = Read-Host "`nPara confirmar, escreve exactamente: CONFIRMO ROLLBACK"
if ($confirmacao -ne "CONFIRMO ROLLBACK") {
    Write-Host "Cancelado — confirmação incorrecta."
    exit 0
}

$logLine = "$(Get-Date) | ROLLBACK BD aprovado por: '$aprovacao1' e '$aprovacao2' | dump: $DumpFile"
Add-Content "C:\apps\cartasocial\logs\rollback-audit.log" $logLine
Write-Host "`n$logLine"

# ── Passo 1: Parar serviços ───────────────────────────────────────────────────
Write-Host "`n==> A parar serviços com acesso à BD..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Stop-Service CeleryBeat, CeleryWorker -Force -ErrorAction SilentlyContinue
Stop-WebSite "CartaSocial-API" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 8

# ── Passo 2: Pedir password do postgres ──────────────────────────────────────
$pgSuperPass = Read-Host "Password do utilizador PostgreSQL '$PgSuperUser'" -AsSecureString
$pgUserPass  = Read-Host "Password do utilizador PostgreSQL '$DbUser'"      -AsSecureString

$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgSuperPass))

# ── Passo 3: Terminar sessões activas na BD ───────────────────────────────────
Write-Host "==> A terminar sessões activas em $DbName..."
& "$PgBin\psql.exe" -U $PgSuperUser -c @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DbName'
  AND pid <> pg_backend_pid();
"@

# ── Passo 4: Drop + recreate ──────────────────────────────────────────────────
Write-Host "==> A apagar base de dados $DbName..."
& "$PgBin\psql.exe" -U $PgSuperUser -c "DROP DATABASE IF EXISTS `"$DbName`";"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ DROP DATABASE falhou. A abortar."
    Start-WebSite "CartaSocial-API"
    Start-Service CeleryWorker -ErrorAction SilentlyContinue
    Start-Service CeleryBeat   -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "==> A recriar base de dados $DbName..."
& "$PgBin\psql.exe" -U $PgSuperUser -c @"
CREATE DATABASE "$DbName"
  OWNER $DbUser
  ENCODING 'UTF8'
  TEMPLATE template0;
"@

# ── Passo 5: Restaurar dump ────────────────────────────────────────────────────
Write-Host "==> A restaurar dump (pode demorar vários minutos)..."
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgUserPass))

# session_replication_role='replica' desactiva FK checks durante o restore
& "$PgBin\psql.exe" -U $DbUser -d $DbName `
    -c "SET session_replication_role = 'replica';"
& "$PgBin\psql.exe" -U $DbUser -d $DbName -f $DumpFile
& "$PgBin\psql.exe" -U $DbUser -d $DbName `
    -c "SET session_replication_role = 'origin';"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ psql restore falhou. Verifica o ficheiro de dump manualmente."
    exit 1
}

# ── Passo 6: Reiniciar serviços ───────────────────────────────────────────────
Write-Host "==> A reiniciar serviços..."
Start-WebSite "CartaSocial-API"
Start-Service CeleryWorker -ErrorAction SilentlyContinue
Start-Service CeleryBeat   -ErrorAction SilentlyContinue
Start-Sleep -Seconds 8

# ── Smoke test ────────────────────────────────────────────────────────────────
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/api/docs/" -UseBasicParsing -TimeoutSec 20
    Write-Host "✅ Rollback da BD concluído! Backend a responder: HTTP $($r.StatusCode)"
} catch {
    Write-Host "❌ Backend não responde após rollback: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "REGISTO DE AUDITORIA: $logLine"
$env:PGPASSWORD = ""
