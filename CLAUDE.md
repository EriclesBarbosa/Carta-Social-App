# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Carta Social** is a social services management platform for Cape Verde (MFIDS/DGIS), built as a monorepo with two independently deployable applications:

- **BackEnd/mfids** — Django 4.2.9 REST API
- **mfids_cs_app** — Next.js 15.1.7 frontend

## Development Commands

### Backend (BackEnd/mfids)

```bash
# Setup
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver  # http://localhost:8000
npm run dev                 # Webpack watch (asset pipeline, run in parallel)

# Database
python manage.py makemigrations
python manage.py migrate

# Async tasks
celery -A apps.tasks worker -l info -B

# Full stack via Docker
docker-compose up --build   # Exposed at http://localhost:5085
```

### Frontend (mfids_cs_app)

```bash
npm install
npm run dev     # http://localhost:3000 (Turbopack)
npm run build   # Standalone production build
npm start       # Production server on port 4000
npm run lint    # ESLint
```

### Tests

```bash
# Backend
python manage.py test           # All tests
python manage.py test apps.api  # Single app
```

> Note: existing `tests.py` files are empty stubs — there is no test coverage yet.

## Architecture

### Backend (Django)

The project is configured in `core/` (settings, urls, wsgi/asgi). Business logic lives in `apps/` as modular Django apps:

| App | Purpose |
|-----|---------|
| `api` | Core DRF endpoints for equipamentos, servicos, organizacoes |
| `authentication` | DRF Token auth + OAuth (Google, GitHub) via django-allauth |
| `users` | User profiles and role-based permissions |
| `equipamentos` | Facility/equipment records (primary domain model) |
| `servicos` | Services offered by facilities |
| `organizacoes` | Organizations managing facilities |
| `tasks` | Celery async jobs |
| `common` | Shared models and validators |

API docs available at `/api/docs/` (Swagger) and `/api/redoc/` when running locally. The admin interface uses Jazzmin at `/admin/hj853dfgygecodgfwe6564388/`.

### Frontend (Next.js)

Uses the App Router (`src/app/`). Key patterns:

- **`src/app/api/`** — Next.js API routes that proxy requests to the Django backend
- **`src/services/`** — Service layer isolating all API calls (Axios); never call the backend directly from components
- **`src/lib/api.ts`** — Axios instance with automatic token injection
- **`src/components/dashboard/`** — Multi-step form flows for equipamentos and organizacoes
- **`src/contexts/`** — Auth state and theme; prefer React Query (`src/providers/`) for server state

### Auth Flow

1. Login via Next route `POST /api/auth/login` → proxies to Django `POST /api/login/` → returns `{token, user, permissions}`
2. Token stored in cookies (`mfids_token`), user data in localStorage
3. All subsequent API requests include `Authorization: Token <token>` header
4. Middleware (`src/middleware.ts`) protects dashboard routes

### Backend–Frontend Relationship

The Django backend runs on port 8000; the Next.js frontend on 3000 (dev) or 4000 (prod). CORS (`core/settings.py`) allows `localhost:3000`, `cartasocial.dgis.gov.cv` and the production IP on port 4000. Local `npm start` (port 4000) is NOT allowed. The Next.js API routes in `src/app/api/` act as a thin proxy, not as a BFF with business logic.

## Local Setup (PostgreSQL)

PostgreSQL is installed locally. Backend `.env` (`BackEnd/mfids/.env`):

```
DEBUG=True
SECRET_KEY=<any string>
DB_ENGINE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DB_DGIS_SITE
DB_USERNAME=mfids_user
DB_PASS=<mfids_user password>
EMAIL_HOST_PASSWORD=<gmail app password>
# CELERY_BROKER_URL=redis://localhost:6379   # only if running Celery
```

Without `DB_ENGINE`/`DB_NAME`/`DB_USERNAME` the backend falls back to SQLite.

Create the database and (optionally) restore the data dump (PostgreSQL 16, plain SQL, no owner), located OUTSIDE the repo in the parent folder:

```powershell
psql -U postgres -c "CREATE USER mfids_user WITH PASSWORD '<password>'"
psql -U postgres -c "CREATE DATABASE \"DB_DGIS_SITE\" OWNER mfids_user"
# Option A — empty DB:
python manage.py migrate
# Option B — real data (do NOT run migrate first):
Expand-Archive ..\carta_social_data_db.zip -DestinationPath $env:TEMP\cs_dump
psql -U mfids_user -d DB_DGIS_SITE -f $env:TEMP\cs_dump\carta_social_data_db.sql
python manage.py migrate   # applies only pending migrations
```

Frontend `.env.local` (`mfids_cs_app/.env.local`):

```
API_URL=http://localhost:8000
```

`API_URL` is server-side. **The fallback in `src/lib/api-helpers.ts` points to the production server (84.247.171.243:8000)** — without `.env.local`, local dev talks to production.

## Key Conventions

- Django migrations are version-controlled — always commit them with the model changes that generated them
- The backend has a Webpack pipeline (`webpack.config.js`) for bundling React components embedded in Django templates (`apps/react/`); this is separate from the standalone Next.js app
- Language is Portuguese (`pt-pt`), timezone `Atlantic/Cape_Verde`; model field names and URL paths use Portuguese (e.g., `equipamento`, `servico`, `organizacao`)
- Tailwind is used in both the backend templates and the Next.js app, but they have separate configs (`BackEnd/mfids/tailwind.config.js` and `mfids_cs_app/tailwind.config.ts`)
- shadcn/ui components are only in the Next.js app (`mfids_cs_app/components.json`)

## Regras
- Correções cirúrgicas; não reescrever ficheiros inteiros.
- Respostas diretas, sem rodeios.
- Segredos só no .env, nunca no código.
- Nunca ler nem commitar `.env*`, `.sql` ou `.zip`.
- Não alterar o fallback de produção em `api-helpers.ts` sem confirmar.
