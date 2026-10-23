from django.db import migrations

TIPO_VALENCIA_DATA = [
    # (nome_valencia_social, tipo_valencia_social, status)
    # Tipo A — residencial/semi-residencial: VA10 + VA11 + VA12
    ('Creche, Lar de Idosos, Centros de Acolhimento e outras respostas residenciais', 'A', 1),
    # Tipo B — comunitário polivalente: VA12 + VA13
    ('Centro Comunitário e serviços polivalentes', 'B', 1),
    # Tipo C — reabilitação: VA10 + VA11 + VA12
    ('Centros de Reabilitação para Deficiência e Toxicodependência', 'C', 1),
    # Tipo D — ambulatório/atendimento: VA12 + VA13
    ('ATL, Serviços de Acompanhamento e Atendimento ambulatório', 'D', 1),
]

# Mapeamento RS → id_dominio da tabela Dominio (domain_name='FAIXA_ETARIA')
# Baseado em: CARTA_SOCIAL_Nomenclaturas_e_Conceitos_v01012020.docx
#   id=201: 0-3   id=202: 0-4   id=203: 0-12  id=204: 0-18
#   id=205: 4-6   id=206: 4-18  id=207: 6-18  id=208: 12-18
#   id=209: 12-25 id=210: 18+   id=211: 15-40 id=212: 15-60  id=258: 60+
FAIXA_ETARIA_MAPPING = [
    ('RS001', 201),   # Creche — 0 a 3 anos
    ('RS002', 205),   # Jardim de Infância — 4 a 6 anos
    ('RS003', 207),   # Centro Lúdico/ATL — 6 a 18 anos
    ('RS004', 203),   # Centro de Recuperação Nutricional — 0 a 12 anos
    ('RS005', 207),   # Centro de Apoio Sócio-Educativo — 6 a 18 anos (a partir de 6)
    ('RS006', 209),   # Lar/Residência de Estudante — 12 a 25 anos
    ('RS007', 204),   # Centro de Acolhimento para Crianças e Jovens em Situação de Risco — 0 a 18
    ('RS008', 204),   # Lar para Crianças e Jovens em Situação de Risco — 0 a 18
    ('RS009', 203),   # Centro de Emergência Infantil — 0 a 12 anos (def. nomenclaturas)
    ('RS010', 208),   # Centro de Acolhimento para Jovens em Conflito com a Lei — 12 a 18
    ('RS011', 210),   # Gabinetes de Atendimento a Vítimas (GAV) — 18+
    ('RS012', 210),   # Centro de Atendimento às Vítimas (CAV) — 18+
    ('RS013', 204),   # Casa de Abrigo VBG (inclui dependentes menores) — 0 a 18
    ('RS013', 210),   # Casa de Abrigo VBG (vítimas adultas) — 18+
    ('RS014', 212),   # Serviços de Acompanhamento VIH — 15 a 60 anos
    ('RS015', 211),   # Centro de Reabilitação de Toxicodependentes — 15 a 40 anos
    ('RS016', 201),   # Centro Comunitário — 0 a 3 (todas as idades, Tipo B)
    ('RS016', 205),   # Centro Comunitário — 4 a 6
    ('RS016', 207),   # Centro Comunitário — 6 a 18
    ('RS016', 210),   # Centro Comunitário — 18+
    ('RS016', 258),   # Centro Comunitário — 60+
    ('RS017', 211),   # Centro de Acolhimento de Mães Solteiras — 15 a 40 anos
    ('RS018', 258),   # Centro de Dia para Idosos — 60+
    ('RS019', 258),   # Lar de Idosos — 60+
    ('RS020', 210),   # Centro de Acolhimento de Doentes Mentais — 18+
    ('RS021', 204),   # Centro de Terapia Ocupacional — 0 a 18 (crianças/jovens)
    ('RS021', 210),   # Centro de Terapia Ocupacional — 18+ (adultos)
    ('RS022', 204),   # Centro de Reabilitação para Pessoas com Deficiência — 0 a 18
    ('RS022', 210),   # Centro de Reabilitação para Pessoas com Deficiência — 18+
    ('RS023', 201),   # Cuidador(a) de Infância — 0 a 3 anos
]

INSERT_TIPO_VALENCIA = """
    INSERT INTO tipo_valencia (nome_valencia_social, tipo_valencia_social, status)
    VALUES (%s, %s, %s)
    ON CONFLICT DO NOTHING
"""

INSERT_FAIXA_ETARIA = """
    INSERT INTO resposta_social_faixa_etaria (tipo_resposta, id_dominio)
    VALUES (%s, %s)
    ON CONFLICT DO NOTHING
"""

DELETE_FAIXA_ETARIA = "DELETE FROM resposta_social_faixa_etaria WHERE tipo_resposta LIKE 'RS%'"
DELETE_TIPO_VALENCIA = "DELETE FROM tipo_valencia WHERE tipo_valencia_social IN ('A','B','C','D')"


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_dominio_domain_code_alter_dominio_domain_name'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[(INSERT_TIPO_VALENCIA, row) for row in TIPO_VALENCIA_DATA]
                + [(INSERT_FAIXA_ETARIA, row) for row in FAIXA_ETARIA_MAPPING],
            reverse_sql=DELETE_FAIXA_ETARIA + '; ' + DELETE_TIPO_VALENCIA,
        ),
    ]
