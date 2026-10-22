# Carta Social App

Monorepo da aplicação Carta Social (DGIS, Cabo Verde). Interface e dados em português.

## Estrutura
- `BackEnd/mfids/` — backoffice e API. Django 4.2, DRF, Celery, Tailwind/Flowbite (base Rocket Django PRO). Python 3.11.
  - Apps de negócio em `apps/`: `organizacoes`, `equipamentos`, `servicos`, `users`, `authentication`, `api`, `file_manager`, `tasks`.
  - Configuração: `core/settings.py`, lê variáveis do `.env` (modelo em `env.sample`). Sem `DB_ENGINE` usa SQLite.
- `mfids_cs_app/` — frontoffice. Next.js 15 (App Router), React 19, TypeScript, Tailwind, shadcn/ui.
  - Chamadas à API em `src/services/*.service.ts` e `src/lib/api.ts` (base em `API_URL`).
  - Hooks de dados em `src/hooks/`, permissões em `src/contexts/permission-context.tsx`.

## Comandos
Backend (em `BackEnd/mfids`):
- `python -m venv .venv` · `.venv\Scripts\activate` · `pip install -r requirements.txt`
- `python manage.py migrate` · `python manage.py runserver`
- Assets: `npm install` · `npm run build`

Frontend (em `mfids_cs_app`):
- `npm install` · `npm run dev` · `npm run lint` · `npm run build`

## Regras
- Correções cirúrgicas no código existente; não reescrever ficheiros inteiros.
- Respostas diretas, sem explicações longas.
- Nunca colocar segredos no código: usar `os.environ.get(...)` / `.env`.
- Não ler nem commitar `.env*`, dumps `.sql` ou `.zip`.
