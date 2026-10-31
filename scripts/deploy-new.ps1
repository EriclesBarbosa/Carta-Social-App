<#
.SYNOPSIS
    Instala a aplicação Carta Social num servidor Windows novo (primeira instalação).

.DESCRIPTION
    Configura o ambiente completo: PostgreSQL, Django backend, Next.js frontend,
    IIS e serviços Celery. Suporta os ambientes 'producao' e 'staging'.
    Requer o dump de base de dados para popular as tabelas de geografia,
    domínios e grupos/permissões.

.PARAMETER Ambiente
    'producao' (default) ou 'staging'.

.PARAMETER AppRoot
    Substitui a pasta raiz do ambiente. Usar apenas se não quiser o caminho padrão.

.PARAMETER DbPassword
    Password para o utilizador PostgreSQL. Obrigatório.

.PARAMETER DumpPath
    Caminho para o ficheiro SQL de dump de produção (carta_social_data_db.sql).
    Sem este ficheiro os dropdowns de geografia e domínios ficam vazios.

.PARAMETER RepoUrl
    URL do repositório git.

.PARAMETER DryRun
    Simula a instalação sem fazer nada. Mostra configuração, caminhos e comandos
    que seriam executados. Útil para validar antes de correr a sério.
    Todos os pré-requisitos (git, python, node, psql, disco) são verificados mesmo
    em DryRun. Nenhum ficheiro, base de dados ou serviço é criado ou alterado.

.EXAMPLE
    .\scripts\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql"
    .\scripts\deploy-new.ps1 -Ambiente staging -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql"
    .\scripts\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql" -AppRoot "D:\apps\cartasocial"
    .\scripts\deploy-new.ps1 -DbPassword "MinhaPass2026!" -DumpPath "C:\dumps\carta_social_data_db.sql" -DryRun

.NOTES
    Pré-requisitos (instalar manualmente antes de correr este script):
      - Git
      - Python 3.11+  (python.org)
      - Node.js 20+   (nodejs.org)
      - PostgreSQL 16 (postgresql.org) — serviço a correr
      - IIS (Install-WindowsFeature Web-Server,Web-Scripting-Tools)
      - httpPlatformHandler (https://www.iis.net/downloads/microsoft/httpplatformhandler)
      - WebAdministration PowerShell module (instalado com Web-Scripting-Tools)

    Dados críticos que vêm do dump:
      - Tabela 'geografia'     → dropdowns ilha/concelho/freguesia/zona/lugar
      - Tabela 'dominio'       → tipos de equipamento, serviço, regime propriedade, etc.
      - auth_group             → grupos DGIS, Agentes, Proprietário, Gestor, MFIDS
      - auth_group_permissions → permissões por grupo (can_access_frontend, etc.)

    Sem o dump estas tabelas ficam vazias e o sistema não é utilizável.
#>

param(
    [ValidateSet("producao", "staging")]
    [string]$Ambiente  = "producao",
    [string]$AppRoot   = "",
    [Parameter(Mandatory)]
    [string]$DbPassword,
    [string]$PostgresPassword = "postgres",
    [string]$DumpPath  = "",
    [string]$RepoUrl   = "https://github.com/EriclesBarbosa/Carta-Social-App.git",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# ── Configuração por ambiente ─────────────────────────────────────────────────
$configs = @{
    producao = @{
        AppRoot      = "C:\apps\cartasocial"
        BackendDir   = "C:\apps\cartasocial\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial\frontend\mfids_cs_app"
        LogDir       = "C:\apps\cartasocial\logs"
        BackupDir    = "C:\apps\cartasocial\backups"
        Python       = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip          = "C:\apps\cartasocial\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API      = "CartaSocial-API"
        IIS_App      = "CartaSocial-App"
        IIS_API_Port = 8000
        IIS_App_Port = 4000
        DbName       = "DB_DGIS_SITE"
        DbUser       = "mfids_user"
        ApiUrl       = "http://localhost:8000"
        SmokePort    = 8099
        CeleryWorker = "CartaSocial-Celery-Worker"
        CeleryBeat   = "CartaSocial-Celery-Beat"
    }
    staging = @{
        AppRoot      = "C:\apps\cartasocial-staging"
        BackendDir   = "C:\apps\cartasocial-staging\backend\BackEnd\mfids"
        FrontDir     = "C:\apps\cartasocial-staging\frontend\mfids_cs_app"
        LogDir       = "C:\apps\cartasocial-staging\logs"
        BackupDir    = "C:\apps\cartasocial-staging\backups"
        Python       = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
        Pip          = "C:\apps\cartasocial-staging\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
        IIS_API      = "CartaSocial-API-Staging"
        IIS_App      = "CartaSocial-App-Staging"
        IIS_API_Port = 8001
        IIS_App_Port = 4001
        DbName       = "DB_DGIS_SITE_STAGING"
        DbUser       = "mfids_user_staging"
        ApiUrl       = "http://localhost:8001"
        SmokePort    = 8098
        CeleryWorker = "CartaSocial-Celery-Worker-Staging"
        CeleryBeat   = "CartaSocial-Celery-Beat-Staging"
    }
}

$cfg = $configs[$Ambiente]

# Override AppRoot se fornecido explicitamente
if ($AppRoot) {
    $cfg.AppRoot     = $AppRoot
    $cfg.BackendDir  = "$AppRoot\backend\BackEnd\mfids"
    $cfg.FrontDir    = "$AppRoot\frontend\mfids_cs_app"
    $cfg.LogDir      = "$AppRoot\logs"
    $cfg.BackupDir   = "$AppRoot\backups"
    $cfg.Python      = "$AppRoot\backend\BackEnd\mfids\venv_prod\Scripts\python.exe"
    $cfg.Pip         = "$AppRoot\backend\BackEnd\mfids\venv_prod\Scripts\pip.exe"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$lockFile  = "$env:TEMP\cartasocial-deploy-new-$Ambiente.lock"
$LogFile   = "$($cfg.LogDir)\deploy-new-$timestamp.log"

if (-not $DryRun) {
    New-Item -ItemType Directory -Path $cfg.LogDir -Force | Out-Null
}

# ── Verificação de privilégios (runtime, não directiva de parser) ─────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] A correr sem privilégios de Administrador (aceitável em modo DryRun)." -ForegroundColor DarkYellow
    } else {
        Write-Host "ERRO: Este script requer privilégios de Administrador." -ForegroundColor Red
        Write-Host "  Abrir PowerShell como Administrador e voltar a correr." -ForegroundColor Gray
        exit 1
    }
}

function Log($msg) {
    $prefix = if ($DryRun) { "[DRY RUN $(Get-Date -Format 'HH:mm:ss')]" } else { "[$(Get-Date -Format 'HH:mm:ss')]" }
    $line   = "$prefix $msg"
    Write-Host $line
    if (-not $DryRun) { Add-Content $LogFile $line }
}

function DryStep($msg) {
    Write-Host "  [DRY RUN] ▶ $msg" -ForegroundColor DarkYellow
}

function Abort($msg) {
    Log "❌ ABORTADO: $msg"
    if (-not $DryRun) { Log "   Log: $LogFile" }
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    exit 1
}

$_missingCmds = @()
function Check-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] ⚠  '$cmd' não encontrado nesta máquina (necessário no servidor alvo)" -ForegroundColor Yellow
            $script:_missingCmds += $cmd
        } else {
            Abort "'$cmd' não encontrado. Instala o pré-requisito e volta a correr."
        }
    } else {
        if ($DryRun) { Write-Host "  [DRY RUN] ✓  '$cmd' encontrado" -ForegroundColor DarkYellow }
    }
}

# ── Modo DryRun: banner ───────────────────────────────────────────────────────
if ($DryRun) {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor DarkYellow
    Write-Host "  ║  MODO DRY RUN — simulação sem alterações reais          ║" -ForegroundColor DarkYellow
    Write-Host "  ║  Pré-requisitos verificados. Nenhum ficheiro,           ║" -ForegroundColor DarkYellow
    Write-Host "  ║  base de dados ou serviço será criado ou alterado.      ║" -ForegroundColor DarkYellow
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor DarkYellow
    Write-Host ""
}

