-- Tabelas legadas (managed = False no Django) que o dump de producao popula.
-- Executar ANTES de restaurar o dump, DEPOIS de manage.py migrate.
-- Usa CREATE TABLE IF NOT EXISTS para ser idempotente.

CREATE TABLE IF NOT EXISTS organizacao (
    id            SERIAL       PRIMARY KEY,
    nome          VARCHAR(255),
    nif           VARCHAR(9),
    natureza_juridica VARCHAR(50),
    tipo_organizacao  VARCHAR(2),
    parent_id     INTEGER,
    codigo_proprietario VARCHAR(9),
    codigo_gestor VARCHAR(9),
    alterado_por  INTEGER,
    criado_por    INTEGER,
    alter_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contato (
    id            BIGSERIAL    PRIMARY KEY,
    endereco      VARCHAR(255),
    caixa_postal  VARCHAR(20),
    telefone      VARCHAR(20),
    telemovel     VARCHAR(20),
    email         VARCHAR(100),
    website       VARCHAR(100),
    alterado_por  INTEGER,
    criado_por    INTEGER,
    alter_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS geografia (
    id            SERIAL       PRIMARY KEY,
    ilha          VARCHAR(50),
    concelho      VARCHAR(100),
    freguesia     VARCHAR(100),
    zona          VARCHAR(100),
    lugar         VARCHAR(100),
    pais          VARCHAR(100),
    alter_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ,
    criado_por    INTEGER,
    alterado_por  INTEGER
);

CREATE TABLE IF NOT EXISTS localizacao (
    id              BIGSERIAL    PRIMARY KEY,
    ilha            VARCHAR(50),
    concelho        VARCHAR(50),
    freguesia       VARCHAR(50),
    cidade          VARCHAR(50),
    vila            VARCHAR(50),
    zona            VARCHAR(50),
    latitude        VARCHAR(100),
    longitude       VARCHAR(100),
    altura          VARCHAR(100),
    ponto_referencia VARCHAR(100),
    geografia_id    INTEGER      REFERENCES geografia(id),
    alter_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,
    criado_por      INTEGER,
    alterado_por    INTEGER
);

CREATE TABLE IF NOT EXISTS dominio (
    id                SERIAL       PRIMARY KEY,
    domain_code       VARCHAR(30)  NOT NULL,
    domain_description VARCHAR(150) NOT NULL,
    domain_name       VARCHAR(80)  NOT NULL,
    domain_status     VARCHAR(255),
    alter_at          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ,
    criado_por        INTEGER,
    alterado_por      INTEGER
);

CREATE TABLE IF NOT EXISTS equipamento (
    id                SERIAL       PRIMARY KEY,
    nome              VARCHAR(255),
    tipo_resposta     VARCHAR(30),
    ano_inicio        INTEGER,
    capacidade        INTEGER,
    area_m2           NUMERIC(10,2),
    status            INTEGER      DEFAULT 1,
    organization_id   INTEGER,
    criado_por        INTEGER,
    alterado_por      INTEGER,
    created_at        TIMESTAMPTZ,
    alter_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fonte_financiamento (
    id                SERIAL       PRIMARY KEY,
    equipamento_id    INTEGER,
    id_dominio        INTEGER,
    percentagem       NUMERIC(5,2),
    criado_por        INTEGER,
    alterado_por      INTEGER,
    created_at        TIMESTAMPTZ,
    alter_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS servico (
    id                SERIAL       PRIMARY KEY,
    equipamento_id    INTEGER,
    tipo_servico      VARCHAR(50),
    capacidade        INTEGER,
    criado_por        INTEGER,
    alterado_por      INTEGER,
    created_at        TIMESTAMPTZ,
    alter_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS config (
    id                SERIAL       PRIMARY KEY,
    frontend_url      VARCHAR(200) NOT NULL,
    email_send        VARCHAR(254) NOT NULL,
    created_by        INTEGER      REFERENCES auth_user(id),
    updated_by        INTEGER      REFERENCES auth_user(id),
    used_type         BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ  NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL
);

CREATE TABLE IF NOT EXISTS email_configuration (
    id                SERIAL       PRIMARY KEY,
    email_envio       VARCHAR(254),
    enviar_emails     BOOLEAN      DEFAULT TRUE,
    criado_em         TIMESTAMPTZ,
    atualizado_em     TIMESTAMPTZ,
    criado_por_id     INTEGER      REFERENCES auth_user(id),
    atualizado_por_id INTEGER      REFERENCES auth_user(id)
);

CREATE TABLE IF NOT EXISTS hm_t_geografia (
    id               SERIAL       PRIMARY KEY,
    nome             VARCHAR(255),
    pais             VARCHAR(100),
    ilha             VARCHAR(100),
    concelho         VARCHAR(100),
    freguesia        VARCHAR(100),
    zona             VARCHAR(100),
    nome_norm        VARCHAR(255),
    nivel_detalhe    INTEGER,
    colmatch         VARCHAR(100),
    polygonarea      NUMERIC
);

CREATE TABLE IF NOT EXISTS tabela_geografia (
    id               SERIAL       PRIMARY KEY,
    nome             VARCHAR(255),
    zona             VARCHAR(100),
    freguesia        VARCHAR(100),
    concelho         VARCHAR(100),
    ilha             VARCHAR(100),
    pais             VARCHAR(100),
    geogr_id         INTEGER,
    nivel_detalhe    INTEGER,
    nacionalidade    VARCHAR(100),
    nome_oficial     VARCHAR(255),
    flag_alter       VARCHAR(10),
    nome_norm        VARCHAR(255),
    tp_geog_cd       VARCHAR(20),
    flg_situacao     VARCHAR(10),
    codigo_ine       VARCHAR(20),
    codigo           VARCHAR(20),
    codigo_iso       VARCHAR(20),
    short_nome       VARCHAR(100),
    self_id          INTEGER
);
