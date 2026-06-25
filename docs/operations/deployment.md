# Deployment

Date: 2026-06-25
Status: Active

The production Vercel deployment is live at `https://avatar.jami.studio`.

## Current Readiness

- Page reachability: healthy.
- Runtime endpoint: healthy and returns non-secret readiness flags.
- Telemetry endpoint: healthy and accepts safe lifecycle events.
- ElevenLabs signed URL account check: healthy.
- Anam session token broker: blocked by Anam `Invalid API key` until the deployment secret is replaced with a valid Anam API key.

## Production Secrets

Use the app-local names from `.env.example` in Vercel. Do not import the full upstream `../oss/.env` file.

Required for live avatar sessions:

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `PUBLIC_APP_URL`

Configured support lanes:

- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
- `AMPLITUDE_API_KEY`
- `OTEL_SERVICE_NAME`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`

Deferred lanes:

- Sentry project configuration unless this repo gets a dedicated Sentry project.
- Google Vertex/Gemini for `jamie@yrka.io`.
- OpenAI, Anthropic, and xAI unless a later provider stream consumes them.

## Redeploy Checklist

1. Update Vercel project secrets.
2. Redeploy the production project.
3. Check `/api/runtime` for readiness flags.
4. Post a safe smoke event to `/api/telemetry`.
5. Post to `/api/anam-session` and verify a session token is returned without logging the token.