# ── LOCK: prevenir instalações concorrentes (ignorado em DryRun) ──────────────
if (-not $DryRun) {
    if (Test-Path $lockFile) {
        $lockInfo = Get-Content $lockFile -Raw -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "ERRO: Deploy já em curso para '$($Ambiente.ToUpper())'!" -ForegroundColor Red
        Write-Host "  Iniciado por: $lockInfo" -ForegroundColor Yellow
        Write-Host "  Se não há deploy activo, remover: $lockFile`n" -ForegroundColor Gray
        exit 1
    }
    "$(whoami) | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $env:COMPUTERNAME" `
        | Set-Content $lockFile -Encoding UTF8
}

try {

Log "════════════════════════════════════════════════════════"
Log " Carta Social — Deploy de Nova Instalação ($($Ambiente.ToUpper()))$(if ($DryRun) { ' [DRY RUN]' })"
Log " Data/hora : $(Get-Date)"
Log " AppRoot   : $($cfg.AppRoot)"
Log " Dump      : $(if ($DumpPath) { $DumpPath } else { 'NÃO fornecido — dados iniciais em falta' })"
Log "════════════════════════════════════════════════════════"

# ── FASE 0: Verificar pré-requisitos ─────────────────────────────────────────
Log "==> 0/9  A verificar pré-requisitos..."
Check-Command git
Check-Command python
Check-Command node
Check-Command npm
Check-Command psql

$pyVer   = python --version 2>&1
$nodeVer = node --version 2>&1
Log "    Python : $pyVer"
Log "    Node   : $nodeVer"

# Verificar versão mínima Python (>= 3.11)
if (-not $DryRun) {
    $pyMatch = [regex]::Match("$pyVer", 'Python (\d+)\.(\d+)')
    if ($pyMatch.Success) {
        $pyMajor = [int]$pyMatch.Groups[1].Value
        $pyMinor = [int]$pyMatch.Groups[2].Value
        if ($pyMajor -lt 3 -or ($pyMajor -eq 3 -and $pyMinor -lt 11)) {
            Abort "Python $pyMajor.$pyMinor detectado — é necessário Python 3.11 ou superior."
        }
    }
}

# Verificar versão mínima Node.js (>= 20)
if (-not $DryRun) {
    $nodeMatch = [regex]::Match("$nodeVer", 'v(\d+)')
    if ($nodeMatch.Success) {
        $nodeMajor = [int]$nodeMatch.Groups[1].Value
        if ($nodeMajor -lt 20) {
            Abort "Node.js v$nodeMajor detectado — é necessário Node.js 20 ou superior."
        }
    }
}

# Verificar IIS e httpPlatformHandler
$iisOk  = $false
$hphOk  = $false
if (-not $DryRun) {
    $w3svc = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
    $iisOk = $w3svc -ne $null
    if (-not $iisOk) {
        Write-Host ""
        Write-Host "  ERRO: IIS nao instalado (servico W3SVC nao encontrado)." -ForegroundColor Red
        Write-Host "  O deploy-new.ps1 requer IIS para criar os sites da aplicacao." -ForegroundColor Red
        Write-Host ""
        Write-Host "  Instalar pre-requisitos primeiro:" -ForegroundColor Yellow
        Write-Host "    .\scripts\install-prerequisites.ps1" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Ou instalar apenas o IIS manualmente:" -ForegroundColor Yellow
        Write-Host "    (Windows Server) Install-WindowsFeature Web-Server,Web-Scripting-Tools" -ForegroundColor Gray
        Write-Host "    (Windows 10/11)  Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole,IIS-ManagementScriptingTools -All" -ForegroundColor Gray
        Write-Host ""
        Abort "IIS nao instalado. Correr install-prerequisites.ps1 primeiro."
    }
    Log "    IIS    : W3SVC encontrado."

    # Verificar httpPlatformHandler (necessario para web.config do backend e frontend)
    $hphPath   = "$env:SystemRoot\system32\inetsrv\HttpPlatformHandler.dll"
    $hphPathV2 = "${env:ProgramFiles}\IIS\HttpPlatformHandlerV2\httpPlatformHandlerV2.dll"
    $hphOk     = (Test-Path $hphPath) -or (Test-Path $hphPathV2)
    if (-not $hphOk) {
        Write-Host ""
        Write-Host "  ERRO: httpPlatformHandler nao instalado." -ForegroundColor Red
        Write-Host "  O backend (waitress) e o frontend (node) nao arrancam via IIS sem este modulo." -ForegroundColor Red
        Write-Host ""
        Write-Host "  Instalar:" -ForegroundColor Yellow
        Write-Host "    1. Abrir: https://www.iis.net/downloads/microsoft/httpplatformhandler" -ForegroundColor Cyan
        Write-Host "    2. Descarregar e executar o .msi (x64)" -ForegroundColor Gray
        Write-Host "    3. Voltar a correr este script" -ForegroundColor Gray
        Write-Host ""
        Abort "httpPlatformHandler nao instalado. Ver instrucoes acima."
    }
    Log "    IIS    : httpPlatformHandler encontrado."
} else {
    Write-Host "  [DRY RUN] IIS: verificar se W3SVC existe e httpPlatformHandler instalado" -ForegroundColor DarkYellow
}

# Espaço em disco (mínimo 5 GB para nova instalação)
$drive  = Split-Path $cfg.AppRoot -Qualifier
$disk   = Get-PSDrive ($drive.TrimEnd(':'))
$freeGB = [math]::Round($disk.Free / 1GB, 1)
if ($freeGB -lt 5) {
    Abort "Espaço insuficiente em $drive`: $freeGB GB disponíveis (mínimo 5 GB)"
}
Log "    Disco  : $freeGB GB livres em $drive"

if ($DryRun -and $_missingCmds.Count -gt 0) {
    Write-Host ""
    Write-Host "  [DRY RUN] Pré-requisitos em falta nesta máquina: $($_missingCmds -join ', ')" -ForegroundColor Yellow
    Write-Host "  [DRY RUN] Instalar no servidor alvo antes do deploy real." -ForegroundColor Yellow
    Write-Host ""
}

if ($DumpPath -and -not (Test-Path $DumpPath)) {
    Abort "DumpPath '$DumpPath' não existe."
}

if (-not $DumpPath) {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  ATENÇÃO: DUMP DE BASE DE DADOS NÃO FORNECIDO           ║" -ForegroundColor Red
    Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Red
    Write-Host "  ║  Sem o dump, as seguintes tabelas ficam VAZIAS e o      ║" -ForegroundColor Red
    Write-Host "  ║  sistema NÃO é utilizável após a instalação:            ║" -ForegroundColor Red
    Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Yellow
    Write-Host "  ║  Tabela               │ Impacto                         ║" -ForegroundColor Yellow
    Write-Host "  ║  ─────────────────────┼─────────────────────────────── ║" -ForegroundColor Yellow
    Write-Host "  ║  geografia            │ Dropdowns ilha/concelho vazios  ║" -ForegroundColor Yellow
    Write-Host "  ║  dominio              │ Tipos de equipamento indispon.  ║" -ForegroundColor Yellow
    Write-Host "  ║  auth_group           │ Nenhum utilizador faz login     ║" -ForegroundColor Yellow
    Write-Host "  ║  auth_group_perms     │ Frontend bloqueia todos os users║" -ForegroundColor Yellow
    Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Yellow
    Write-Host "  ║  Solução: adicionar  -DumpPath 'C:\dumps\carta_social_  ║" -ForegroundColor Cyan
    Write-Host "  ║           data_db.sql'  ao comando e voltar a correr.   ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "  Continuar sem dump? O sistema ficará inutilizável. (s/N)"
    if ($confirm -ne 's' -and $confirm -ne 'S') {
        Log "Instalação cancelada pelo utilizador — fornecer -DumpPath para sistema funcional."
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
        exit 0
    }
    Log "⚠️  Utilizador confirmou continuar sem dump — sistema ficará inutilizável até importar dados."
}

# ── FASE 1: Criar estrutura de pastas ─────────────────────────────────────────
Log "==> 1/9  A criar estrutura de pastas..."
if ($DryRun) {
    DryStep "New-Item $($cfg.AppRoot)\backend"
    DryStep "New-Item $($cfg.AppRoot)\frontend"
    DryStep "New-Item $($cfg.BackupDir)"
} else {
    New-Item -ItemType Directory -Path "$($cfg.AppRoot)\backend"  -Force | Out-Null
    New-Item -ItemType Directory -Path "$($cfg.AppRoot)\frontend" -Force | Out-Null
    New-Item -ItemType Directory -Path $cfg.BackupDir             -Force | Out-Null
}

