# Account Configuration

Date: 2026-06-25
Status: Active

This repo uses `../oss/.env` as the local upstream credential source for shared Jami Studio accounts, then projects only the variables this app needs into `avatar/.env`.

## Configured Locally

The local `avatar/.env` has been updated from `../oss/.env` where matching account credentials exist.

- ElevenLabs: configured locally for the current agent and credit lane.
- Anam: `ANAM_API_KEY` plus named persona IDs are populated locally; local and production session-token checks pass.
- PostHog: configured locally from the shared Jami Studio account source.
- Amplitude: configured locally from the shared Jami Studio account source.
- Datadog/OTLP: local exporter endpoint and headers were derived from the shared Datadog account fields.
- Vercel: `PUBLIC_APP_URL` is configured for `https://avatar.jami.studio`.

## Still Pending

- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`: set if this repo receives its own Sentry project lane.
- Google Vertex / Gemini provider keys: intentionally deferred until the `jamie@yrka.io` Vertex lane is set up.
- OpenAI, Anthropic, and xAI keys: optional future provider lanes, not required for the accepted Anam plus ElevenLabs surface.

## Local Merge Rule

When refreshing local credentials, copy from the upstream account source by variable identity or documented alias. Do not commit real values.

Preferred app-local names:

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `AVATAR_PERSONA_KEYS`
- named persona variables such as `MEGAN`, `SARAH`, and `ALEXIS`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_AGENT_NAME`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
- `AMPLITUDE_API_KEY`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`

Accepted upstream aliases:

- `ELEVEN_LABS_API_KEY` for `ELEVENLABS_API_KEY`
- `POSTHOG_KEY` for `POSTHOG_API_KEY`

## Account Setup Order

1. Keep using the current ElevenLabs account and agent credits.
2. Keep the verified Anam API key synchronized between `avatar/.env` and Vercel secrets.
3. Keep named persona IDs synchronized between `avatar/.env` and Vercel secrets.
4. Run the local or production provider smoke test after provider secret changes.
5. Configure any future deployment secrets with the same app-local names.
6. Add Google Vertex later as a separate provider lane for `jamie@yrka.io`.
