# Operations Runbooks

Date: 2026-06-25
Status: Active

## Run Locally

1. Confirm `avatar/.env` exists and contains the provider fields from `docs/operations/account-configuration.md`.
2. Confirm `ANAM_API_KEY`, `ANAM_AVATAR_ID`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_AGENT_ID` are populated.
3. Run `pnpm install` from the repo root if dependencies are not installed.
4. Run `pnpm dev`.
5. Open `http://localhost:3638`.
6. Start a session from the console and watch the status, transcript, and provider trace panels.

## Refresh Local Shared Credentials

1. Update `../oss/.env` with the shared account values.
2. Project only the needed values into `avatar/.env`.
3. Keep `avatar/.env` ignored and local.
4. Run `pnpm typecheck` and `pnpm build` after changing runtime config behavior.

## Missing Anam Key

Symptom: the console shows provider readiness is incomplete or `/api/anam-session` returns a missing provider environment error.

Action:

1. Add `ANAM_API_KEY` to local or deployment secrets.
2. Confirm `ANAM_AVATAR_ID` is the intended public avatar ID.
3. Restart the dev server or redeploy so the server process reads the new environment.
4. Retry the session start.

## ElevenLabs Signed URL Failure

Symptom: `/api/anam-session` reports an ElevenLabs signed URL failure.

Action:

1. Confirm `ELEVENLABS_API_KEY` or upstream `ELEVEN_LABS_API_KEY` is populated.
2. Confirm `ELEVENLABS_AGENT_ID` points to an active Conversational AI agent with credits available.
3. Confirm the account has access to Conversational AI signed URLs.
4. Retry from the console and check provider trace IDs in the UI.

## Telemetry Check

1. Confirm `POSTHOG_API_KEY` plus `POSTHOG_HOST` or `AMPLITUDE_API_KEY` are present.
2. Run the app locally or in deployment.
3. Start and stop a session or trigger a client event.
4. Confirm the server logs `[avatar-agent.telemetry]`.
5. Check the configured analytics workspace for events named `avatar.*`.

## Deployment Secret Setup

1. Add the same app-local variable names from `.env.example` to the deployment provider.
2. Do not add `../oss/.env` wholesale to deployment.
3. Keep Google Vertex variables empty until the `jamie@yrka.io` lane is ready.
4. Build with `pnpm build`.
5. Run the runtime endpoint and confirm it returns readiness flags only, never secret values.

## Key Rotation

1. Rotate the provider key in the owning account dashboard.
2. Update `../oss/.env` if it is a shared account credential.
3. Update `avatar/.env` or deployment secrets with the new value.
4. Restart the process or redeploy.
5. Run a session start and confirm telemetry events still flow.