# ── FASE 2: Clonar repositório ────────────────────────────────────────────────
Log "==> 2/9  A clonar repositório..."
if ($DryRun) {
    DryStep "git clone $RepoUrl '$($cfg.AppRoot)\backend'"
    DryStep "Copy-Item backend\mfids_cs_app → $($cfg.FrontDir)"
} else {
    if (Test-Path "$($cfg.AppRoot)\backend\.git") {
        Log "    Repositório já existe — a fazer pull..."
        Set-Location "$($cfg.AppRoot)\backend"
        git pull origin main
        if ($LASTEXITCODE -ne 0) { Abort "git pull falhou" }
    } else {
        Log "    A clonar $RepoUrl ..."
        git clone $RepoUrl "$($cfg.AppRoot)\backend"
        if ($LASTEXITCODE -ne 0) { Abort "git clone falhou" }
    }
    if (-not (Test-Path $cfg.FrontDir)) {
        Copy-Item "$($cfg.AppRoot)\backend\mfids_cs_app" $cfg.FrontDir -Recurse
        Log "    Frontend copiado para $($cfg.FrontDir)"
    }
}

# ── FASE 3: Configurar base de dados PostgreSQL ───────────────────────────────
Log "==> 3/9  A configurar base de dados PostgreSQL..."
Log "    DB: $($cfg.DbName)  |  Utilizador: $($cfg.DbUser)"

if ($DryRun) {
    DryStep "psql -U postgres → CREATE USER $($cfg.DbUser) (password: ***)"
    DryStep "psql -U postgres → CREATE DATABASE $($cfg.DbName) OWNER $($cfg.DbUser)"
} else {
    $env:PGPASSWORD = $PostgresPassword

    $createUser = "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$($cfg.DbUser)') THEN CREATE USER $($cfg.DbUser) WITH PASSWORD '$DbPassword'; ELSE ALTER USER $($cfg.DbUser) WITH PASSWORD '$DbPassword'; END IF; END `$`$;"

    # Usar ficheiros SQL temporários para evitar problemas de quoting do PowerShell
    # com identificadores PostgreSQL que contêm maiúsculas.
    $tmpSql = "$env:TEMP\cs_pg_setup.sql"

    $ErrorActionPreference = "Continue"
    Set-Content $tmpSql $createUser -Encoding UTF8
    psql -U postgres -f $tmpSql
    Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue

    $existingDbName = "$( psql -U postgres -tAc "SELECT datname FROM pg_database WHERE lower(datname)=lower('$($cfg.DbName)')" 2>$null )".Trim()
    if ($existingDbName) {
        Log "    Base de dados '$existingDbName' já existe — a remover para instalação limpa..."
        Set-Content $tmpSql "DROP DATABASE IF EXISTS `"$existingDbName`";" -Encoding UTF8
        psql -U postgres -f $tmpSql
        Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
        if ($LASTEXITCODE -ne 0) { Abort "DROP DATABASE falhou (pode ter conexões activas — fechar psql/pgAdmin e tentar novamente)" }
    }
    Set-Content $tmpSql "CREATE DATABASE `"$($cfg.DbName)`" OWNER $($cfg.DbUser);" -Encoding UTF8
    psql -U postgres -f $tmpSql
    Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) { Abort "CREATE DATABASE falhou" }
    Log "    Base de dados '$($cfg.DbName)' criada."
    $ErrorActionPreference = "Stop"
}

# ── FASE 4: Configurar variáveis de ambiente ──────────────────────────────────
# Segredos (SECRET_KEY, DB_PASS, EMAIL_HOST_PASSWORD, etc.) são guardados como
# variáveis de ambiente do Windows (Machine level) — sem ficheiro com passwords.
# Valores não-sensíveis (DB_ENGINE, DB_HOST, etc.) ficam num .env mínimo.
Log "==> 4/9  A configurar variáveis de ambiente..."
$envFile = "$($cfg.BackendDir)\.env"

if ($DryRun) {
    Log "    Segredos seriam guardados como variáveis de ambiente do Windows (Machine level)."
    DryStep "Gerar SECRET_KEY (python secrets module)"
    DryStep "Perguntar: EMAIL_HOST_PASSWORD, DOMÍNIO, CELERY_BROKER_URL, DSN_KEY"
    DryStep "Perguntar: superutilizador username, email, password"
    DryStep "[System.Environment]::SetEnvironmentVariable('SECRET_KEY', '...', 'Machine')"
    DryStep "[System.Environment]::SetEnvironmentVariable('DB_PASS', '***', 'Machine')"
    DryStep "Criar .env mínimo (apenas config não-sensível) em $envFile"
    Write-Host "      DEBUG=False"                   -ForegroundColor Gray
    Write-Host "      DB_ENGINE=postgresql"          -ForegroundColor Gray
    Write-Host "      DB_HOST=localhost"             -ForegroundColor Gray
    Write-Host "      DB_PORT=5432"                  -ForegroundColor Gray
    Write-Host "      DB_NAME=$($cfg.DbName)"        -ForegroundColor Gray
    Write-Host "      DB_USERNAME=$($cfg.DbUser)"    -ForegroundColor Gray
    $emailPass  = ""
    $prodDomain = ""
    $suUsername = ""
    $suEmail    = ""
    $suPassword = ""
} else {
    Write-Host ""
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   Configuração de Secrets" -ForegroundColor Cyan
    Write-Host "   Os valores sensíveis são guardados como variáveis de" -ForegroundColor Cyan
    Write-Host "   ambiente do Windows — NÃO em ficheiro .env." -ForegroundColor Cyan
    Write-Host "   Prima ENTER para deixar vazio (pode preencher depois)." -ForegroundColor Gray
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  [1/4] EMAIL_HOST_PASSWORD" -ForegroundColor Yellow
    Write-Host "        App Password do Gmail (conta mfids.dgis@gmail.com)." -ForegroundColor Gray
    Write-Host "        Gerar em: Conta Google → Segurança → Palavras-passe de aplicações" -ForegroundColor Gray
    $emailPass = Read-Host "        Valor"

    Write-Host ""
    Write-Host "  [2/4] DOMÍNIO DE PRODUÇÃO" -ForegroundColor Yellow
    Write-Host "        Ex: cartasocial.dgis.gov.cv  ou  84.247.171.243" -ForegroundColor Gray
    Write-Host "        (Usado para gerar nota sobre ALLOWED_HOSTS e CORS)" -ForegroundColor Gray
    $prodDomain = Read-Host "        Valor"

    Write-Host ""
    Write-Host "  [3/4] CELERY_BROKER_URL  (deixar vazio se não usar Celery)" -ForegroundColor Yellow
    Write-Host "        Ex: redis://localhost:6379" -ForegroundColor Gray
    $celeryBroker = Read-Host "        Valor"

    Write-Host ""
    Write-Host "  [4/4] DSN_KEY do Sentry  (deixar vazio se não usar Sentry)" -ForegroundColor Yellow
    Write-Host "        Ex: https://abc123@o123456.ingest.sentry.io/789" -ForegroundColor Gray
    $sentryDsn = Read-Host "        Valor"

    Write-Host ""
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   Superutilizador Django (administrador do sistema)" -ForegroundColor Cyan
    Write-Host "   Criado automaticamente e adicionado ao grupo DGIS." -ForegroundColor Cyan
    Write-Host "   Prima ENTER para deixar vazio e criar manualmente depois." -ForegroundColor Gray
    Write-Host "  ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  [SU-1] Username do superutilizador" -ForegroundColor Yellow
    $suUsername = Read-Host "         Valor"

    Write-Host ""
    Write-Host "  [SU-2] Email do superutilizador" -ForegroundColor Yellow
    $suEmail = Read-Host "         Valor"

    Write-Host ""
    Write-Host "  [SU-3] Password do superutilizador  (mínimo 8 caracteres)" -ForegroundColor Yellow
    $suPassword = Read-Host "         Valor"

    Write-Host ""

    # Gerar ou reutilizar SECRET_KEY existente
    $existingKey = [System.Environment]::GetEnvironmentVariable("SECRET_KEY", "Machine")
    if ($existingKey) {
        $secretKey = $existingKey
        Log "    SECRET_KEY já existe como variável do Windows — mantido."
    } else {
        $secretKey = python -c "import secrets, string; chars = string.ascii_letters + string.digits + '!@#%^&*(-_=+)'; print(''.join(secrets.choice(chars) for _ in range(50)))"
        Log "    SECRET_KEY gerado."
    }

    # Guardar segredos como variáveis do Windows — Machine level (persistentes, todos os processos)
    [System.Environment]::SetEnvironmentVariable("SECRET_KEY", $secretKey,  "Machine")
    [System.Environment]::SetEnvironmentVariable("DB_PASS",    $DbPassword, "Machine")
    if ($emailPass)    { [System.Environment]::SetEnvironmentVariable("EMAIL_HOST_PASSWORD", $emailPass,    "Machine") }
    if ($celeryBroker) { [System.Environment]::SetEnvironmentVariable("CELERY_BROKER",       $celeryBroker, "Machine") }
    if ($sentryDsn)    { [System.Environment]::SetEnvironmentVariable("DSN_KEY",              $sentryDsn,    "Machine") }

    # Propagar para o processo actual (SetEnvironmentVariable "Machine" não afecta o processo em curso)
    $env:SECRET_KEY = $secretKey
    $env:DB_PASS    = $DbPassword
    if ($emailPass)    { $env:EMAIL_HOST_PASSWORD = $emailPass }
    if ($celeryBroker) { $env:CELERY_BROKER       = $celeryBroker }
    if ($sentryDsn)    { $env:DSN_KEY             = $sentryDsn }

    Log "    ✅ Segredos guardados como variáveis do Windows (Machine level):"
    Log "       SECRET_KEY, DB_PASS$(if ($emailPass) {', EMAIL_HOST_PASSWORD'})$(if ($celeryBroker) {', CELERY_BROKER'})$(if ($sentryDsn) {', DSN_KEY'})"

    # Criar .env mínimo — apenas config não-sensível
    # load_dotenv() não substitui variáveis do Windows já definidas (override=False por omissão)
    $envContent = @"
DEBUG=False
DB_ENGINE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$($cfg.DbName)
DB_USERNAME=$($cfg.DbUser)
"@
    Set-Content $envFile $envContent -Encoding UTF8
    Log "    .env criado com config não-sensível (sem passwords nem chaves secretas)."

    if ($prodDomain) {
        Log "    ⚠️  Domínio '$prodDomain' fornecido — adicionar manualmente a:"
        Log "       BackEnd\mfids\core\settings.py → ALLOWED_HOSTS e CORS_ALLOWED_ORIGINS"
        Log "       (não são lidos do .env; estão hardcoded no ficheiro)"
    }
    if (-not $emailPass) {
        Log "    ⚠️  EMAIL_HOST_PASSWORD vazio — reset de password não vai funcionar."
        Log "       Definir depois: [System.Environment]::SetEnvironmentVariable('EMAIL_HOST_PASSWORD','<valor>','Machine')"
    }
}

