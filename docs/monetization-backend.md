# OVERSEER Monetization Backend

This is the first backend contract for turning the local app into a paid web/cloud product.

## Environment

Frontend variables:

```bash
VITE_OVERSEER_API_URL=https://api.overseer.app
VITE_STRIPE_PRICE_SURVIVOR=price_survivor_monthly
VITE_STRIPE_PRICE_TRIBE=price_tribe_monthly
```

Server-only variables:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SURVIVOR=price_...
STRIPE_PRICE_TRIBE=price_...
APP_URL=https://overseer.app
```

## Endpoints

### `POST /sync/snapshot`

Stores a full local app snapshot for the signed-in account.

Request:

```json
{
  "version": 1,
  "exportedAt": "2026-05-28T12:00:00.000Z",
  "account": {
    "email": "player@example.com",
    "displayName": "Breeder",
    "planId": "tribe",
    "tribeName": "Blue Obelisk",
    "tribeCode": "TRIBE-1234"
  },
  "settings": {},
  "library": [],
  "raisingTimers": []
}
```

Response:

```json
{
  "ok": true,
  "syncedAt": "2026-05-28T12:00:01.000Z"
}
```

### `POST /billing/create-checkout-session`

Creates a Stripe Checkout Session in subscription mode. Use Stripe Prices, not deprecated Plans.

Request:

```json
{
  "planId": "survivor",
  "email": "player@example.com",
  "displayName": "Breeder",
  "tribeName": "Blue Obelisk",
  "successUrl": "https://overseer.app/#account:success",
  "cancelUrl": "https://overseer.app/#account"
}
```

Response:

```json
{
  "url": "https://checkout.stripe.com/c/..."
}
```

### `POST /billing/create-portal-session`

Creates a Stripe Customer Portal session for subscription changes, cancellations and payment methods.

Request:

```json
{
  "email": "player@example.com",
  "returnUrl": "https://overseer.app/#account"
}
```

Response:

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

## Data Model

Minimum tables:

```sql
accounts (
  id uuid primary key,
  email text unique not null,
  display_name text,
  stripe_customer_id text,
  plan_id text not null default 'free',
  billing_status text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

tribes (
  id uuid primary key,
  name text not null,
  invite_code text unique not null,
  owner_account_id uuid not null references accounts(id),
  created_at timestamptz not null default now()
);

tribe_members (
  tribe_id uuid not null references tribes(id),
  account_id uuid not null references accounts(id),
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tribe_id, account_id)
);

sync_snapshots (
  id uuid primary key,
  account_id uuid not null references accounts(id),
  tribe_id uuid references tribes(id),
  payload jsonb not null,
  exported_at timestamptz,
  created_at timestamptz not null default now()
);
```

## Stripe Flow

1. Frontend calls `/billing/create-checkout-session`.
2. Backend maps `planId` to the matching Stripe Price.
3. Backend creates a Checkout Session with `mode: "subscription"`.
4. Stripe redirects back to `#account:success`.
5. Backend receives Stripe webhooks and updates `accounts.plan_id` and `accounts.billing_status`.
6. Frontend syncs account status from the backend.
