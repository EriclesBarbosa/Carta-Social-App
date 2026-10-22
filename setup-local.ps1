<#
.SYNOPSIS
    Carta Social — Setup inicial local (Windows + PostgreSQL).
    Executar UMA VEZ, na primeira instalação. Idempotente: pode ser
    re-executado sem destruir o que já existe.

.PARAMETER SchemaDump
    Caminho para o ficheiro SQL de SCHEMA (DDL: CREATE TABLE, índices, etc.).
    Gerado com: pg_dump --schema-only
    Ficheiro: carta_social_db.sql

.PARAMETER DataDump
    Caminho para o ficheiro SQL de DADOS (COPY statements, sem DDL).
    Gerado com: pg_dump --data-only
    Ficheiro: "Carta Social - Base de Dados.sql"

    Exemplo:
      .\setup-local.ps1 `
        -SchemaDump "C:\...\carta_social_db.sql" `
        -DataDump   "C:\...\Carta Social - Base de Dados.sql"

.PARAMETER PgBin
    Pasta dos executáveis PostgreSQL (default: PostgreSQL 17 padrão).

.PARAMETER PgPort
    Porta do servidor PostgreSQL (default: 5433 nesta máquina).

.PARAMETER DbName
    Nome da base de dados (default: db_dgis_site).

.PARAMETER DbUser
    Utilizador da base de dados (default: mfids_user).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Ficheiro SQL de schema (DDL)")]
    [string]$SchemaDump,

    [Parameter(Mandatory = $true, HelpMessage = "Ficheiro SQL de dados (COPY)")]
    [string]$DataDump,

    [string]$PgBin  = "C:\Program Files\PostgreSQL\17\bin",
    [string]$PgHost = "localhost",
    [int]   $PgPort = 5433,
    [string]$DbName = "db_dgis_site",
    [string]$DbUser = "mfids_user"
)

Set-StrictMode -Version Latest
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Helpers de output ─────────────────────────────────────────────────────────
function Step { param([int]$n, [string]$msg)
    Write-Host "`n[$n/9] $msg" -ForegroundColor Cyan }
function OK   { param([string]$msg) Write-Host "      OK  $msg" -ForegroundColor Green }
function Skip { param([string]$msg) Write-Host "      --  $msg (já existe)" -ForegroundColor Yellow }
function Fail { param([string]$msg) Write-Host "      ERR $msg" -ForegroundColor Red; exit 1 }

