# Deploying Banchan — Frontend on Vercel, Backend on Render

The app is split:

- **Frontend** (React/Vite, the `client/` folder) → **Vercel** (static site/CDN).
- **Backend** (Node microservices + Redis + BullMQ worker) → **Render** (free tier) via [`render.yaml`](render.yaml).

The browser only talks to the **gateway** on Render; the gateway proxies to the
other services. Stripe posts webhooks **directly** to the order service.

```
Browser ─▶ Vercel (banchan.vercel.app, static React)
            │  axios → VITE_API_URL
            ▼
        Render: feastfleet-gateway  ──▶ auth / menu / order / delivery
        Render: feastfleet-notification (BullMQ worker, no URL)
        Render: feastfleet-redis
   Stripe ─▶ feastfleet-order/api/orders/webhook/stripe  (direct)
```

---

## 0. Prerequisites
- Code pushed to a GitHub repo.
- MongoDB Atlas cluster (Network Access → allow `0.0.0.0/0` for a learning project).
- Stripe **test** keys, Firebase project, an SMTP provider (Mailtrap/Brevo).

---

## 1. Backend → Render (do this first; the frontend needs the gateway URL)

1. Render Dashboard → **New + → Blueprint** → connect the repo. Render reads
   `render.yaml` and creates: redis, auth, menu, order, delivery, gateway, and the
   notification worker.
2. When prompted, fill the `sync: false` values:
   - **`feastfleet-shared` group → `CORS_ORIGIN`**: leave blank for now (you'll set
     it to the Vercel URL in step 3) — or put a placeholder and update later.
   - **`MONGO_URI`** on each of auth/menu/order/delivery — same cluster, different DB
     name suffix: `…mongodb.net/feastfleet_auth`, `…/feastfleet_menu`,
     `…/feastfleet_orders`, `…/feastfleet_delivery`.
   - **Order**: `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_WEBHOOK_SECRET` (set in step 4).
   - **Notification**: `SMTP_HOST/PORT/USER/PASS`.
3. After deploy, note the public URLs, e.g. `https://feastfleet-gateway.onrender.com`.
   Health-check each: `…onrender.com/health`.
4. Seed data once, from your machine, against the production Mongo URIs:
   ```powershell
   # temporarily point services/menu-service/.env MONGO_URI at the prod /feastfleet_menu DB
   node services/menu-service/src/seed.js
   # and the auth DB for an admin (then promote yourself after first login)
   node services/auth-service/src/makeAdmin.js you@example.com
   ```

---

## 2. Frontend → Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `client`** (important — the app lives there).
   Framework auto-detects as **Vite**. (`client/vercel.json` pins the build + SPA
   rewrite + a workspace-safe install command.)
3. **Environment Variables** (Project → Settings → Environment Variables). These are
   baked in at build time, so add them before the first build:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://feastfleet-gateway.onrender.com/api`  ← **must end with `/api`** |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
   | `VITE_FIREBASE_API_KEY` | from Firebase web config |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `banchan-korean-restaurant.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `banchan-korean-restaurant` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `banchan-korean-restaurant.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `789729869731` |
   | `VITE_FIREBASE_APP_ID` | `1:789729869731:web:…` |
   | `VITE_FIREBASE_MEASUREMENT_ID` | `G-…` |

4. Deploy. You'll get a URL like `https://banchan.vercel.app`.

---

## 3. Wire the two together (CORS)

1. In Render, set the **`feastfleet-shared` env group → `CORS_ORIGIN`** to your exact
   Vercel URL (no trailing slash), e.g. `https://banchan.vercel.app`. This applies to
   all services. Save → Render redeploys them.
2. Cross-site auth is already handled in code: in production the refresh cookie is
   sent `SameSite=None; Secure`, and the gateway allows credentials.

---

## 4. Stripe webhook (production)

1. Stripe Dashboard (**test mode**) → Developers → Webhooks → **Add endpoint**.
2. URL: `https://feastfleet-order.onrender.com/api/orders/webhook/stripe`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`.
4. Copy the signing secret (`whsec_…`) → set `STRIPE_WEBHOOK_SECRET` on the **order**
   service in Render → redeploy that service.

> The webhook goes straight to the order service, **not** through the gateway — the
> proxy would corrupt the raw body needed for signature verification.

---

## 5. Firebase authorized domains

Firebase Console → Authentication → Settings → **Authorized domains** → add your
Vercel domain (e.g. `banchan.vercel.app`). Required for Google sign-in popups and
email-verification links in production. (`localhost` is already allowed for dev.)

---

## 6. Smoke test the live app

1. Open the Vercel URL (first request to Render may cold-start ~50s on free tier).
2. Register → verify email → log in (or “Continue with Google”).
3. Browse menu → add to cart → checkout → pay with test card `4242 4242 4242 4242`.
4. Stripe Dashboard → Webhooks → expect a `200` on `payment_intent.succeeded`.
5. Order shows **Paid**; confirmation email arrives in your SMTP inbox.
6. As admin, change an order status and watch the customer view update.

---

## Notes & gotchas
- **`VITE_API_URL` must include `/api`** (the gateway routes live under `/api/*`).
- **Free-tier cold starts**: Render web services sleep after 15 min idle. Optionally
  ping `…/gateway/health` every ~10 min with a free cron (cron-job.org) to keep warm.
- **Redis**: `render.yaml` provisions a Render Redis and injects `REDIS_URL`
  automatically — this also fixes the `ENOTFOUND …upstash.io` errors you saw locally
  (those were the wrong Upstash URL; use the `rediss://…:6379` TCP URL locally).
- **Don't commit `.env`** — already in `.gitignore`. All secrets live in the Render
  and Vercel dashboards.
