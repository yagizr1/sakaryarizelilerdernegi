# Dernek Yönetim Sistemi

React + Vite PWA panel ve Express + Prisma API (düğünplan ile aynı teknoloji yığını).

## Teknolojiler

**Frontend (`web/`)**
- React 19, Vite, TypeScript
- Tailwind CSS 4
- React Router, TanStack Query, Zod
- PWA (`vite-plugin-pwa`)
- Nginx (Docker)

**Backend (`backend/`)**
- Express, TypeScript
- Prisma + PostgreSQL
- JWT + bcrypt

## Docker ile çalıştırma (önerilen)

```bash
copy .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
```

- Panel (PWA): http://localhost:8180/
- API: http://localhost:4100/api/health
- Postgres: localhost:5433

**Giriş:** `admin` / `admin`

Durdurmak:

```bash
docker compose --env-file .env.docker down
```

## Yerel geliştirme

Önce Docker ile sadece Postgres’i ayağa kaldırın (veya tüm stack çalışsın):

```bash
docker compose --env-file .env.docker up -d postgres
```

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev

# Frontend (yeni terminal)
cd web
npm install
npm run dev
```

- Panel: http://127.0.0.1:5173
- API: http://127.0.0.1:4100

## Not

Eski statik HTML arayüz `_eski_statik/` klasöründe duruyor; yeni sistem `web/` + `backend/`.
