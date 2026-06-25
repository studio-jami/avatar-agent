# Account And Provider Flow

Date: 2026-06-25
Status: Active

Avatar Agent keeps account credentials outside the public repository and uses server-side provider brokers for every secret-bearing operation.

## Runtime Flow

1. The browser loads `/api/runtime` and receives non-secret readiness flags.
2. The user starts a session from the avatar console.
3. The browser posts selected `avatarId` and `agentId` to `/api/anam-session`.
4. The server reads provider credentials from local or host environment variables.
5. The server asks ElevenLabs for a short-lived Conversational AI signed URL.
6. The server asks Anam for a short-lived session token using the avatar ID and ElevenLabs agent settings.
7. The browser receives only the Anam session token, selected IDs, and non-secret provider trace IDs.
8. The browser streams the avatar session through the Anam SDK.
9. Client and server lifecycle events post to `/api/telemetry`, which forwards safe events to configured analytics accounts.

## Credential Boundaries

- `/oss/.env` is the upstream local account credential source for shared Jami Studio services.
- `avatar/.env` is the local app projection used by this repo and is never committed.
- Deployment secret stores receive the same variable names as `avatar/.env`.
- Public docs and examples carry variable names only.

## Provider Responsibilities

- Anam owns realtime avatar session media and session tokens.
- ElevenLabs owns Conversational AI agent credits, voice behavior, and signed URLs.
- PostHog and Amplitude receive safe lifecycle/product events through the server telemetry route.
- Datadog/OTLP is configured through environment variables for the deployment/runtime exporter lane.
- Google Vertex for `jamie@yrka.io` is intentionally deferred and should be added as a separate provider lane when that account is ready.

## Alias Policy

The runtime accepts the app-local names and a few upstream aliases so shared account values do not need to be duplicated by hand:

- `ELEVENLABS_API_KEY` or upstream `ELEVEN_LABS_API_KEY`
- `POSTHOG_API_KEY` or upstream `POSTHOG_KEY`

Keep app docs centered on the app-local names. Use aliases only to consume upstream account sources cleanly.
