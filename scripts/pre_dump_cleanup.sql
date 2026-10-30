-- pre_dump_cleanup.sql
-- Limpa tabelas que manage.py migrate ja populou antes de restaurar o dump.
-- Evita conflitos de chave duplicada durante o COPY do dump de producao.
-- Executar DEPOIS de legacy_schema.sql, ANTES de restaurar o dump.

SET session_replication_role = replica;

TRUNCATE TABLE django_content_type CASCADE;
TRUNCATE TABLE auth_permission CASCADE;
TRUNCATE TABLE auth_group CASCADE;
TRUNCATE TABLE auth_group_permissions CASCADE;
TRUNCATE TABLE django_migrations CASCADE;

SET session_replication_role = DEFAULT;