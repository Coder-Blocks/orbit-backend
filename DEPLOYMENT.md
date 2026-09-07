# Deploying Orbit

Two pieces, deployed separately: `orbit-backend` (API + database) and
`orbit-frontend` (the Next.js app). Deploy the backend first — the frontend
needs its live URL.

## 1. Backend — Render (recommended, one step via the blueprint)

This repo includes `render.yaml`, so Render can stand up the API **and** a
managed Postgres database together, wired to each other automatically.

1. Push `orbit-backend` to a GitHub repo.
2. In Render: **New → Blueprint**, point it at that repo. It reads
   `render.yaml` and provisions both the web service and the `orbit-db`
   Postgres instance in one step, `DATABASE_URL` included automatically.
3. Render builds from `Dockerfile` — no extra config needed. Build runs
   `prisma generate`; container start runs `prisma migrate deploy` before
   booting the API (see the Dockerfile's last line).
4. Once it's live, run the seed script once so there's real demo data:
   Render's dashboard → your service → **Shell** →
   ```bash
   npx prisma db seed
   ```
5. Note the live URL Render gives you (something like
   `https://orbit-backend.onrender.com`) — the frontend needs it next.

**Alternative: Railway.** Same Dockerfile works unchanged — "New Project →
Deploy from GitHub", add a Postgres plugin (Railway sets `DATABASE_URL`
automatically), add the other env vars from `.env.example`, deploy. No
blueprint file needed; Railway auto-detects the Dockerfile.

**Either way, before going further:** the free tier of most of these
platforms works fine for a demo, but confirm outbound network access isn't
restricted the way this chat sandbox's was — a normal Render/Railway
container has full internet access, so `prisma generate` and friends will
work there even though they couldn't run here.

## 2. Frontend — Vercel

Next.js apps need essentially no configuration on Vercel.

1. Push `orbit-frontend` to a GitHub repo (a separate one from the backend,
   or a subfolder of the same one — either works).
2. In Vercel: **New Project**, import that repo. It detects Next.js
   automatically.
3. Add one environment variable before deploying:
   - `NEXT_PUBLIC_API_URL` = the backend URL from step 1.5 above
     (e.g. `https://orbit-backend.onrender.com`)
4. Deploy. You'll get a URL like `https://orbit.vercel.app`.

## 3. Close the loop

Go back to the backend's environment variables (Render/Railway dashboard)
and set:

- `FRONTEND_URL` = your Vercel URL from step 2.4

This locks CORS down to your actual frontend instead of leaving it open to
any origin (see `src/main.ts`).

## 4. What you'll have at that point

A live, real URL taking real signups and bookings against a real Postgres
database — genuinely further than a demo. Two things still won't be real
yet, on purpose:

- **Payments** — still the mock provider (`src/payments/mock-payment.provider.ts`)
  until a UPI-compatible gateway is onboarded and a real adapter written
  alongside it.
- **File/photo uploads** — condition photos, listing images, etc. aren't
  wired to real object storage anywhere in this build; that's the next
  infrastructure piece after payments.

Both are additive — nothing above needs to change shape to add them later.
