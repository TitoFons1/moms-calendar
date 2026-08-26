This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Despliegue con Docker / Portainer (vía GitHub)

Este proyecto se despliega como un stack de Git en Portainer: Portainer clona
este repositorio directamente y construye la imagen con `docker-compose.yml`
en el propio servidor. No hay pipeline de GitHub Actions.

### 1. Variables de entorno necesarias

La app solo necesita dos variables públicas de Supabase (ver `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Como empiezan por `NEXT_PUBLIC_`, Next.js las incrusta en el JS del cliente
**en tiempo de build**, no de ejecución. Por eso `docker-compose.yml` las pasa
como `build.args`, y Portainer debe tenerlas configuradas como variables de
entorno del stack (no solo del contenedor) para que lleguen al build.

### 2. Crear el stack en Portainer

1. En Portainer: **Stacks → Add stack → Repository**.
2. Repository URL: `https://github.com/TitoFons1/moms-calendar` (repo
   público, no requiere credenciales).
3. Reference: `refs/heads/main`.
4. Compose path: `docker-compose.yml`.
5. En **Environment variables**, añade `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los valores reales de tu proyecto de
   Supabase.
6. Activa **GitOps updates** con un webhook (o polling) para que el stack se
   reconstruya automáticamente en cada push a `main`.
7. Despliega. La app queda expuesta en el puerto `3000` del host (ajusta el
   mapeo de puertos en Portainer/proxy inverso según tu red).

### 3. Redespliegues

Con el webhook activado, cada `git push` a `main` dispara en Portainer un
`git pull` + rebuild de la imagen + recreación del contenedor. Para forzarlo
manualmente: **Stack → Pull and redeploy**.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