function ConvertFrom-SecureStringPlain([securestring]$s) {
    [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

function Invoke-Psql {
    param([string]$User, [string]$Pass,
          [string]$Db   = "postgres",
          [string]$Sql  = "",
          [string]$File = "")
    $env:PGPASSWORD = $Pass
    $a = @("-U", $User, "-h", $PgHost, "-p", $PgPort, "-d", $Db)
    if ($Sql)  { $a += @("-tAc", $Sql) }
    if ($File) { $a += @("-v", "ON_ERROR_STOP=0", "-f", $File) }
    & "$PgBin\psql.exe" @a 2>&1
}

# ── [0] Pré-requisitos ────────────────────────────────────────────────────────
Write-Host "`nCarta Social — Setup local" -ForegroundColor White
Write-Host ("─" * 50) -ForegroundColor DarkGray

Step 0 "Pré-requisitos"
if (-not (Test-Path $SchemaDump))       { Fail "Schema dump não encontrado: $SchemaDump" }
if (-not (Test-Path $DataDump))         { Fail "Data dump não encontrado: $DataDump" }
if (-not (Test-Path "$PgBin\psql.exe")) { Fail "psql não encontrado em: $PgBin" }
$env:PATH = "$PgBin;$env:PATH"
OK "psql $((& "$PgBin\psql.exe" --version 2>&1)[0])"
OK "Schema: $(Split-Path -Leaf $SchemaDump)"
OK "Dados:  $(Split-Path -Leaf $DataDump)"

# ── [1] Credenciais (pedidas uma vez, nunca escritas no ecrã) ─────────────────
Step 1 "Credenciais"
$pgPassSec = Read-Host "  Password do 'postgres' (superadmin PostgreSQL)" -AsSecureString
$dbPassSec = Read-Host "  Password para '$DbUser'"                         -AsSecureString
$pgPass    = ConvertFrom-SecureStringPlain $pgPassSec
$dbPass    = ConvertFrom-SecureStringPlain $dbPassSec

# ── [2] Utilizador de base de dados ──────────────────────────────────────────
Step 2 "Utilizador PostgreSQL"
$r = Invoke-Psql -User postgres -Pass $pgPass -Sql "SELECT 1 FROM pg_roles WHERE rolname='$DbUser'"
if ($r -contains "1") { Skip "'$DbUser'" }
else {
    $dbPassEsc = $dbPass.Replace("'", "''")
    Invoke-Psql -User postgres -Pass $pgPass `
        -Sql "CREATE USER $DbUser WITH PASSWORD '$dbPassEsc'" | Out-Null
    OK "Utilizador '$DbUser' criado"
}

# ── [3] Base de dados ─────────────────────────────────────────────────────────
Step 3 "Base de dados"
$r = Invoke-Psql -User postgres -Pass $pgPass -Sql "SELECT 1 FROM pg_database WHERE datname='$DbName'"
if ($r -contains "1") { Skip "'$DbName'" }
else {
    Invoke-Psql -User postgres -Pass $pgPass `
        -Sql "CREATE DATABASE $DbName OWNER $DbUser" | Out-Null
    OK "Base de dados '$DbName' criada"
}

# ── [4] Restaurar dump ────────────────────────────────────────────────────────
Step 4 "Restaurar schema e dados"
$rows = (Invoke-Psql -User $DbUser -Pass $dbPass -Db $DbName `
    -Sql "SELECT COALESCE(MAX(id),0) FROM api_dominio") -as [int]
if ($rows -gt 0) { Skip "Dados já presentes ($rows domínios em api_dominio)" }
else {
    # 4a. Schema (DDL: CREATE TABLE, índices, constraints)
    $out = Invoke-Psql -User $DbUser -Pass $dbPass -Db $DbName -File $SchemaDump
    $errs = $out | Where-Object { $_ -match "ERROR" -and $_ -notmatch "permission denied to change default" }
    if ($errs) {
        Write-Host "      Avisos schema:" -ForegroundColor Yellow
        $errs | Select-Object -First 3 | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
    }
    $n = (Invoke-Psql -User $DbUser -Pass $dbPass -Db $DbName `
        -Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'") -as [int]
    OK "Schema: $n tabelas criadas"

    # 4b. Dados (COPY) — como superuser com FK desactivadas.
    #     O dump de dados referencia auth_user IDs que não existem ainda:
    #     session_replication_role='replica' desactiva os triggers de FK
    #     sem comprometer a integridade do schema.
    $wrapperPath = "$env:TEMP\cs_restore_data.sql"
    @"
SET session_replication_role = 'replica';
\i '$($DataDump.Replace('\','/'))'
SET session_replication_role = 'origin';
"@ | Set-Content -Path $wrapperPath -Encoding UTF8

    $env:PGPASSWORD = $pgPass   # precisa de superuser para session_replication_role
    $out = Invoke-Psql -User "postgres" -Pass $pgPass -Db $DbName -File $wrapperPath
    $env:PGPASSWORD = $dbPass   # restaurar credenciais normais
    $errs = $out | Where-Object { $_ -match "ERROR" -and $_ -notmatch "permission denied to change default" }
    if ($errs) {
        Write-Host "      Avisos dados:" -ForegroundColor Yellow
        $errs | Select-Object -First 3 | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
    }
    Remove-Item $wrapperPath -Force
    $domCount = (Invoke-Psql -User $DbUser -Pass $dbPass -Db $DbName `
        -Sql "SELECT COUNT(*) FROM api_dominio") -as [int]
    OK "Dados: $domCount domínios em api_dominio"
}

# ── [5] .env do backend ───────────────────────────────────────────────────────
Step 5 "Ficheiro .env (backend)"
$envPath = Join-Path $Root "BackEnd\mfids\.env"
if (Test-Path $envPath) { Skip ".env" }
else {
    # SECRET_KEY aleatória de 50 caracteres (nunca hardcoded no repositório)
    $chars  = (65..90) + (97..122) + (48..57)
    $secret = -join ($chars | Get-Random -Count 50 | ForEach-Object { [char]$_ })
    $lines  = @(
        "DEBUG=True",
        "SECRET_KEY=$secret",
        "DB_ENGINE=postgresql",
        "DB_HOST=$PgHost",
        "DB_PORT=$PgPort",
        "DB_NAME=$DbName",
        "DB_USERNAME=$DbUser",
        "DB_PASS=$dbPass",
        "STRIPE_SECRET_KEY=",
        "STRIPE_PUBLISHABLE_KEY=",
        "DOMAIN_URL=http://127.0.0.1:8000/",
        "DSN_KEY=",
        "# EMAIL_HOST_PASSWORD=",
        "# CELERY_BROKER_URL=redis://localhost:6379"
    )
    $lines | Set-Content -Path $envPath -Encoding UTF8
    OK ".env criado (SECRET_KEY gerada aleatoriamente)"
}

# ── [6] Python venv + dependências ───────────────────────────────────────────
Step 6 "Ambiente Python"
$beDir  = Join-Path $Root "BackEnd\mfids"
$venvPy = Join-Path $beDir "venv\Scripts\python.exe"

Push-Location $beDir
try {
    if (-not (Test-Path $venvPy)) {
        python -m venv venv | Out-Null; OK "venv criado"
    } else { Skip "venv" }

    & $venvPy -m pip install --upgrade pip setuptools wheel -q 2>&1 | Out-Null
    & $venvPy -m pip install -r requirements.txt -q 2>&1 | Out-Null
    OK "Dependências Python instaladas"
} finally { Pop-Location }

# ── [7] Migrações Django ──────────────────────────────────────────────────────
Step 7 "Migrações Django"
Push-Location $beDir
try {
    # O dump de dados traz django_migrations do servidor de produção, que tem
    # migrações extras (authentication 0004-0014) que não existem neste codebase.
    # Django falha ao reconstruir o estado com entradas desconhecidas.
    # Solução: limpar django_migrations e usar --fake com as migrações do codebase.
    $env:PGPASSWORD = $dbPass
    Invoke-Psql -User $DbUser -Pass $dbPass -Db $DbName `
        -Sql "TRUNCATE django_migrations" | Out-Null

    & $venvPy manage.py migrate --fake 2>&1 | Out-Null
    $applied = (& $venvPy manage.py showmigrations --plan 2>&1 |
        Where-Object { $_ -match "^\[X\]" }).Count
    OK "$applied migrações registadas (--fake)"
} finally { Pop-Location }

# ── [8] Superutilizador Django ────────────────────────────────────────────────
Step 8 "Superutilizador Django"
Push-Location $beDir
try {
    $suEmail  = Read-Host "  Email do superutilizador (serve de username)"
    $suPassSec = Read-Host "  Password do superutilizador" -AsSecureString
    $suPass   = ConvertFrom-SecureStringPlain $suPassSec

    $exists = & $venvPy manage.py shell -c @"
from django.contrib.auth.models import User
print(User.objects.filter(username='$suEmail').exists())
"@ 2>&1 | Select-Object -Last 1

    if ($exists -eq "True") { Skip "Superutilizador '$suEmail'" }
    else {
        & $venvPy manage.py shell -c @"
from django.contrib.auth.models import User
User.objects.create_superuser(username='$suEmail', email='$suEmail', password=r'$suPass')
"@ 2>&1 | Out-Null
        OK "Superutilizador '$suEmail' criado"
    }
} finally { Pop-Location }

# ── [9] Frontend Next.js ──────────────────────────────────────────────────────
Step 9 "Frontend Next.js"
$feDir     = Join-Path $Root "mfids_cs_app"
$envLocal  = Join-Path $feDir ".env.local"
$nodeModules = Join-Path $feDir "node_modules"

if (-not (Test-Path $envLocal)) {
    "API_URL=http://localhost:8000" | Set-Content -Path $envLocal -Encoding UTF8
    OK ".env.local criado (API_URL=http://localhost:8000)"
} else { Skip ".env.local" }

Push-Location $feDir
try {
    if (Test-Path $nodeModules) { Skip "node_modules" }
    else {
        # --legacy-peer-deps necessário: react-leaflet-cluster exige React 18,
        # o projecto usa React 19
        npm install --legacy-peer-deps --silent 2>&1 | Out-Null
        OK "Dependências npm instaladas"
    }
} finally { Pop-Location }

# ── Resumo ─────────────────────────────────────────────────────────────────────
Write-Host "`n$("─" * 50)" -ForegroundColor Green
Write-Host "  Setup concluído com sucesso!" -ForegroundColor Green
Write-Host "$("─" * 50)`n" -ForegroundColor Green
Write-Host "  Backend (terminal 1):" -ForegroundColor White
Write-Host "    cd BackEnd\mfids" -ForegroundColor DarkGray
Write-Host "    venv\Scripts\activate" -ForegroundColor DarkGray
Write-Host "    python manage.py runserver" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Frontend (terminal 2):" -ForegroundColor White
Write-Host "    cd mfids_cs_app" -ForegroundColor DarkGray
Write-Host "    npm run dev" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  URLs:" -ForegroundColor White
Write-Host "    http://localhost:8000/api/docs/          Swagger" -ForegroundColor DarkGray
Write-Host "    http://127.0.0.1:8000/users/signin/     Login Django" -ForegroundColor DarkGray
Write-Host "    http://localhost:3000                    Frontend" -ForegroundColor DarkGray
Write-Host ""
