# Booking Hotel Admin Dashboard

A full-stack hotel booking management application for managing rooms, users, bookings, analytics, authentication, and user profiles. The project is prepared for portfolio, CV, and GitHub presentation with a React frontend, Express backend, PostgreSQL database, JWT authentication, and automated API tests.

## Tech Stack

- Frontend: React 19, Vite, React Router, Axios, Chart.js, Recharts
- Backend: Node.js, Express, PostgreSQL, pg, JWT, bcryptjs, multer, nodemailer
- Authentication: JWT, role-based authorization, Google login through Firebase Auth
- Database: PostgreSQL with SQL migration files
- Testing: Node.js built-in test runner with a fake database pool
- Tooling: ESLint, Vite build

## Features

- JWT authentication and protected routes
- Role-based authorization for admin and user workflows
- Admin dashboard analytics
- Rooms CRUD with room image upload
- Users CRUD for admins
- Booking creation, cancellation, status update, and booking history
- Advanced room filtering and pagination
- Forgot password and reset password flow with email token
- User profile management
- Change password from profile page
- Room capacity validation and real total price calculation
- Automated backend API tests without using the real database

## Screenshots

Add screenshots before publishing:

- Login page: `docs/screenshots/login.png`
- Dashboard analytics: `docs/screenshots/dashboard.png`
- Rooms management: `docs/screenshots/rooms.png`
- Booking flow: `docs/screenshots/booking.png`
- User profile: `docs/screenshots/profile.png`

## Project Structure

```text
admin-dashboard/
  backend/
    server.js
    src/
      controller/
      db/
        db.js
        migrations/
      middleware/
      routes/
      services/
    test/
    .env.example
  front-end/
    App.jsx
    context/
    layout/
    pages/
    routes/
    services/
    utils/
    .env.example
  public/
  README.md
  package.json
```

## Environment Variables

Never commit real `.env` files. Use the examples below as templates.

Backend:

```bash
cp backend/.env.example backend/.env
```

Required backend variables:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=booking_hotel
JWT_SECRET=replace_with_a_long_random_secret
RESET_TOKEN_TTL_MINUTES=15
AUTH_TOKEN_TTL=1d
AUTH_COOKIE_NAME=luxestay_session
AUTH_COOKIE_MAX_AGE_MS=86400000
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
TRUST_PROXY_HOPS=1
FIREBASE_PROJECT_ID=booking-hotel-be19e
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"replace_me"}
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="LuxeStay <no-reply@example.com>"
```

Frontend:

```bash
cp front-end/.env.example front-end/.env
```

Required frontend variables:

```env
VITE_API_URL=http://localhost:3001/api
```

Note: Firebase configuration is currently stored in `front-end/firebase.js`. For production hardening, move Firebase config to `VITE_FIREBASE_*` environment variables before publishing a live deployment.

## Database Migrations

Create the base database tables first, then run every migration file in order. The security migrations add session revocation/soft-delete fields and booking guest counts:

1. `backend/src/db/migrations/001_create_password_reset_tokens.sql`
2. `backend/src/db/migrations/002_add_user_profile_fields.sql`
3. `backend/src/db/migrations/003_add_auth_security_fields.sql`
4. `backend/src/db/migrations/004_add_booking_guests.sql`

Migration 003 invalidates legacy JWTs that do not contain `tokenVersion`. After applying it, users must log in again.

Run these SQL files in pgAdmin or your preferred PostgreSQL client after the base `users`, `rooms`, and `bookings` tables exist.

Current migration SQL files:

```sql
-- 001_create_password_reset_tokens.sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
  ON password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);

-- 002_add_user_profile_fields.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

## Install

Install frontend dependencies from the project root:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

## Run Locally

Start the backend:

```bash
cd backend
npm start
```

Start the frontend in another terminal:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API base URL: `http://localhost:3001/api`

## Build

Build the frontend production bundle:

```bash
npm run build
```

Preview the built frontend:

```bash
npm run preview
```

## Test

Run frontend lint:

```bash
npm run lint
```

Run backend tests:

```bash
cd backend
npm test
```

The backend test suite uses a fake database pool, so it does not require the real PostgreSQL database.

## Main API Endpoints

Auth:

- `POST /api/login`
- `POST /api/register`
- `POST /api/google-login`
- `POST /api/forgot-password`
- `POST /api/reset-password`

Users:

- `GET /api/users` admin only
- `GET /api/users/:id` admin only
- `POST /api/users` admin only
- `PUT /api/users/:id` admin only
- `DELETE /api/users/:id` admin only
- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/me/password`

Rooms:

- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms` admin only
- `PUT /api/rooms/:id` admin only
- `DELETE /api/rooms/:id` admin only
- `POST /api/rooms/upload-image` admin only

Bookings:

- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/cancel`
- `PUT /api/bookings/:id` admin only
- `DELETE /api/bookings/:id` admin only

Dashboard:

- `GET /api/dashboard/stats` admin only
- `GET /api/dashboard/analytics` admin only

## Demo Account

Use placeholder accounts for public documentation. Do not commit real credentials.

```text
Admin email: admin@example.com
Admin password: replace-with-demo-password

User email: user@example.com
User password: replace-with-demo-password
```

## Deployment Guide

Backend deployment:

1. Create a PostgreSQL database on your hosting provider.
2. Create the required base tables.
3. Run migrations in order:
   - `001_create_password_reset_tokens.sql`
   - `002_add_user_profile_fields.sql`
   - `003_add_auth_security_fields.sql`
   - `004_add_booking_guests.sql`
4. Configure backend environment variables from `backend/.env.example`.
5. Install dependencies with `npm install` inside `backend`.
6. Start the server with `npm start`.
7. Make sure the deployed backend exposes `/api` routes and `/uploads` static files.

Frontend deployment:

1. Configure `VITE_API_URL` to point to the deployed backend API URL.
2. Run `npm install` from the project root.
3. Run `npm run build`.
4. Deploy the generated `dist/` folder to a static host.
5. Configure SPA fallback routing to `index.html`.

Recommended hosting options:

- Frontend: Vercel, Netlify, Cloudflare Pages, Render Static Site
- Backend: Render, Railway, Fly.io, VPS, or any Node.js host
- Database: Supabase PostgreSQL, Neon, Railway PostgreSQL, Render PostgreSQL

## GitHub Hygiene

Do not commit:

- `.env` files
- `node_modules/`
- `dist/`
- `backend/uploads/` unless you intentionally want seed/demo images
- Real SMTP credentials
- Real database passwords
- Real JWT secrets

## Firebase Security Rules

The repository includes deny-by-default Firestore rules in `firestore.rules`. A user may access only `users/{uid}`; an administrator needs the Firebase custom claim `admin: true` to access all user documents.

Authenticate the Firebase CLI and deploy the reviewed rules explicitly:

```bash
firebase login
firebase use booking-hotel-be19e
firebase deploy --only firestore:rules
```

Do not deploy these rules blindly over a project with additional Firestore collections; extend the deny-by-default rules deliberately for each collection first.

Important: if a sensitive file was committed before being added to `.gitignore`, remove it from Git tracking and rotate exposed secrets before publishing.

## Notes for CV

Suggested CV summary:

> Built a full-stack hotel booking management system with React, Express, PostgreSQL, JWT authentication, role-based authorization, booking workflows, room management, analytics dashboards, image uploads, password reset, user profile management, and automated backend API tests.

Portfolio highlights:

- Full-stack architecture with separated frontend and backend
- Secure authentication using JWT and password hashing
- Admin/user role separation
- PostgreSQL-backed booking and room workflows
- Production-minded documentation and environment templates
- API tests that run without a real database