# Verificar placeholders nao substituidos no .env (aplica a .env novo e existente)
if (-not $DryRun -and (Test-Path $envFile)) {
    $envRaw = Get-Content $envFile -Raw
    if ($envRaw -match 'SUA_SENHA|CHANGE_ME|YOUR_SECRET|PLACEHOLDER|INSERT_HERE|<PREENCHER>|STRONG_PASSWORD') {
        Abort "O ficheiro .env contém placeholders nao substituidos. Editar $envFile antes de continuar."
    }
}

# ── FASE 5: Instalar dependências Python e migrar ─────────────────────────────
Log "==> 5/9  A instalar dependências Python..."
if ($DryRun) {
    DryStep "python -m venv $($cfg.BackendDir)\venv_prod"
    DryStep "pip install -r $($cfg.BackendDir)\requirements.txt"
    DryStep "python manage.py migrate"
    if ($DumpPath) {
        Log "    O dump inclui dados criticos que o codigo NAO consegue criar:"
        Log "      • geografia, dominio, auth_group, auth_group_permissions"
        DryStep "psql -U postgres -d $($cfg.DbName) -f $DumpPath"
    }
    DryStep "python manage.py collectstatic --no-input"
    DryStep "python manage.py create_db_views"
    DryStep "python manage.py createsuperuser --no-input  (se credenciais fornecidas)"
    DryStep "python manage.py shell → user.groups.add(DGIS)"
} else {
    Set-Location $cfg.BackendDir
    if (-not (Test-Path $cfg.Python)) {
        $ErrorActionPreference = "Continue"
        python -m venv venv_prod
        $ErrorActionPreference = "Stop"
    } else {
        Log "    venv_prod ja existe."
    }
    & $cfg.Pip install --upgrade pip | Out-Null
    & $cfg.Pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { Abort "pip install falhou" }

    Log "    A aplicar migracoes Django..."
    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py migrate 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    $migrateExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($migrateExit -ne 0) { Abort "manage.py migrate falhou" }

    # Criar tabelas legadas (managed=False) que nao sao criadas pelo migrate
    # mas que o dump de producao precisa de encontrar para popular.
    $legacySql = "$($cfg.AppRoot)\backend\scripts\legacy_schema.sql"
    if (Test-Path $legacySql) {
        Log "    A criar tabelas legadas (managed=False)..."
        $env:PGPASSWORD = $PostgresPassword
        $ErrorActionPreference = "Continue"
        psql -U postgres -d $cfg.DbName -f $legacySql
        $ErrorActionPreference = "Stop"
        Log "    Tabelas legadas criadas (IF NOT EXISTS)."
        $env:PGPASSWORD = ""
    } else {
        Log "    AVISO: scripts\legacy_schema.sql nao encontrado — tabelas legadas podem estar em falta."
    }

    if ($DumpPath) {
        # Limpar tabelas que migrate() ja populou mas que o dump vai repopular.
        # Sem isto, COPY falha em duplicados (auth_permission, django_content_type, etc.)
        $preDumpSql = "$($cfg.AppRoot)\backend\scripts\pre_dump_cleanup.sql"
        if (Test-Path $preDumpSql) {
            Log "    A limpar tabelas Django antes do dump (evitar duplicados em COPY)..."
            $env:PGPASSWORD = $PostgresPassword
            $ErrorActionPreference = "Continue"
            psql -U postgres -d $cfg.DbName -f $preDumpSql
            $ErrorActionPreference = "Stop"
            Log "    Tabelas limpas — pronto para restaurar dump."
            $env:PGPASSWORD = ""
        } else {
            Log "    AVISO: scripts\pre_dump_cleanup.sql nao encontrado — podem ocorrer conflitos no dump."
        }

        Log "    A restaurar dump de producao (pode demorar alguns minutos)..."
        Log "    O dump inclui dados criticos que o codigo NAO consegue criar:"
        Log "      • geografia          — ilhas, concelhos, freguesias, zonas, lugares"
        Log "      • dominio            — tipos de equipamento, servico, regime propriedade"
        Log "      • auth_group         — grupos DGIS, Agentes, Proprietario, Gestor, MFIDS"
        Log "      • auth_group_perms   — permissoes por grupo (can_access_frontend, etc.)"

        # Se o dump for um ZIP, extrair primeiro
        $SqlDumpPath = $DumpPath
        if ($DumpPath.ToLower().EndsWith('.zip')) {
            Log "    A extrair dump ZIP..."
            $ExtractDir = "$env:TEMP\cs_dump_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Expand-Archive -Path $DumpPath -DestinationPath $ExtractDir -Force
            $sqlFiles = Get-ChildItem -Path $ExtractDir -Filter "*.sql" -Recurse
            if ($sqlFiles.Count -eq 0) { Abort "Nenhum ficheiro .sql encontrado no ZIP '$DumpPath'" }
            $SqlDumpPath = $sqlFiles[0].FullName
            Log "    SQL extraido: $SqlDumpPath"
        }

        $env:PGPASSWORD = $PostgresPassword
        $ErrorActionPreference = "Continue"
        psql -U postgres -d $cfg.DbName -f $SqlDumpPath
        $ErrorActionPreference = "Stop"
        if ($LASTEXITCODE -ne 0) { Abort "Restauro do dump falhou" }
        Log "    Dump restaurado — geografia, dominios, grupos e permissoes disponiveis."

        # Dump restaurado como postgres — mfids_user precisa de permissoes nas tabelas legacy.
        Log "    A conceder permissoes a $($cfg.DbUser) em todas as tabelas..."
        $ErrorActionPreference = "Continue"
        psql -U postgres -d $cfg.DbName -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $($cfg.DbUser); GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $($cfg.DbUser);"
        $ErrorActionPreference = "Stop"
        Log "    Permissoes concedidas."

        $env:PGPASSWORD = ""

        # Aplicar migracoes pendentes apos dump.
        # --fake-initial: marca initial migrations como aplicadas se a tabela ja existe.
        # Fallback --fake: se uma migration posterior tenta adicionar uma coluna que o dump
        # ja tem (ex: users.0015 adiciona 'municipio' que a BD de producao ja tinha),
        # usa --fake para marcar todas as restantes como aplicadas sem as correr.
        Log "    A aplicar migracoes pendentes apos dump (--fake-initial)..."
        & $cfg.Python manage.py migrate --fake-initial
        if ($LASTEXITCODE -ne 0) {
            Log "    --fake-initial teve conflitos de schema (colunas ja existem no dump) — a usar --fake para marcar restantes como aplicadas..."
            & $cfg.Python manage.py migrate --fake
            if ($LASTEXITCODE -ne 0) { Log "    AVISO: manage.py migrate --fake tambem teve erros — verificar acima." }
        }
    }

    # Garantir content types e permissões Django populados.
    # migrate --fake não emite post_migrate ao ter erros — estas chamadas são idempotentes.
    Log "    A garantir content types e permissoes Django (pre-requisito do loaddata)..."
    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py shell -c "from django.contrib.contenttypes.management import create_contenttypes; from django.apps import apps; [create_contenttypes(a, verbosity=0) for a in apps.get_app_configs()]" 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    & $cfg.Python manage.py shell -c "from django.contrib.auth.management import create_permissions; from django.apps import apps; [create_permissions(a, verbosity=0) for a in apps.get_app_configs()]" 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    $ErrorActionPreference = "Stop"

    # Aplicar fixture de grupos se auth_group estiver vazio.
    # O fixture contém apenas auth.Group (as permissões já foram criadas acima).
    # O dump de produção inclui os grupos; o fixture é fallback para deploys de teste.
    $fixtureFile = "$($cfg.BackendDir)\fixtures\groups_permissions.json"
    if (Test-Path $fixtureFile) {
        $ErrorActionPreference = "Continue"
        $groupCount = (& $cfg.Python manage.py shell -c "from django.contrib.auth.models import Group; print(Group.objects.count())" 2>$null).Trim()
        $ErrorActionPreference = "Stop"
        if ($groupCount -eq "0") {
            Log "    auth_group vazio — a aplicar fixture de grupos e permissoes..."
            # Limpar permissoes existentes (criadas por create_permissions com PKs da sequencia)
            # para evitar conflito de unique constraint (content_type_id, codename) no loaddata.
            $ErrorActionPreference = "Continue"
            & $cfg.Python manage.py shell -c "from django.contrib.auth.models import Permission; Permission.objects.all().delete()" 2>&1 | Out-Null
            $ErrorActionPreference = "Stop"
            $ErrorActionPreference = "Continue"
            & $cfg.Python manage.py loaddata fixtures/groups_permissions.json 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
            $fixtureExit = $LASTEXITCODE
            $ErrorActionPreference = "Stop"
            if ($fixtureExit -ne 0) { Log "    AVISO: loaddata falhou — verificar acima." } else { Log "    Grupos e permissoes aplicados via fixture." }
        } else {
            Log "    auth_group ja tem $groupCount grupos — fixture ignorado."
        }
    } else {
        Log "    AVISO: fixtures\groups_permissions.json nao encontrado — grupos NAO aplicados."
    }

    # Criar/actualizar as 16 views PostgreSQL via management command (idempotente).
    Log "    A criar/actualizar views PostgreSQL (16 views)..."
    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py create_db_views 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    $viewsExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($viewsExit -ne 0) { Log "    AVISO: create_db_views teve erros — verificar acima." } else { Log "    16 views criadas/actualizadas." }

    # Criar superutilizador e adicionar ao grupo DGIS (se credenciais fornecidas na Fase 4)
    if ($suUsername -and $suEmail -and $suPassword) {
        $ErrorActionPreference = "Continue"
        $existingUser = (& $cfg.Python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.filter(username='$suUsername').exists())" 2>$null).Trim()
        $ErrorActionPreference = "Stop"
        if ($existingUser -eq "True") {
            Log "    Superutilizador '$suUsername' ja existe — ignorado."
        } else {
            Log "    A criar superutilizador '$suUsername'..."
            $env:DJANGO_SUPERUSER_USERNAME = $suUsername
            $env:DJANGO_SUPERUSER_EMAIL    = $suEmail
            $env:DJANGO_SUPERUSER_PASSWORD = $suPassword
            $ErrorActionPreference = "Continue"
            & $cfg.Python manage.py createsuperuser --no-input 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
            $suExit = $LASTEXITCODE
            $ErrorActionPreference = "Stop"
            $env:DJANGO_SUPERUSER_USERNAME = ""
            $env:DJANGO_SUPERUSER_EMAIL    = ""
            $env:DJANGO_SUPERUSER_PASSWORD = ""
            if ($suExit -ne 0) {
                Log "    AVISO: createsuperuser falhou — criar manualmente (passo 2 abaixo)."
            } else {
                Log "    Superutilizador '$suUsername' criado."
                $ErrorActionPreference = "Continue"
                $dgisResult = (& $cfg.Python manage.py shell -c "from django.contrib.auth.models import User,Group; u=User.objects.filter(username='$suUsername').first(); g=Group.objects.filter(name='DGIS').first(); r=u.groups.add(g) if (u and g) else None; print('OK' if (u and g) else 'AVISO')" 2>$null).Trim()
                $ErrorActionPreference = "Stop"
                if ($dgisResult -eq "OK") { Log "    Superutilizador adicionado ao grupo DGIS." }
                else { Log "    AVISO: nao foi possivel adicionar ao grupo DGIS — fazer manualmente." }
            }
        }
    } else {
        Log "    Credenciais de superutilizador nao fornecidas — criar manualmente (ver passos abaixo)."
    }

    Log "    A verificar configuracao de producao (manage.py check --deploy)..."
    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py check --deploy 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    $checkExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($checkExit -ne 0) { Abort "manage.py check --deploy encontrou erros — corrigir antes de continuar (DEBUG=True, ALLOWED_HOSTS, etc.)." }

    Log "    A recolher ficheiros estaticos..."
    $ErrorActionPreference = "Continue"
    & $cfg.Python manage.py collectstatic --no-input 2>&1 | ForEach-Object { "$_" } | Tee-Object -Append -FilePath $LogFile
    $staticExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($staticExit -ne 0) { Abort "collectstatic falhou" }
}

