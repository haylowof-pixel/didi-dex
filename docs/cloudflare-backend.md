# OVERSEER Cloudflare Backend

This is the free-tier backend path for OVERSEER.

It uses:

- Cloudflare Workers for the HTTP API.
- Cloudflare D1 for accounts, sessions, tribes, tribe tasks, activity and sync snapshots.
- Opaque bearer sessions stored hashed in D1.

## Local Setup

```bash
npm run cloudflare:migrate:local
npm run cloudflare:dev
```

Then set the frontend:

```bash
VITE_OVERSEER_API_URL=http://127.0.0.1:8787
VITE_OVERSEER_AUTH_PROVIDER=cloudflare
```

## Production Setup

Create the D1 database:

```bash
npx wrangler d1 create overseer_api
```

Copy the returned `database_id` into:

```text
cloudflare/overseer-api/wrangler.toml
```

Apply migrations:

```bash
npm run cloudflare:migrate
```

Deploy:

```bash
npm run cloudflare:deploy
```

Point the app to the deployed Worker URL:

```bash
VITE_OVERSEER_API_URL=https://overseer-api.your-subdomain.workers.dev
VITE_OVERSEER_AUTH_PROVIDER=cloudflare
```

## API Surface

Public:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`

Authenticated:

- `POST /auth/logout`
- `GET /account`
- `PATCH /account`
- `POST /tribes`
- `POST /tribes/join`
- `GET /tribes/:tribeId/role`
- `GET /tribes/:tribeId/tasks`
- `POST /tribes/:tribeId/tasks`
- `PATCH /tribes/:tribeId/tasks/:taskId`
- `DELETE /tribes/:tribeId/tasks/:taskId`
- `GET /tribes/:tribeId/activity`
- `POST /tribes/:tribeId/activity`
- `POST /sync/snapshot`
- `GET /sync/latest`

Billing endpoints are intentionally stubbed for now because the launch plan is freemium/donations before paid subscriptions.

## Security Notes

This is an MVP backend, not the final paid-production auth stack.

Before taking paid users, add:

- Email verification.
- Password reset flow.
- Rate limits on auth endpoints.
- Strict `ALLOWED_ORIGIN`.
- Session management UI.
- Optional OAuth.
- R2-backed avatar storage instead of storing data URLs.
