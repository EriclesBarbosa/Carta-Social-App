-- Views PostgreSQL do Carta Social
-- Executar: psql -U mfids_user -d DB_DGIS_SITE -f scripts/create_views.sql
-- Todas as views usam CREATE OR REPLACE, pelo que são idempotentes.

-- ------------------------------------------------------------------
-- 1. count_equipamento_por_localizacao
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW count_equipamento_por_localizacao AS
SELECT
    g.ilha,
    COUNT(e.id) AS quantidade_equipamentos
FROM equipamento e
JOIN geografia g ON e.geografia_id = g.id
WHERE g.ilha IS NOT NULL
GROUP BY g.ilha
ORDER BY g.ilha;

-- ------------------------------------------------------------------
-- 2. count_equipamento_por_concelho
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW count_equipamento_por_concelho AS
SELECT
    g.concelho AS concelhos,
    COUNT(e.id) AS quantidade_equipamentos
FROM equipamento e
JOIN geografia g ON e.geografia_id = g.id
WHERE g.concelho IS NOT NULL
GROUP BY g.concelho
ORDER BY g.concelho;

-- ------------------------------------------------------------------
-- 3. count_equipamento_por_agentes
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW count_equipamento_por_agentes AS
SELECT
    u.id                          AS user_id,
    u.email,
    u.username                    AS user_name,
    COUNT(e.id)                   AS total_equipamentos,
    COALESCE(p.avatar, '')        AS avatar_user
FROM auth_user u
LEFT JOIN equipamento e  ON e.criado_por  = u.id
LEFT JOIN users_profile p ON p.user_id    = u.id
GROUP BY u.id, u.email, u.username, p.avatar
ORDER BY total_equipamentos DESC;

-- ------------------------------------------------------------------
-- 4. count_equipamento_por_semana_atual
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW count_equipamento_por_semana_atual AS
SELECT
    CASE EXTRACT(DOW FROM d.dia)
        WHEN 1 THEN 'Seg'
        WHEN 2 THEN 'Ter'
        WHEN 3 THEN 'Qua'
        WHEN 4 THEN 'Qui'
        WHEN 5 THEN 'Sex'
        WHEN 6 THEN 'Sáb'
        WHEN 0 THEN 'Dom'
    END                                      AS dia_semana,
    EXTRACT(DOW FROM d.dia)::INT             AS dia_numero,
    COUNT(e.id)                              AS total_equipamentos
FROM (
    SELECT generate_series(
        date_trunc('week', CURRENT_DATE),
        date_trunc('week', CURRENT_DATE) + INTERVAL '6 days',
        INTERVAL '1 day'
    )::DATE AS dia
) d
LEFT JOIN equipamento e
    ON DATE(e.created_at AT TIME ZONE 'UTC') = d.dia
GROUP BY d.dia
ORDER BY d.dia;

-- ------------------------------------------------------------------
-- 5. detalhes_equipamento  (usada pelo DashEquipamento)
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW detalhes_equipamento AS
SELECT
    e.id,
    g.codigo_gestor,
    gp.codigo_proprietario,
    e.nome,
    CONCAT(geo.ilha, ', ', geo.concelho)  AS local,
    g.nome                                AS gestor_name,
    gp.nome                               AS pro_name,
    e.estado                              AS estado_equipamento,
    u.username                            AS user_create,
    CAST(e.alterado_por AS VARCHAR)       AS alterado_por,
    e.created_at,
    e.alter_at
FROM equipamento e
LEFT JOIN organizacao  g   ON e.gestor_id   = g.id
LEFT JOIN organizacao  gp  ON g.parent_id   = gp.id
LEFT JOIN geografia    geo ON e.geografia_id = geo.id
LEFT JOIN auth_user    u   ON e.criado_por   = u.id;

-- ------------------------------------------------------------------
-- 6. count_servico_por_localizacao
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW count_servico_por_localizacao AS
SELECT
    g.ilha,
    COUNT(s.id) AS total_servicos
FROM servico s
JOIN equipamento e ON s.equipamento_id = e.id
JOIN geografia   g ON e.geografia_id   = g.id
WHERE g.ilha IS NOT NULL
GROUP BY g.ilha
ORDER BY g.ilha;
