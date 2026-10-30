from django.core.management.base import BaseCommand
from django.db import connection

VIEWS = [
    ("count_equipamento_por_localizacao", """
        CREATE OR REPLACE VIEW count_equipamento_por_localizacao AS
        SELECT
            g.ilha,
            COUNT(e.id) AS quantidade_equipamentos
        FROM equipamento e
        JOIN geografia g ON g.id = e.geografia_id
        WHERE g.ilha IS NOT NULL
        GROUP BY g.ilha
    """),
    ("count_equipamento_por_concelho", """
        CREATE OR REPLACE VIEW count_equipamento_por_concelho AS
        SELECT
            g.concelho AS concelhos,
            COUNT(e.id) AS quantidade_equipamentos
        FROM equipamento e
        JOIN geografia g ON g.id = e.geografia_id
        WHERE g.concelho IS NOT NULL
        GROUP BY g.concelho
    """),
    ("count_equipamento_por_agentes", """
        CREATE OR REPLACE VIEW count_equipamento_por_agentes AS
        SELECT
            u.id AS user_id,
            u.email,
            u.username AS user_name,
            COUNT(e.id) AS total_equipamentos,
            COALESCE(p.avatar::TEXT, '') AS avatar_user
        FROM auth_user u
        LEFT JOIN equipamento e ON e.criado_por = u.id
        LEFT JOIN users_profile p ON p.user_id = u.id
        GROUP BY u.id, u.email, u.username, p.avatar
    """),
    ("count_equipamento_por_semana_atual", """
        CREATE OR REPLACE VIEW count_equipamento_por_semana_atual AS
        SELECT
            TO_CHAR(e.created_at, 'Day') AS dia_semana,
            EXTRACT(DOW FROM e.created_at)::INTEGER AS dia_numero,
            COUNT(e.id) AS total_equipamentos
        FROM equipamento e
        WHERE e.created_at >= DATE_TRUNC('week', NOW())
          AND e.created_at < DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        GROUP BY TO_CHAR(e.created_at, 'Day'), EXTRACT(DOW FROM e.created_at)
    """),
    ("detalhes_equipamento", """
        CREATE OR REPLACE VIEW detalhes_equipamento AS
        SELECT
            e.id,
            org_ges.codigo_gestor,
            org_pro.codigo_proprietario,
            e.nome,
            CONCAT_WS(', ', g.concelho, g.ilha) AS local,
            COALESCE(org_ges.nome, '') AS gestor_name,
            COALESCE(org_pro.nome, '') AS pro_name,
            e.estado AS estado_equipamento,
            COALESCE(u_criado.username, '') AS user_create,
            COALESCE(u_alt.username, '') AS alterado_por,
            e.created_at,
            e.alter_at
        FROM equipamento e
        LEFT JOIN organizacao org_ges ON org_ges.id = e.gestor_id
        LEFT JOIN organizacao org_pro ON org_pro.id = org_ges.parent_id
        LEFT JOIN geografia g ON g.id = e.geografia_id
        LEFT JOIN auth_user u_criado ON u_criado.id = e.criado_por
        LEFT JOIN auth_user u_alt ON u_alt.id = e.alterado_por
    """),
    ("count_servico_por_localizacao", """
        CREATE OR REPLACE VIEW count_servico_por_localizacao AS
        SELECT
            g.ilha,
            COUNT(s.id) AS total_servicos
        FROM servico s
        JOIN equipamento e ON e.id = s.equipamento_id
        JOIN geografia g ON g.id = e.geografia_id
        WHERE g.ilha IS NOT NULL
        GROUP BY g.ilha
    """),
    ("organizacao_sem_utilizador", """
        CREATE OR REPLACE VIEW organizacao_sem_utilizador AS
        SELECT
            o.id AS organization_id,
            COALESCE(o.nome, '') AS organization_name,
            uo.user_id,
            o.created_at,
            o.criado_por,
            COALESCE(u.username, '') AS username,
            uo.id AS userorg_id
        FROM organizacao o
        LEFT JOIN user_organizacao uo ON uo.organizacao_id = o.id
        LEFT JOIN auth_user u ON u.id = uo.user_id
    """),
    ("equipamento_organizacao_utilizador", """
        CREATE OR REPLACE VIEW equipamento_organizacao_utilizador AS
        SELECT
            e.id AS id_equi,
            e.gestor_id AS id_ges,
            org_ges.parent_id AS id_pro,
            uo_ges.user_id AS users_ges,
            uo_pro.user_id AS users_pro
        FROM equipamento e
        LEFT JOIN organizacao org_ges ON org_ges.id = e.gestor_id
        LEFT JOIN user_organizacao uo_ges ON uo_ges.organizacao_id = e.gestor_id
        LEFT JOIN user_organizacao uo_pro ON uo_pro.organizacao_id = org_ges.parent_id
    """),
    ("organizacao_user_detalhe", """
        CREATE OR REPLACE VIEW organizacao_user_detalhe AS
        SELECT
            o.id AS organizacao_id,
            uo.user_id,
            o.tipo_organizacao,
            o.parent_id
        FROM organizacao o
        INNER JOIN user_organizacao uo ON uo.organizacao_id = o.id
    """),
    ("lista_organizacao", """
        CREATE OR REPLACE VIEW lista_organizacao AS
        SELECT
            o.id,
            COALESCE(o.nome, '') AS nome,
            o.nif,
            o.natureza_juridica,
            o.contato_id,
            o.tipo_organizacao,
            o.geografia_id,
            o.parent_id,
            o.alter_at,
            o.created_at,
            COALESCE(uc.username, '') AS criado_por,
            COALESCE(ua.username, '') AS alterado_por,
            o.codigo_proprietario,
            o.codigo_gestor,
            o.natureza_juridica_outro,
            CAST(o.status AS VARCHAR) AS status,
            COALESCE(op.nome, '') AS proprietario_nome
        FROM organizacao o
        LEFT JOIN auth_user uc ON uc.id = o.criado_por
        LEFT JOIN auth_user ua ON ua.id = o.alterado_por
        LEFT JOIN organizacao op ON op.id = o.parent_id
    """),
    ("lista_servico", """
        CREATE OR REPLACE VIEW lista_servico AS
        SELECT
            COALESCE(s.nome, '') AS servico_name,
            COALESCE(c.email, '') AS email,
            s.equipamento_id AS id_equipamento,
            s.id AS id_servico,
            s.created_at,
            COALESCE(u.username, '') AS user_name
        FROM servico s
        LEFT JOIN equipamento e ON e.id = s.equipamento_id
        LEFT JOIN contato c ON c.id = e.contato_id
        LEFT JOIN auth_user u ON u.id = s.criado_por
    """),
    ("lista_valencias", """
        CREATE OR REPLACE VIEW lista_valencias AS
        SELECT
            s.id,
            COALESCE(e.nome, '') AS equipamento_nome,
            COALESCE(s.nome, '') AS servico_nome,
            s.data_licenciamento,
            s.capacidade_instalada,
            s.data_inicio_funcionamento,
            s.nr_funcionario,
            s.criado_por,
            s.created_at,
            s.alterado_por,
            s.alter_at
        FROM servico s
        LEFT JOIN equipamento e ON e.id = s.equipamento_id
    """),
    ("faixa_etaria_atendida", """
        CREATE OR REPLACE VIEW faixa_etaria_atendida AS
        SELECT
            d.id,
            COALESCE(SUM(
                COALESCE(sd.total_masculino, 0) + COALESCE(sd.total_feminino, 0)
            ), 0)::INTEGER AS total,
            d.domain_description
        FROM servico_demografia sd
        JOIN dominio d ON d.id = sd.domain_faixa_etaria
        GROUP BY d.id, d.domain_description
    """),
    ("distribuicao_tipo_resposta_social", """
        CREATE OR REPLACE VIEW distribuicao_tipo_resposta_social AS
        SELECT
            ROW_NUMBER() OVER (ORDER BY g.codigo_tipo_resposta)::INTEGER AS id,
            g.total::INTEGER AS total,
            g.codigo_tipo_resposta,
            g.tipo_resposta_desc
        FROM (
            SELECT
                COUNT(s.id) AS total,
                COALESCE(s.codigo_tipo_resposta, '') AS codigo_tipo_resposta,
                COALESCE(d.domain_description, s.codigo_tipo_resposta, '') AS tipo_resposta_desc
            FROM servico s
            LEFT JOIN dominio d ON d.domain_code = s.codigo_tipo_resposta
            WHERE s.codigo_tipo_resposta IS NOT NULL
            GROUP BY s.codigo_tipo_resposta, d.domain_description
        ) g
    """),
    ("taxa_ocupacao_equipamento", """
        CREATE OR REPLACE VIEW taxa_ocupacao_equipamento AS
        SELECT
            e.id,
            COALESCE(SUM(s.nr_utente_frequenta), 0)::INTEGER AS total_geral,
            COALESCE(SUM(s.capacidade_instalada), 0)::INTEGER AS capacidade_instalada,
            COALESCE(e.nome, '') AS nome_equipamento
        FROM equipamento e
        LEFT JOIN servico s ON s.equipamento_id = e.id
        GROUP BY e.id, e.nome
    """),
    ("numero_total_funcionario", """
        CREATE OR REPLACE VIEW numero_total_funcionario AS
        SELECT
            1 AS id,
            COALESCE(SUM(nr_funcionario), 0)::INTEGER AS total
        FROM servico
    """),
]


class Command(BaseCommand):
    help = 'Cria ou substitui todas as 16 views PostgreSQL necessárias para o sistema'

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            self.stdout.write(self.style.WARNING(
                'Ignorado: base de dados não é PostgreSQL (vendor=%s)' % connection.vendor
            ))
            return

        ok = 0
        errors = 0
        with connection.cursor() as cursor:
            for name, sql in VIEWS:
                try:
                    cursor.execute(sql)
                    self.stdout.write(self.style.SUCCESS('  OK  %s' % name))
                    ok += 1
                except Exception as exc:
                    self.stderr.write(self.style.ERROR('  ERRO %s: %s' % (name, exc)))
                    errors += 1

        summary = '%d/%d views criadas/actualizadas' % (ok, len(VIEWS))
        if errors:
            self.stderr.write(self.style.ERROR('%s (%d erros)' % (summary, errors)))
        else:
            self.stdout.write(self.style.SUCCESS(summary))
