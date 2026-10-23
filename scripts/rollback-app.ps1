#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Reverte o código da aplicação para um snapshot anterior.

.DESCRIPTION
    Para IIS e Celery, substitui o directório do backend pelo snapshot indicado,
    reinicia os serviços e confirma com um smoke test.
    NÃO reverte a base de dados — para isso usa rollback-db.ps1.

.PARAMETER BackupNome
    Nome da pasta de snapshot dentro de C:\apps\cartasocial\backups.
    Exemplo: snapshot-20261023-143500-backend

.EXAMPLE
    .\rollback-app.ps1 -BackupNome "snapshot-20261023-143500-backend"

    # Para ver os snapshots disponíveis:
    .\rollback-app.ps1 -ListarSnapshots
#>

param(
    [string]$BackupNome,
    [switch]$ListarSnapshots
)

$BackupDir  = "C:\apps\cartasocial\backups"
$AppDir     = "C:\apps\cartasocial\backend\BackEnd\mfids"
$BackendBase = "C:\apps\cartasocial\backend\BackEnd"

# ── Listar snapshots disponíveis ──────────────────────────────────────────────
if ($ListarSnapshots -or -not $BackupNome) {
    Write-Host "`nSnapshots disponíveis em $BackupDir :`n"
    $snaps = Get-ChildItem $BackupDir -Filter "snapshot-*" -Directory |
             Sort-Object LastWriteTime -Descending
    if ($snaps.Count -eq 0) {
        Write-Host "  (nenhum snapshot encontrado)"
    } else {
        $snaps | ForEach-Object {
            $mb = [math]::Round((Get-ChildItem $_.FullName -Recurse -File |
                  Measure-Object -Property Length -Sum).Sum / 1MB, 1)
            Write-Host "  $($_.Name)  [$mb MB]  $(Get-Date $_.LastWriteTime -Format 'yyyy-MM-dd HH:mm')"
        }
    }
    Write-Host "`nUso: .\rollback-app.ps1 -BackupNome `"<nome>`""
    exit 0
}

$BackupPath = "$BackupDir\$BackupNome"

if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Snapshot '$BackupNome' não encontrado em $BackupDir"
    Write-Host "   Usa -ListarSnapshots para ver os disponíveis."
    exit 1
}

Write-Host "╔══════════════════════════════════════════════════════════════╗"
Write-Host "║              ROLLBACK DE CÓDIGO — Carta Social               ║"
Write-Host "║                                                               ║"
Write-Host "║  Snapshot : $BackupNome"
Write-Host "║  Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "╚══════════════════════════════════════════════════════════════╝"
$confirmar = Read-Host "`nContinuar? (S/N)"
if ($confirmar -ne "S") { Write-Host "Cancelado."; exit 0 }

# ── Parar serviços ────────────────────────────────────────────────────────────
Write-Host "`n==> A parar serviços..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Stop-Service CeleryBeat, CeleryWorker -Force -ErrorAction SilentlyContinue
Stop-WebSite "CartaSocial-API" -ErrorAction SilentlyContinue
Stop-WebSite "CartaSocial-App" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# ── Guardar versão falhada para análise posterior ─────────────────────────────
$failedName = "failed-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "==> A mover versão actual para: $BackendBase\$failedName"
Rename-Item $AppDir "$BackendBase\$failedName" -ErrorAction Stop

# ── Restaurar versão anterior ─────────────────────────────────────────────────
Write-Host "==> A restaurar snapshot: $BackupNome"
Copy-Item $BackupPath $AppDir -Recurse -ErrorAction Stop

# ── Reiniciar serviços ────────────────────────────────────────────────────────
Write-Host "==> A reiniciar serviços..."
Start-WebSite "CartaSocial-API"
Start-WebSite "CartaSocial-App"
Start-Service CeleryWorker -ErrorAction SilentlyContinue
Start-Service CeleryBeat   -ErrorAction SilentlyContinue
Start-Sleep -Seconds 8

# ── Smoke test ────────────────────────────────────────────────────────────────
Write-Host "==> Smoke test..."
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/api/docs/" -UseBasicParsing -TimeoutSec 20
    Write-Host "✅ Rollback concluído! Backend a responder: HTTP $($r.StatusCode)"
    Write-Host "   Versão falhada guardada em: $BackendBase\$failedName"
} catch {
    Write-Host "❌ Sistema ainda não responde após rollback: $($_.Exception.Message)"
    Write-Host "   Escalona o incidente para o nível superior."
    exit 1
}
