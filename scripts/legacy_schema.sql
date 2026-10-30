-- Tabelas legadas (managed = False no Django) que o dump de producao popula.
-- Executar ANTES de restaurar o dump, DEPOIS de manage.py migrate.
-- Idempotente: CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS.

-- ?? contato ???????????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS contato (
    id           BIGSERIAL    PRIMARY KEY,
    endereco     VARCHAR(255),
    caixa_postal VARCHAR(20),
    telefone     VARCHAR(20),
    telemovel    VARCHAR(20),
    email        VARCHAR(100),
    website      VARCHAR(100),
    alterado_por INTEGER,
    criado_por   INTEGER,
    alter_at     TIMESTAMPTZ,
    created_at   TIMESTAMPTZ
);

-- ?? geografia ?????????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS geografia (
    id        SERIAL      PRIMARY KEY,
    ilha      VARCHAR(50),
    concelho  VARCHAR(100),
    freguesia VARCHAR(100),
    zona      VARCHAR(100),
    lugar     VARCHAR(100),
    pais      VARCHAR(100)
);

-- ?? localizacao ???????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS localizacao (
    id               BIGSERIAL   PRIMARY KEY,
    ilha             VARCHAR(50),
    concelho         VARCHAR(50),
    freguesia        VARCHAR(50),
    cidade           VARCHAR(50),
    vila             VARCHAR(50),
    zona             VARCHAR(50),
    latitude         VARCHAR(100),
    longitude        VARCHAR(100),
    altura           VARCHAR(100),
    ponto_referencia VARCHAR(100)
);

-- ?? organizacao ???????????????????????????????????????????????????????????????
-- Criada pelo migration 0003 com colunas minimas para a FK de UserOrganizacoes.
-- ALTER TABLE adiciona as colunas em falta que o dump de producao necessita.
CREATE TABLE IF NOT EXISTS organizacao (
    id                  SERIAL      PRIMARY KEY,
    nome                VARCHAR(255),
    nif                 VARCHAR(9),
    natureza_juridica   VARCHAR(50),
    tipo_organizacao    VARCHAR(2),
    parent_id           INTEGER,
    codigo_proprietario VARCHAR(9),
    codigo_gestor       VARCHAR(9),
    alterado_por        INTEGER,
    criado_por          INTEGER,
    alter_at            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ
);
ALTER TABLE organizacao ADD COLUMN IF NOT EXISTS contato_id              BIGINT;
ALTER TABLE organizacao ADD COLUMN IF NOT EXISTS geografia_id             INTEGER;
ALTER TABLE organizacao ADD COLUMN IF NOT EXISTS natureza_juridica_outro  VARCHAR(80);
ALTER TABLE organizacao ADD COLUMN IF NOT EXISTS status                  INTEGER DEFAULT 1;

-- ?? dominio ???????????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS dominio (
    id                 SERIAL      PRIMARY KEY,
    domain_code        VARCHAR(30) NOT NULL,
    domain_name        VARCHAR(80),
    domain_description VARCHAR(150),
    domain_status      INTEGER     DEFAULT 1,
    created_by_id      INTEGER,
    updated_by_id      INTEGER,
    created_at         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ,
    alterado_por       INTEGER,
    criado_por         INTEGER,
    alter_at           TIMESTAMPTZ
);

-- ?? equipamento ???????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS equipamento (
    id                           BIGSERIAL   PRIMARY KEY,
    codigo                       VARCHAR(50),
    nome                         VARCHAR(255),
    estado                       VARCHAR(50),
    tipo_construcao_outro        VARCHAR(50),
    tipo_edificacao_outro        VARCHAR(50),
    data_oficializacao           DATE,
    possui_eletricidade          BOOLEAN,
    agua_canalizada              VARCHAR(50),
    sistema_esgoto               VARCHAR(50),
    geografia_id                 INTEGER,
    latitude                     VARCHAR(100),
    longitude                    VARCHAR(100),
    altura                       VARCHAR(100),
    ponto_referencia             VARCHAR(100),
    domain_situacao_equipamento  INTEGER,
    situacao_equipamento_outro   VARCHAR(80),
    domain_situacao_juridica     INTEGER,
    domain_regime_propriedade    INTEGER,
    regime_propriedade_outro     VARCHAR(80),
    domain_tipo_edificacao       INTEGER,
    domain_estado_conservacao    INTEGER,
    domain_tipo_construcao_outro INTEGER,
    fonte_financiamento_outro    VARCHAR(80),
    remodelado                   BOOLEAN,
    fonte_fin_remodelacao_outro  VARCHAR(80),
    domain_ligacao_rede_publica  INTEGER,
    domain_sanita_latrina        INTEGER,
    banheiro_poliban             BOOLEAN,
    domain_evacuacao_agua        INTEGER,
    domain_possui_cozinha        INTEGER,
    domain_colecta_lixo          INTEGER,
    colecta_lixo_outro           VARCHAR(80),
    acesso_a_deficiente          BOOLEAN,
    data_encerramento            DATE,
    n_andar                      INTEGER,
    contato_id                   BIGINT,
    gestor_id                    INTEGER,
    alterado_por                 INTEGER,
    criado_por                   INTEGER,
    alter_at                     TIMESTAMPTZ,
    created_at                   TIMESTAMPTZ,
    status                       INTEGER     DEFAULT 1
);