# ── FASE 6: Verificar dados críticos ──────────────────────────────────────────
Log "==> 6/9  A verificar dados críticos na base de dados..."

$dadosCriticosEmFalta = $false   # usado no resumo final

if ($DryRun) {
    Log "    [DRY RUN] Verificação ignorada — BD não foi criada neste modo."
    Log "    Após instalação real, a Fase 6 verifica: geografia, dominio, auth_group, auth_group_permissions."
} else {

$pyCheck = @"
import django, os, sys
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
django.setup()
from apps.organizacoes.models import Geografia
from apps.equipamentos.models import Dominio
from django.contrib.auth.models import Group, Permission
from django.db.models import Count

geo   = Geografia.objects.count()
dom   = Dominio.objects.count()
grp   = Group.objects.count()
perms = Group.objects.annotate(n=Count('permissions')).filter(n__gt=0).count()
print(f'{geo},{dom},{grp},{perms}')
"@

$checkFile = "$env:TEMP\cs_phase6_check.py"
$pyCheck | Set-Content $checkFile -Encoding UTF8
$ErrorActionPreference = "Continue"
$result = & $cfg.Python $checkFile 2>$null
$ErrorActionPreference = "Stop"
Remove-Item $checkFile -Force -ErrorAction SilentlyContinue
if ($result -match '^\d+,\d+,\d+,\d+$') {
    $parts       = $result -split ','
    $geoCount    = [int]$parts[0]
    $domCount    = [int]$parts[1]
    $groupCount  = [int]$parts[2]
    $permsCount  = [int]$parts[3]
} else {
    $geoCount = $domCount = $groupCount = $permsCount = 0
    Log "    ⚠️  Não foi possível consultar as tabelas — verificar erros acima."
}

# Mostrar tabela de diagnóstico
Write-Host ""
Write-Host "  ┌──────────────────────────┬────────────┬─────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "  │ Tabela                   │ Registos   │ Estado                              │" -ForegroundColor Cyan
Write-Host "  ├──────────────────────────┼────────────┼─────────────────────────────────────┤" -ForegroundColor Cyan

$geoStatus   = if ($geoCount   -gt 0)  { "✅ OK ($geoCount registos)" }   else { "❌ VAZIO — dropdowns ilha/concelho" }
$domStatus   = if ($domCount   -gt 0)  { "✅ OK ($domCount registos)" }   else { "❌ VAZIO — tipos de equipamento/serviço" }
$grpStatus   = if ($groupCount -ge 5)  { "✅ OK ($groupCount grupos)" }   else { "❌ INCOMPLETO — login impossível" }
$permsStatus = if ($permsCount -ge 3)  { "✅ OK ($permsCount grupos c/ perms)" } else { "❌ SEM PERMISSÕES — frontend bloqueado" }

$geoColor  = if ($geoCount   -gt 0) { "Green" } else { "Red" }
$domColor  = if ($domCount   -gt 0) { "Green" } else { "Red" }
$grpColor  = if ($groupCount -ge 5) { "Green" } else { "Red" }
$permsColor= if ($permsCount -ge 3) { "Green" } else { "Red" }

Write-Host ("  │ {0,-24}  │ {1,-10} │ {2,-35} │" -f "geografia", $geoCount, "") -NoNewline
Write-Host $geoStatus -ForegroundColor $geoColor
Write-Host ("  │ {0,-24}  │ {1,-10} │ {2,-35} │" -f "dominio", $domCount, "") -NoNewline
Write-Host $domStatus -ForegroundColor $domColor
Write-Host ("  │ {0,-24}  │ {1,-10} │ {2,-35} │" -f "auth_group", $groupCount, "") -NoNewline
Write-Host $grpStatus -ForegroundColor $grpColor
Write-Host ("  │ {0,-24}  │ {1,-10} │ {2,-35} │" -f "auth_group_permissions", $permsCount, "") -NoNewline
Write-Host $permsStatus -ForegroundColor $permsColor
Write-Host "  └──────────────────────────┴────────────┴─────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""

Log "    geografia=$geoCount | dominio=$domCount | groups=$groupCount | groups_with_perms=$permsCount"

$dadosCriticosEmFalta = ($geoCount -eq 0) -or ($domCount -eq 0) -or ($groupCount -lt 5) -or ($permsCount -lt 3)

if ($dadosCriticosEmFalta) {
    Write-Host "  ⚠️  DADOS CRÍTICOS EM FALTA — o sistema NÃO é utilizável no estado actual." -ForegroundColor Red
    Write-Host "     Para restaurar, executar após a instalação:" -ForegroundColor Yellow
    Write-Host "       psql -U $($cfg.DbUser) -d $($cfg.DbName) -f <dump>.sql" -ForegroundColor Yellow
    Write-Host "       $($cfg.Python) manage.py migrate" -ForegroundColor Yellow
    Write-Host ""
    Log "⚠️  DADOS CRÍTICOS EM FALTA — sistema inutilizável sem importar o dump."
}

} # end if (-not $DryRun) para Fase 6

