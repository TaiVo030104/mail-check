# MailCheck

Monorepo:

| Folder | Stack | Deploy |
|---|---|---|
| [`frontend/`](frontend) | React + Vite + TanStack Router | Vercel (Root Directory: `frontend`) |
| [`backend/`](backend) | NestJS + MongoDB | Railway (Root Directory: `/backend`) |
| [`devops/`](devops) | Deployment docs, legacy Ansible/VPS setup | — |

Deployment guide: [devops/DEPLOY-VERCEL-RAILWAY.md](devops/DEPLOY-VERCEL-RAILWAY.md)

## Local development

```bash
# backend
cd backend && cp .env.example .env && pnpm install && pnpm start:dev

# frontend
cd frontend && pnpm install && pnpm dev
```

> Note: `.github/workflows` inside each subfolder came from the original separate repos and do not run in this monorepo
> (GitHub only reads workflows from the root `.github/`).
