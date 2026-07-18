# LuxeStay Deployment Guide

This guide prepares LuxeStay for production deployment with:

- Backend: ExpressJS on Render
- Database: PostgreSQL on Neon
- Frontend: React/Vite on Vercel

Do not commit real `.env` files or production secrets.

## 1. Neon PostgreSQL

In Neon:

1. Open your Neon project.
2. Go to `Dashboard` or `Connection Details`.
3. Copy the connection details:
   - Host
   - Database
   - User
   - Password
   - Port
4. Use the individual fields as environment variables in Render.

Current Neon values to use:

```env
DB_HOST=ep-flat-shape-aowhnsvq.c-2.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=use_your_real_neon_password_in_render_only
```

The backend detects Neon by checking whether `DB_HOST` contains `neon.tech` and enables PostgreSQL SSL automatically.

## 2. Database Migrations

Run the base schema first, then run these migrations in order in Neon SQL Editor or pgAdmin:

```text
backend/src/db/migrations/001_create_password_reset_tokens.sql
backend/src/db/migrations/002_add_user_profile_fields.sql
backend/src/db/migrations/003_add_auth_security_fields.sql
backend/src/db/migrations/004_add_booking_guests.sql
```

Make sure the base tables already exist before running these migration files:

- `users`
- `rooms`
- `bookings`

## 3. Render Backend Deployment

Create a new Render Web Service:

- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Add these environment variables in Render:

```env
PORT=3001
CLIENT_URL=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app

DB_HOST=ep-flat-shape-aowhnsvq.c-2.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your_real_neon_password

JWT_SECRET=your_long_random_jwt_secret
AUTH_TOKEN_TTL=1d
AUTH_COOKIE_NAME=luxestay_session
AUTH_COOKIE_MAX_AGE_MS=86400000
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
TRUST_PROXY_HOPS=1
FIREBASE_PROJECT_ID=booking-hotel-be19e
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"replace_me"}
RESET_TOKEN_TTL_MINUTES=15

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="LuxeStay <no-reply@example.com>"
```

After deployment, verify:

- `https://your-render-service.onrender.com/`
- `https://your-render-service.onrender.com/api/rooms`

## 4. Vercel Frontend Deployment

Create a new Vercel project:

- Framework Preset: Vite
- Root Directory: project root
- Build Command: `npm run build`
- Output Directory: `dist`

Add this environment variable in Vercel:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

The file `front-end/vercel.json` contains the rewrite required for React Router SPA navigation.

## 5. Local Production Check

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
npm install
npm run build
```

## 6. Deployment Checklist

- `.env` files are not committed.
- `backend/.env` is removed from Git tracking if it was tracked before.
- Neon password is stored only in Render environment variables.
- `JWT_SECRET` is long and unique in production.
- `CLIENT_URL` and `FRONTEND_URL` point to the Vercel app URL.
- `VITE_API_URL` points to the Render backend URL with `/api`.
- Database migrations were run successfully.
- Room image uploads are understood as runtime files and are not committed.
- Login, booking, room list, dashboard, profile, and password reset are tested after deploy.

## 7. Security Notes

If any real secret was committed before `.gitignore` was updated:

1. Remove the file from Git tracking.
2. Rotate the exposed secret in Neon, SMTP provider, Firebase if needed, and JWT config.
3. Force-pushing history cleanup is optional for private practice repos, but rotating secrets is mandatory before public release.
