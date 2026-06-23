# Banchan · Korean Grab n' Go 반찬

A full-stack Korean restaurant food ordering web app built with a MERN microservices architecture. Customers can browse the menu, add items to their cart, pay online with Stripe, and track their order. Admins can manage the menu and monitor orders.

**Live demo:** [banchan-korean-restaurant-client.vercel.app](https://banchan-korean-restaurant-client.vercel.app)

---

## Features

- Browse an authentic Korean menu with real food photography
- Add to cart, checkout, and pay with Stripe (test mode)
- Email & Google sign-in via Firebase Authentication
- Email verification on registration
- Order confirmation emails via Nodemailer
- Delivery status tracking
- Admin dashboard — CRUD on menu items, order management
- JWT authentication with httpOnly refresh-token cookies
- Redis-backed rate limiting on the API gateway
- Fully responsive — mobile bottom nav, desktop sidebar nav

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, DaisyUI v5 |
| Auth | Firebase Authentication (Email/Password + Google OAuth) |
| Backend | Node.js, Express (microservices) |
| Database | MongoDB Atlas + Mongoose |
| Payments | Stripe (PaymentIntents + Webhooks) |
| Queue | BullMQ over Redis |
| Gateway | http-proxy-middleware, ioredis rate limiter |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Architecture

```
Browser → Vercel (React SPA)
            │  axios → VITE_API_URL
            ▼
       Render: banchan-gateway  ──▶  banchan-auth
                                ──▶  banchan-menu
                                ──▶  banchan-order
                                ──▶  banchan-delivery
       Render: banchan-notification  (BullMQ worker)
       Render: banchan-redis         (shared cache + queues)

Stripe ──▶ banchan-order /api/orders/webhook/stripe  (direct, bypasses gateway)
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| `gateway` | 3000 | Auth middleware, rate limiting, reverse proxy |
| `auth-service` | 3001 | Register, login, Firebase token exchange, JWT |
| `menu-service` | 3002 | Menu CRUD, categories, image links |
| `order-service` | 3003 | Cart, orders, Stripe PaymentIntents |
| `delivery-service` | 3004 | Delivery records, driver assignment, status |
| `notification-service` | 3005 | Email notifications via BullMQ workers |

---

## Project Structure

```
mern-project/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Home, Menu, Cart, Checkout, Orders, Login, Register
│   │   ├── components/      # Navbar, BottomNav, GoogleButton
│   │   ├── context/         # AuthContext (Firebase-driven)
│   │   └── api/             # Axios instance with JWT interceptor
│   └── vercel.json          # SPA rewrite + Vite build config
├── services/
│   ├── auth-service/
│   ├── menu-service/
│   ├── order-service/
│   ├── delivery-service/
│   ├── gateway/
│   └── notification-service/
├── packages/
│   └── shared/              # Logger, error handler, createApp, constants
├── render.yaml              # Render Blueprint — all 7 backend services
└── DEPLOY.md                # Full deployment guide
```

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash — use TCP `rediss://` URL, not REST)
- Firebase project with Email/Password + Google sign-in enabled
- Stripe account (test mode keys)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/meheru273/Banchan_Korean_Restaurant.git
cd Banchan_Korean_Restaurant

# 2. Install all dependencies (npm workspaces)
npm install

# 3. Copy and fill in env files for each service
cp services/auth-service/.env.example services/auth-service/.env
cp services/menu-service/.env.example services/menu-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/delivery-service/.env.example services/delivery-service/.env
cp services/gateway/.env.example services/gateway/.env
cp services/notification-service/.env.example services/notification-service/.env
cp client/.env.example client/.env

# 4. Seed the menu and create an admin account
node services/menu-service/src/seed.js
node services/auth-service/src/seedAdmin.js

# 5. Start all services (in separate terminals or use a process manager)
node services/gateway/src/index.js
node services/auth-service/src/index.js
node services/menu-service/src/index.js
node services/order-service/src/index.js
node services/delivery-service/src/index.js
node services/notification-service/src/index.js

# 6. Start the frontend
cd client && npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` to the gateway on port 3000.

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full step-by-step guide:
- Backend → **Render** via Blueprint (`render.yaml`)
- Frontend → **Vercel** (root directory: `client`)

---

## Test Card (Stripe)

Use `4242 4242 4242 4242` with any future expiry and any CVC to test payments.

---

## Admin Access

After deploying, promote yourself to admin:

```bash
node services/auth-service/src/makeAdmin.js your@email.com
```

---

## License

MIT