-- ?? fonte_financiamento ???????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS fonte_financiamento (
    id                      BIGSERIAL   PRIMARY KEY,
    fonte                   VARCHAR(50),
    contexto                VARCHAR(20),
    equipamento_id          BIGINT,
    servico_id              BIGINT,
    domain_fonte_fin        INTEGER,
    alterado_por            INTEGER,
    criado_por              INTEGER,
    alter_at                TIMESTAMPTZ,
    created_at              TIMESTAMPTZ,
    domain_fonte_fin_outros VARCHAR(80)
);

-- ?? servico ???????????????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS servico (
    id                           BIGSERIAL   PRIMARY KEY,
    equipamento_id               BIGINT,
    nome                         VARCHAR(255),
    licenciado                   BOOLEAN,
    data_licenciamento           DATE,
    capacidade_instalada         INTEGER     NOT NULL DEFAULT 0,
    meses_operacionais           INTEGER,
    domain_acesso_gratuito       INTEGER,
    mensalidade_min              NUMERIC(10,0),
    mensalidade_max              NUMERIC(10,0),
    nr_valencia                  VARCHAR(100),
    codigo_tipo_resposta         VARCHAR(10),
    nr_alvara                    VARCHAR(100),
    resposta_social_financiada   BOOLEAN,
    data_inicio_funcionamento    DATE,
    encerra_ferias               BOOLEAN,
    domain_periodo_funcionamento INTEGER,
    nr_medio_utente_dia          INTEGER     NOT NULL DEFAULT 0,
    nr_utente_frequenta          INTEGER     NOT NULL DEFAULT 0,
    nr_utente_abranger           INTEGER     NOT NULL DEFAULT 0,
    nr_funcionario               INTEGER     NOT NULL DEFAULT 0,
    domain_dias_funcionamento    INTEGER,
    domain_meses_funcionamento   TEXT[],
    servicos_oferecidos_outros   VARCHAR(80),
    domain_fonte_fin_outros      VARCHAR(80),
    alterado_por                 INTEGER,
    criado_por                   INTEGER,
    alter_at                     TIMESTAMPTZ,
    created_at                   TIMESTAMPTZ
);

-- ?? operacao_servico ??????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS operacao_servico (
    id                 BIGSERIAL   PRIMARY KEY,
    servico_id         BIGINT,
    dias_funcionamento VARCHAR(50),
    horario_abertura   TIME,
    horario_fechamento TIME,
    alterado_por       INTEGER,
    criado_por         INTEGER,
    alter_at           TIMESTAMPTZ,
    created_at         TIMESTAMPTZ
);

-- ?? servico_demografia ????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS servico_demografia (
    id                    BIGSERIAL   PRIMARY KEY,
    servico_id            BIGINT,
    total_masculino       INTEGER,
    total_feminino        INTEGER,
    deficientes_masculino INTEGER,
    deficientes_feminino  INTEGER,
    domain_faixa_etaria   INTEGER,
    alterado_por          INTEGER,
    criado_por            INTEGER,
    alter_at              TIMESTAMPTZ,
    created_at            TIMESTAMPTZ
);

-- ?? servico_oferecido ?????????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS servico_oferecido (
    id                         BIGSERIAL   PRIMARY KEY,
    servico_id                 BIGINT,
    domain_tipo_servico        INTEGER,
    servicos_oferecidos_outros VARCHAR(80),
    alterado_por               INTEGER,
    criado_por                 INTEGER,
    alter_at                   TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ
);

-- ?? config ????????????????????????????????????????????????????????????????????
-- updated_at e created_at sao nullable: o dump de producao tem linhas com NULL
CREATE TABLE IF NOT EXISTS config (
    id            SERIAL       PRIMARY KEY,
    frontend_url  VARCHAR(200) NOT NULL,
    email_send    VARCHAR(254) NOT NULL,
    created_by_id INTEGER,
    updated_by_id INTEGER,
    used_type     BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ
);

-- ?? email_configuration ???????????????????????????????????????????????????????
CREATE TABLE IF NOT EXISTS email_configuration (
    id          SERIAL       PRIMARY KEY,
    smtp_server VARCHAR(255),
    smtp_port   INTEGER,
    username    VARCHAR(255),
    password    VARCHAR(255),
    use_tls     BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ
);

-- ?? hm_t_geografia ????????????????????????????????????????????????????????????
-- polygonarea: TEXT (nao NUMERIC) ? o dump contem strings vazias que falham em NUMERIC
CREATE TABLE IF NOT EXISTS hm_t_geografia (
    id          BIGSERIAL   PRIMARY KEY,
    ilha        VARCHAR(100),
    concelho    VARCHAR(100),
    freguesia   VARCHAR(100),
    zona        VARCHAR(100),
    lugar       VARCHAR(100),
    polygonarea TEXT
);

-- ?? tabela_geografia ??????????????????????????????????????????????????????????
-- id: BIGINT (nao INTEGER) ? valores no dump excedem 2^31 (ex: 238801001012007)
CREATE TABLE IF NOT EXISTS tabela_geografia (
    id        BIGINT      PRIMARY KEY,
    ilha      VARCHAR(100),
    concelho  VARCHAR(100),
    freguesia VARCHAR(100),
    zona      VARCHAR(100),
    lugar     VARCHAR(100)
);