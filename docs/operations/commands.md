# Run Commands

Date: 2026-06-26
Status: Active

This is the single source of truth for local run, build, and verification commands.
Run all commands from the repo root unless explicitly marked app-local.

## Run From

- Repo root (default): `C:/Users/james/orgs/oss/apps/avatar`
- App-local (optional): `C:/Users/james/orgs/oss/apps/avatar/apps/web`

## Workspace Commands

- `pnpm install` - install workspace dependencies.
- `pnpm dev` - start the web app on port 3638 through the repo dev wrapper.
- `pnpm typecheck` - run TypeScript validation for the web app.
- `pnpm build` - build the web app.
- `pnpm verify` - run typecheck and build in sequence.

## App-Local Commands

These mirror workspace behavior and are useful when running inside `apps/web/`.

- `pnpm dev` - start Next.js dev server on port 3638.
- `pnpm typecheck` - run `tsc --noEmit`.
- `pnpm build` - run a production Next.js build.
- `pnpm start` - run the production server on port 3638 after build.

## Fast Local Loop

Run from repo root: `C:/Users/james/orgs/oss/apps/avatar`.

1. Copy `.env.example` to `.env` and fill provider credentials.
2. Run `pnpm install`.
3. Run `pnpm dev`.
4. Open `http://localhost:3638`.

For provider-specific smoke tests and incident handling, use `docs/operations/runbooks.md`.