# ── FASE 7: Build do frontend Next.js ─────────────────────────────────────────
Log "==> 7/9  A construir frontend Next.js..."
if ($DryRun) {
    Log "    .env.local seria criado em: $($cfg.FrontDir)\.env.local"
    Log "    Conteúdo: API_URL=$($cfg.ApiUrl)"
    DryStep "npm ci --legacy-peer-deps  (pasta: $($cfg.FrontDir))"
    DryStep "npm run build"
    DryStep "Copy public + .next\static → .next\standalone"
    DryStep "Copy .env.local → .next\standalone\"
    DryStep "Gerar .next\standalone\web.config (httpPlatformHandler + node server.js)"
    DryStep "Criar logs\ em standalone e BackendDir"
} else {
    Set-Location $cfg.FrontDir

    $envLocal = "$($cfg.FrontDir)\.env.local"
    if (-not (Test-Path $envLocal)) {
        Set-Content $envLocal "API_URL=$($cfg.ApiUrl)" -Encoding UTF8
        Log "    .env.local criado com API_URL=$($cfg.ApiUrl)"
    }

    # $ErrorActionPreference = "Continue" necessario: npm/Next.js escrevem para stderr
    # (avisos, progress) e com "Stop" o pipeline 2>&1 terminaria prematuramente.
    $ErrorActionPreference = "Continue"
    npm ci --legacy-peer-deps 2>&1 | ForEach-Object { Log "    npm: $_" }
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) { Abort "npm ci falhou" }

    $ErrorActionPreference = "Continue"
    npm run build 2>&1 | ForEach-Object { Log "    build: $_" }
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) { Abort "npm run build falhou" }

    Copy-Item "$($cfg.FrontDir)\public"       "$($cfg.FrontDir)\.next\standalone\public"       -Recurse -Force
    Copy-Item "$($cfg.FrontDir)\.next\static" "$($cfg.FrontDir)\.next\standalone\.next\static" -Recurse -Force

    # Copiar .env.local para standalone (Next.js server.js lê env vars do seu cwd)
    $envLocalSrc = "$($cfg.FrontDir)\.env.local"
    $envLocalDst = "$($cfg.FrontDir)\.next\standalone\.env.local"
    if (Test-Path $envLocalSrc) {
        Copy-Item $envLocalSrc $envLocalDst -Force
        Log "    .env.local copiado para .next\standalone\."
    } else {
        Log "    ⚠️  .env.local não encontrado em $envLocalSrc — standalone pode não ter API_URL."
    }

    # Criar pastas logs (httpPlatformHandler escreve aqui)
    foreach ($logsDir in @("$($cfg.FrontDir)\.next\standalone\logs", "$($cfg.BackendDir)\logs")) {
        if (-not (Test-Path $logsDir)) { New-Item $logsDir -ItemType Directory | Out-Null }
    }
    Log "    Pastas logs criadas (standalone e backend)."

    # Gerar web.config do frontend para IIS httpPlatformHandler (node server.js)
    $frontWebConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*"
           modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="node.exe"
                  arguments="server.js"
                  startupTimeLimit="60"
                  requestTimeout="00:04:00"
                  stdoutLogEnabled="true"
                  stdoutLogFile="logs\nextjs.log">
      <environmentVariables>
        <environmentVariable name="PORT"     value="%HTTP_PLATFORM_PORT%" />
        <environmentVariable name="HOSTNAME" value="127.0.0.1" />
        <environmentVariable name="NODE_ENV" value="production" />
        <environmentVariable name="API_URL"  value="$($cfg.ApiUrl)" />
      </environmentVariables>
    </httpPlatform>
  </system.webServer>
</configuration>
"@
    Set-Content "$($cfg.FrontDir)\.next\standalone\web.config" $frontWebConfig -Encoding UTF8
    Log "    web.config frontend gerado em .next\standalone\ (httpPlatformHandler + node)."

    if (-not (Test-Path "$($cfg.FrontDir)\.next\standalone\server.js")) {
        Abort "Build incompleto: .next\standalone\server.js nao foi gerado. Verificar erros do npm build acima."
    }

    # Garantir permissão de escrita em .next/cache para o processo IIS (ISR/SSG)
    $cacheDir = "$($cfg.FrontDir)\.next\cache"
    if (Test-Path $cacheDir) {
        icacls $cacheDir /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null
        Log "    .next\cache — permissoes de escrita concedidas a IIS_IUSRS."
    }

    Log "    ✅ Build completo e assets copiados para standalone."
}

