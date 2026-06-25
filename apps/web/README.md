# Avatar Agent Web

Next.js implementation of the accepted Avatar Agent working surface.

## Surface

- Server-side ElevenLabs signed URL and Anam session token broker.
- Anam SDK video session client.
- Start/stop controls, transcript stream, status, error, and provider trace UI.
- Runtime readiness endpoint and safe telemetry event route.
- Server-side forwarding for safe lifecycle events to configured PostHog and Amplitude accounts.

Run from the repo root with `pnpm dev` after installing dependencies and filling `.env`.
See `../../docs/operations/runbooks.md` for provider and telemetry operations.
