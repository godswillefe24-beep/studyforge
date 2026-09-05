
# StudyForge

## Setup

Requirements: Node.js 20 or newer and Corepack. Copy `.env.example` to `.env`, fill in the required values, then run:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:push
pnpm seed:waec
pnpm dev
```

The production build is `pnpm build` and runs with `pnpm start`. The server uses the `PORT` supplied by the hosting platform. Set the OAuth provider callback URL to `/api/oauth/callback` on the deployed app, and configure the same public app URL in the provider.

`pnpm test` runs deterministic local tests. `pnpm test:integration` runs the Turso and Paystack checks and requires those credentials in `.env`.

## Render

The repository includes `render.yaml`. In Render, create a Blueprint from the repository and enter the values marked `sync: false`. Run database migrations and seed the WAEC catalog against the configured Turso database before opening the production app.

## Validation note

The integration suite exercises the live Turso/libSQL database and Paystack read-only verification. A temporary Turso `ConnectTimeoutError` can cause network-backed tests to fail or exceed their individual timeout even when the application code is unchanged. Re-running the suite after connectivity recovers is the correct validation path; destructive seed data is never inserted by the tests.

## Learner content and zero-state behavior

The Practice room reads the complete WAEC subject catalog from Turso through `content.subjects`. Learners can select any seeded subject and optionally filter by `easy`, `medium`, or `hard` difficulty; filtered retrieval is enforced server-side through `content.questions` rather than only hiding rows in the client. The reusable `pnpm seed:waec` command adds the expanded topic batches idempotently.

New browser tabs do not expose an existing preview session as a learner dashboard until the user explicitly submits the sign-in form. A newly created account has no attempts, completed sessions, active days, or notifications, and the dashboard renders zero metrics plus an onboarding empty state. The `progress.history30` procedure returns exactly 30 UTC calendar points, including zero-filled days, for the streak/progress chart.

Turso-backed integration tests can be slower than local tests because each mutation is a network round trip. A transient connection timeout should be rerun before treating it as an application failure; the validation suite records the final result in the task checkpoint.