# ── FASE 7b: Health check do frontend (smoke test na porta 4000) ─────────────
Log "==> 7b/9  Health check do frontend Next.js..."
if ($DryRun) {
    DryStep "Start-Process node server.js (porta $($cfg.IIS_App_Port))"
    DryStep "Invoke-WebRequest http://127.0.0.1:$($cfg.IIS_App_Port)/ (8 tentativas × 3s)"
    Log "    [DRY RUN] Health check ignorado — servidor não foi iniciado."
} else {
    $frontProc  = $null
    $frontOK    = $false
    $frontUrl   = "http://127.0.0.1:$($cfg.IIS_App_Port)/"
    $serverJs   = "$($cfg.FrontDir)\.next\standalone\server.js"
    $nodeCmd    = Get-Command node -ErrorAction SilentlyContinue
    $nodeExe    = if ($nodeCmd) { $nodeCmd.Source } else { $null }

    if ($nodeExe -and (Test-Path $serverJs)) {
        $frontEnv = [System.Collections.Generic.Dictionary[string,string]]::new()
        $frontEnv["PORT"]     = "$($cfg.IIS_App_Port)"
        $frontEnv["API_URL"]  = $cfg.ApiUrl
        $frontEnv["NODE_ENV"] = "production"

        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName  = $nodeExe
        $psi.Arguments = "`"$serverJs`""
        $psi.WorkingDirectory = "$($cfg.FrontDir)\.next\standalone"
        $psi.UseShellExecute  = $false
        $psi.CreateNoWindow   = $true
        foreach ($kv in $frontEnv.GetEnumerator()) {
            $psi.Environment[$kv.Key] = $kv.Value
        }
        $frontProc = [System.Diagnostics.Process]::Start($psi)
        Log "    Servidor frontend a iniciar (PID $($frontProc.Id), porta $($cfg.IIS_App_Port))..."

        $maxTries = 8; $interval = 3
        for ($i = 1; $i -le $maxTries; $i++) {
            Start-Sleep -Seconds $interval
            try {
                $r = Invoke-WebRequest -Uri $frontUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                if ($r.StatusCode -in 200, 301, 302) {
                    Log "✅ Frontend responde: HTTP $($r.StatusCode) (tentativa $i)"
                    $frontOK = $true; break
                }
            } catch {
                if ($_.Exception.Response) {
                    $code = [int]$_.Exception.Response.StatusCode
                    if ($code -in 200, 301, 302) { Log "✅ Frontend: HTTP $code"; $frontOK = $true; break }
                }
            }
        }
        if ($frontProc -and -not $frontProc.HasExited) {
            $frontProc | Stop-Process -ErrorAction SilentlyContinue
        }
        if (-not $frontOK) {
            Log "⚠️  Frontend não respondeu após $($maxTries * $interval)s — verificar log acima."
            Log "   A instalação pode ainda funcionar após configurar IIS correctamente."
        }
    } else {
        Log "⚠️  node.exe ou server.js não encontrado — health check do frontend ignorado."
    }
}

# ── FASE 8: Configurar IIS ────────────────────────────────────────────────────
Log "==> 8/9  A configurar IIS..."
if ($DryRun) {
    DryStep "New-WebAppPool '$($cfg.IIS_API)' (No Managed Code) — AppPool dedicado para API"
    DryStep "New-WebAppPool '$($cfg.IIS_App)' (No Managed Code) — AppPool dedicado para frontend"
    DryStep "New-Website '$($cfg.IIS_API)' -Port $($cfg.IIS_API_Port) -ApplicationPool '$($cfg.IIS_API)'"
    DryStep "New-Website '$($cfg.IIS_App)' -Port $($cfg.IIS_App_Port) -ApplicationPool '$($cfg.IIS_App)'"
} else {
    Import-Module WebAdministration -ErrorAction SilentlyContinue

    if (-not (Get-Module WebAdministration)) {
        Log "⚠️  Módulo WebAdministration não disponível — configuração IIS ignorada."
        Log "   Configura manualmente os dois sites e AppPools IIS:"
        Log "     AppPool $($cfg.IIS_API)  → No Managed Code"
        Log "     AppPool $($cfg.IIS_App)  → No Managed Code"
        Log "     Site $($cfg.IIS_API)  → porta $($cfg.IIS_API_Port) → $($cfg.BackendDir)"
        Log "     Site $($cfg.IIS_App)  → porta $($cfg.IIS_App_Port) → $($cfg.FrontDir)\.next\standalone"
    } else {
        # Application Pools dedicados (evita partilha de processo com Default Web Site)
        foreach ($poolName in @($cfg.IIS_API, $cfg.IIS_App)) {
            if (-not (Get-WebAppPoolState -Name $poolName -ErrorAction SilentlyContinue)) {
                New-WebAppPool -Name $poolName | Out-Null
                Set-ItemProperty "IIS:\AppPools\$poolName" -Name "managedRuntimeVersion" -Value ""
                Log "    AppPool '$poolName' criado (No Managed Code)."
            } else {
                Log "    AppPool '$poolName' já existe."
            }
        }

        # Sites IIS associados a cada AppPool dedicado
        if (-not (Get-Website -Name $cfg.IIS_API -ErrorAction SilentlyContinue)) {
            New-Website -Name $cfg.IIS_API -Port $cfg.IIS_API_Port `
                        -PhysicalPath $cfg.BackendDir -ApplicationPool $cfg.IIS_API -Force | Out-Null
            Log "    Site $($cfg.IIS_API) criado na porta $($cfg.IIS_API_Port) (AppPool: $($cfg.IIS_API))."
        } else {
            Log "    Site $($cfg.IIS_API) já existe."
        }

        if (-not (Get-Website -Name $cfg.IIS_App -ErrorAction SilentlyContinue)) {
            New-Website -Name $cfg.IIS_App -Port $cfg.IIS_App_Port `
                        -PhysicalPath "$($cfg.FrontDir)\.next\standalone" `
                        -ApplicationPool $cfg.IIS_App -Force | Out-Null
            Log "    Site $($cfg.IIS_App) criado na porta $($cfg.IIS_App_Port) (AppPool: $($cfg.IIS_App))."
        } else {
            Log "    Site $($cfg.IIS_App) já existe."
        }
    }
}

# ── FASE 9: Smoke test (Django directo, sem IIS) ──────────────────────────────
Log "==> 9/9  Smoke test (servidor de teste directo)..."
if ($DryRun) {
    DryStep "Start-Process python manage.py runserver 127.0.0.1:$($cfg.SmokePort)"
    DryStep "Invoke-WebRequest http://127.0.0.1:$($cfg.SmokePort)/api/login/ (10 tentativas × 3s)"
    Log "    [DRY RUN] Smoke test ignorado — servidor não foi iniciado."
} else {
    Set-Location $cfg.BackendDir

    $smokeUrl = "http://127.0.0.1:$($cfg.SmokePort)/api/login/"
    $djProc   = Start-Process -FilePath $cfg.Python `
                              -ArgumentList "manage.py runserver 127.0.0.1:$($cfg.SmokePort) --noreload" `
                              -PassThru -WindowStyle Hidden
    Log "    Servidor de teste a iniciar (PID $($djProc.Id), porta $($cfg.SmokePort))..."

    $maxTries = 10; $interval = 3
    $smokeOK  = $false
    for ($i = 1; $i -le $maxTries; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $smokeUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($r.StatusCode -in 200, 405) {
                Log "✅ Django responde: HTTP $($r.StatusCode) (tentativa $i)"
                $smokeOK = $true; break
            }
        } catch {
            if ($_.Exception.Response) {
                $code = [int]$_.Exception.Response.StatusCode
                if ($code -in 200, 405) { Log "✅ Django: HTTP $code"; $smokeOK = $true; break }
            }
            if ($i -lt $maxTries) { Start-Sleep -Seconds $interval }
        }
    }
    $djProc | Stop-Process -ErrorAction SilentlyContinue

    if (-not $smokeOK) {
        Log "⚠️  Django não respondeu após $($maxTries * $interval)s — verificar log acima para erros."
        Log "   A instalação pode ainda funcionar após configurar IIS correctamente."
    }
}

