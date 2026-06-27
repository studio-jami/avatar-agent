# Operations Runbooks

Date: 2026-06-25
Status: Active

## Run Locally

1. Confirm `avatar/.env` exists and contains the provider fields from `docs/operations/account-configuration.md`.
2. Confirm `ANAM_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and the named persona variables are populated.
3. For Higgs preview testing, also confirm `BOSON_API_KEY` is populated.
3. Run `pnpm install` from the repo root if dependencies are not installed.
4. Run `pnpm dev`.
5. Open `http://localhost:3638`.
6. Choose `Anam live session` for realtime testing or `Boson Higgs preview` for generated clip testing.
7. Start or generate from the console and watch status plus transcript/system events.

## Boson Higgs Preview Smoke Test

1. Open the app and switch provider to `Boson Higgs preview`.
2. Pick an avatar from `assets/avatars/live`.
3. Enter a short prompt and select Generate.
4. Wait for status polling to complete and confirm the returned clip renders in the stage player.
5. Repeat with the same prompt on `Anam live session` for quality comparison.

## Refresh Local Shared Credentials

1. Update `../oss/.env` with the shared account values.
2. Project only the needed values into `avatar/.env`.
3. Keep `avatar/.env` ignored and local.
4. Run `pnpm typecheck` and `pnpm build` after changing runtime config behavior.

## Missing Anam Key

Symptom: the console shows provider readiness is incomplete or `/api/anam-session` returns a missing provider environment error.

Action:

1. Add `ANAM_API_KEY` to local or deployment secrets.
2. Confirm at least one configured persona ID is present.
3. Restart the dev server or redeploy so the server process reads the new environment.
4. Retry the session start.

## Invalid Anam Key

Symptom: `/api/runtime` reports `hasAnamApiKey: true`, but `/api/anam-session` returns an Anam auth error such as `Invalid API key`.

Action:

1. Treat this as an account credential issue, not an app wiring issue.
2. Generate or copy a real Anam API key from the owning Anam account.
3. Replace `ANAM_API_KEY` in local `.env` and deployment secrets.
4. Redeploy or restart the server process.
5. Re-run the live session broker smoke test.

## ElevenLabs Signed URL Failure

Symptom: `/api/anam-session` reports an ElevenLabs signed URL failure.

Action:

1. Confirm `ELEVENLABS_API_KEY` or upstream `ELEVEN_LABS_API_KEY` is populated.
2. Confirm `ELEVENLABS_AGENT_ID` points to an active Conversational AI agent with credits available.
3. Confirm the account has access to Conversational AI signed URLs.
4. Retry from the console and check provider trace IDs in the UI.

## Boson Generation Failure

Symptom: `/api/boson-video` or `/api/boson-video/{videoId}` returns provider errors.

Action:

1. Confirm `BOSON_API_KEY` is valid for the free preview account.
2. Confirm `assets/avatars/live` contains at least one PNG, JPG, or WEBP file.
3. Keep prompts short and plain while preview limits are active.
4. Retry generation and confirm polling reaches `completed` before requesting content.

## Telemetry Check

1. Confirm `POSTHOG_API_KEY` plus `POSTHOG_HOST` or `AMPLITUDE_API_KEY` are present.
2. Run the app locally or in deployment.
3. Start and stop a session or trigger a client event.
4. Confirm the server logs `[avatar-agent.telemetry]`.
5. Check the configured analytics workspace for events named `avatar.*`.

## Live Deployment Smoke Test

Current production domain: `https://avatar.jami.studio`.

1. Open `https://avatar.jami.studio` and confirm the page title is `Avatar Agent`.
2. Request `https://avatar.jami.studio/api/runtime` and confirm readiness flags only are returned.
3. Post a safe event to `https://avatar.jami.studio/api/telemetry` and confirm `{ "ok": true }`.
4. Post `{}` to `https://avatar.jami.studio/api/anam-session`.
5. Treat a returned `sessionToken` as success and do not log it.
6. If the session call returns Anam `Invalid API key`, replace the Anam credential before changing app code.

## Deployment Secret Setup

1. Add the same app-local variable names from `.env.example` to the deployment provider.
2. Do not add `../oss/.env` wholesale to deployment.
3. Keep Google Vertex variables empty until the `jamie@yrka.io` lane is ready.
4. Set `PUBLIC_APP_URL=https://avatar.jami.studio` for production.
5. Build with `pnpm build`.
6. Run the runtime endpoint and confirm it returns readiness flags only, never secret values.

## Key Rotation

1. Rotate the provider key in the owning account dashboard.
2. Update `../oss/.env` if it is a shared account credential.
3. Update `avatar/.env` or deployment secrets with the new value.
4. Restart the process or redeploy.
5. Run a session start and confirm telemetry events still flow.
