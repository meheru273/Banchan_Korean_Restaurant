# Deploying Banchan — Frontend on Vercel, Backend on Render

The app is split:

- **Frontend** (React/Vite, the `client/` folder) → **Vercel** (static site/CDN).
- **Backend** (Node microservices + Redis + BullMQ worker) → **Render** (free tier) via [`render.yaml`](render.yaml).

The browser only talks to the **gateway** on Render; the gateway proxies to the
other services. Stripe posts webhooks **directly** to the order service.

```
Browser ─▶ Vercel (banchan-korean.vercel.app, static React)
            │  axios → VITE_API_URL
            ▼
        Render: banchan-gateway  ──▶ banchan-auth / banchan-menu / banchan-order / banchan-delivery
        Render: banchan-notification (BullMQ worker, no URL)
        Render: banchan-redis
   Stripe ─▶ banchan-order.onrender.com/api/orders/webhook/stripe  (direct)
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
   - **`banchan-shared` group → `CORS_ORIGIN`**: leave blank for now (set to Vercel URL in step 3).
   - **`MONGO_URI`** on each of auth/menu/order/delivery — same cluster, different DB name:
     - auth → `…mongodb.net/banchan_auth`
     - menu → `…mongodb.net/banchan_menu`
     - order → `…mongodb.net/banchan_orders`
     - delivery → `…mongodb.net/banchan_delivery`
   - **Order**: `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_WEBHOOK_SECRET` (set in step 4).
   - **Notification**: `SMTP_HOST/PORT/USER/PASS`.
3. After deploy, note the public URLs, e.g. `https://banchan-gateway.onrender.com`.
   Health-check each: `…onrender.com/health`.
4. Seed data once, from your machine, against the production Mongo URIs:
   ```powershell
   # temporarily point services/menu-service/.env MONGO_URI at the prod /banchan_menu DB
   node services/menu-service/src/seed.js
   # promote yourself to admin after first login
   node services/auth-service/src/makeAdmin.js you@example.com
   ```

---

## 2. Frontend → Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `client`** (important — the app lives there).
   Framework auto-detects as **Vite**. (`client/vercel.json` pins the build + SPA rewrite.)
3. **Environment Variables** (Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://banchan-gateway.onrender.com/api`  ← **must end with `/api`** |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
   | `VITE_FIREBASE_API_KEY` | from Firebase web config |
   | `VITE_FIREBASE_AUTH_DOMAIN` | your Firebase auth domain |
   | `VITE_FIREBASE_PROJECT_ID` | your Firebase project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | your Firebase storage bucket |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | your sender ID |
   | `VITE_FIREBASE_APP_ID` | your app ID |

4. Deploy. You'll get a URL like `https://banchan-korean.vercel.app`.

---

## 3. Wire the two together (CORS)

1. In Render, set the **`banchan-shared` env group → `CORS_ORIGIN`** to your exact
   Vercel URL (no trailing slash), e.g. `https://banchan-korean.vercel.app`.
   Save → Render redeploys all services.
2. Cross-site auth is handled in code: in production the refresh cookie is
   sent `SameSite=None; Secure`, and the gateway allows credentials.

---

## 4. Stripe webhook (do after order service is live)

1. Stripe Dashboard (**test mode**) → Developers → Webhooks → **Add endpoint**.
2. URL: `https://banchan-order.onrender.com/api/orders/webhook/stripe`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`.
4. Copy the signing secret (`whsec_…`) → set `STRIPE_WEBHOOK_SECRET` on the **banchan-order**
   service in Render → redeploy.

> The webhook goes straight to the order service, **not** through the gateway — the
> proxy would corrupt the raw body needed for signature verification.

---

## 5. Firebase authorized domains

Firebase Console → Authentication → Settings → **Authorized domains** → add your
Vercel domain (e.g. `banchan-korean.vercel.app`). Required for Google sign-in and
email-verification links in production.

---

## 6. Smoke test the live app

1. Open the Vercel URL (first Render request may cold-start ~50s on free tier).
2. Register → verify email → log in (or "Continue with Google").
3. Browse menu → add to cart → checkout → pay with test card `4242 4242 4242 4242`.
4. Stripe Dashboard → Webhooks → expect a `200` on `payment_intent.succeeded`.
5. Order shows **Paid**; confirmation email arrives in your SMTP inbox.

---

## Notes & gotchas
- **`VITE_API_URL` must include `/api`** (all gateway routes live under `/api/*`).
- **Free-tier cold starts**: Render web services sleep after 15 min idle. Optionally
  ping `banchan-gateway.onrender.com/health` every ~10 min with a free cron (cron-job.org).
- **Redis**: `render.yaml` provisions a Render Redis and injects `REDIS_URL` automatically.
- **Don't commit `.env`** — already in `.gitignore`. All secrets live in Render/Vercel dashboards.
