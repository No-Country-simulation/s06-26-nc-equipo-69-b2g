# Deploy

El objetivo de deploy actual es mantener frontend y backend preparados para entornos separados.

## Frontend en Vercel

| Campo            | Valor                            |
| ---------------- | -------------------------------- |
| Root directory   | `frontend`                       |
| Install command  | `pnpm install --frozen-lockfile` |
| Build command    | `pnpm build`                     |
| Output directory | `dist`                           |

Vercel debe usar Node 22 y detectar pnpm desde `packageManager` en la raiz.

## Backend

El backend es una API Express. Para correrlo en local:

```bash
pnpm --filter backend dev
```

Para produccion, configurar variables de entorno en la plataforma elegida. No commitear `.env`.

## Variables

Usar los archivos `.env.example` como referencia. Los valores reales se cargan en cada entorno de deploy.