# ── FASE 9b: Configurar serviços Celery via NSSM ─────────────────────────────
Log "==> 9b/9  A configurar serviços Celery (NSSM)..."
$nssmExe = Get-Command nssm -ErrorAction SilentlyContinue
if ($DryRun) {
    DryStep "nssm install $($cfg.CeleryWorker) $($cfg.Python) '-m celery -A apps.tasks worker -l info'"
    DryStep "nssm install $($cfg.CeleryBeat)   $($cfg.Python) '-m celery -A apps.tasks beat -l info'"
    DryStep "nssm set $($cfg.CeleryWorker) AppDirectory '$($cfg.BackendDir)'"
    DryStep "nssm set $($cfg.CeleryBeat)   AppDirectory '$($cfg.BackendDir)'"
    DryStep "Start-Service $($cfg.CeleryWorker); Start-Service $($cfg.CeleryBeat)"
} elseif (-not $nssmExe) {
    Log "⚠️  NSSM não encontrado — serviços Celery NÃO configurados."
    Log "   Instalar NSSM: winget install nssm  ou  https://nssm.cc"
    Log "   Após instalar, correr manualmente:"
    Log "     nssm install $($cfg.CeleryWorker) `"$($cfg.Python)`" `"-m celery -A apps.tasks worker -l info`""
    Log "     nssm set $($cfg.CeleryWorker) AppDirectory `"$($cfg.BackendDir)`""
    Log "     nssm set $($cfg.CeleryWorker) AppStdout `"$($cfg.LogDir)\celery-worker.log`""
    Log "     nssm set $($cfg.CeleryWorker) AppStderr `"$($cfg.LogDir)\celery-worker-err.log`""
    Log "     nssm install $($cfg.CeleryBeat) `"$($cfg.Python)`" `"-m celery -A apps.tasks beat -l info`""
    Log "     nssm set $($cfg.CeleryBeat) AppDirectory `"$($cfg.BackendDir)`""
    Log "     nssm set $($cfg.CeleryBeat) AppStdout `"$($cfg.LogDir)\celery-beat.log`""
    Log "     nssm set $($cfg.CeleryBeat) AppStderr `"$($cfg.LogDir)\celery-beat-err.log`""
    Log "     Start-Service $($cfg.CeleryWorker); Start-Service $($cfg.CeleryBeat)"
} else {
    $ErrorActionPreference = "Continue"
    foreach ($svc in @(
        @{ Name = $cfg.CeleryWorker; Args = "-m celery -A apps.tasks worker -l info"; Log = "celery-worker" },
        @{ Name = $cfg.CeleryBeat;   Args = "-m celery -A apps.tasks beat -l info";   Log = "celery-beat"   }
    )) {
        $existing = Get-Service -Name $svc.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Log "    Serviço $($svc.Name) já existe — a reiniciar..."
            nssm restart $svc.Name
        } else {
            nssm install $svc.Name $cfg.Python $svc.Args
            nssm set $svc.Name AppDirectory $cfg.BackendDir
            nssm set $svc.Name AppStdout    "$($cfg.LogDir)\$($svc.Log).log"
            nssm set $svc.Name AppStderr    "$($cfg.LogDir)\$($svc.Log)-err.log"
            nssm set $svc.Name Start        SERVICE_AUTO_START
            Start-Service -Name $svc.Name -ErrorAction SilentlyContinue
            $status = (Get-Service -Name $svc.Name -ErrorAction SilentlyContinue).Status
            Log "    Serviço $($svc.Name) instalado — estado: $status"
        }
    }
    $ErrorActionPreference = "Stop"
}

Log "════════════════════════════════════════════════════════"
if ($DryRun) {
    Log " ✅ DRY RUN concluído — nenhuma alteração foi efectuada."
    Log ""
    Log " O que foi verificado (checks reais):"
    Log "   ✅ Pré-requisitos: git, python, node, npm, psql"
    Log "   ✅ Espaço em disco"
    if ($DumpPath) { Log "   ✅ Ficheiro de dump existe: $DumpPath" }
    Log ""
    Log " O que seria executado (simulado):"
    Log "   • Criar pastas em $($cfg.AppRoot)"
    Log "   • git clone $RepoUrl"
    Log "   • psql CREATE USER $($cfg.DbUser) + CREATE DATABASE $($cfg.DbName)"
    if ($DumpPath) { Log "   • psql restaurar dump: $DumpPath" }
    Log "   • Criar .env (com SECRET_KEY gerada + valores da configuração guiada)"
    Log "   • python -m venv + pip install + migrate + collectstatic"
    Log "   • npm ci + npm run build (pode demorar ~10 min)"
    Log "   • Criar sites IIS: $($cfg.IIS_API) (porta $($cfg.IIS_API_Port)) e $($cfg.IIS_App) (porta $($cfg.IIS_App_Port))"
    Log "   • Smoke test Django em porta $($cfg.SmokePort)"
    Log ""
    Log " Para executar a sério (sem -DryRun):"
    Log "   .\scripts\deploy-new.ps1 -DbPassword `"***`" -DumpPath `"$DumpPath`" -Ambiente $Ambiente"
} else {
    Log " ✅ Deploy de nova instalação concluído!"
    Log ""
}
if ($dadosCriticosEmFalta) {
    Log " ══ ⚠️  SISTEMA INUTILIZÁVEL — DADOS EM FALTA ══"
    Log "  URGENTE — importar dump antes de qualquer outra coisa:"
    Log "    1. psql -U $($cfg.DbUser) -d $($cfg.DbName) -f <dump>.sql"
    Log "    2. $($cfg.Python) manage.py migrate"
    Log "    3. Verificar (deve mostrar > 0 em todas as tabelas):"
    Log "       $($cfg.Python) manage.py shell -c `"from apps.organizacoes.models import Geografia, Dominio; from django.contrib.auth.models import Group; print(f'geo={Geografia.objects.count()} dom={Dominio.objects.count()} groups={Group.objects.count()}')`""
    Log ""
}
Log " PASSOS MANUAIS RESTANTES:"
$envHasEmail = if (Test-Path $envFile) { Get-Content $envFile -Raw | Select-String 'EMAIL_HOST_PASSWORD=.+' } else { $false }
if (-not $emailPass -or -not $envHasEmail) {
    Log "  1. ⚠️  EMAIL_HOST_PASSWORD vazio — reset de password não vai funcionar."
    Log "     Preencher em: $envFile"
    Log "     Gerar App Password em: Conta Google → Segurança → Passwords de aplicações"
} else {
    Log "  1. ✅ EMAIL_HOST_PASSWORD configurado"
}
if ($suUsername) {
    Log "  2. ✅ Superutilizador '$suUsername' criado e adicionado ao grupo DGIS (ver log acima)."
} else {
    Log "  2. Criar superutilizador Django e adicionar ao grupo DGIS:"
    Log "     cd $($cfg.BackendDir)"
    Log "     $($cfg.Python) manage.py createsuperuser"
    Log "     $($cfg.Python) manage.py shell -c `"from django.contrib.auth.models import User,Group; u=User.objects.get(username='<USERNAME>'); u.groups.add(Group.objects.get(name='DGIS')); print('OK')`""
}
Log "  3. IIS configurado via web.config (httpPlatformHandler):"
Log "     - Backend  → $($cfg.BackendDir)\web.config  (waitress)"
Log "     - Frontend → $($cfg.FrontDir)\.next\standalone\web.config  (node)"
Log "     ⚠️  Módulo IIS httpPlatformHandler necessário — instalar se ausente:"
Log "       https://www.iis.net/downloads/microsoft/httpplatformhandler"
Log "  4. ALLOWED_HOSTS e CORS_ALLOWED_ORIGINS — editar em settings.py"
Log "     BackEnd\mfids\core\settings.py (não são lidos do .env)"
if ($nssmExe) {
    Log "  5. ✅ Serviços Celery configurados via NSSM (Fase 9b)"
} else {
    Log "  5. ⚠️  NSSM não instalado — serviços Celery pendentes (ver Fase 9b no log)"
    Log "     Instalar: winget install nssm  e voltar a correr o script"
}
Log ""
Log " Ambiente : $($Ambiente.ToUpper())"
Log " Log      : $LogFile"
Log "════════════════════════════════════════════════════════"

} finally {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
