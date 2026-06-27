# Avatar Agent Web

Next.js implementation of the accepted Avatar Agent working surface.

## Surface

- Server-side ElevenLabs signed URL and Anam session token broker.
- Boson Higgs video broker (create/status/content proxy) for free-preview quality checks.
- Anam SDK video session client.
- Start/stop controls, transcript stream, status, error, and provider trace UI.
- Provider selector for Anam live vs Boson generated clip comparisons.
- Runtime readiness endpoint and safe telemetry event route.
- Server-side forwarding for safe lifecycle events to configured PostHog and Amplitude accounts.

Run from the repo root after installing dependencies and filling `.env`.
See `../../docs/operations/commands.md` for the single run/build/verify command reference.
See `../../docs/operations/runbooks.md` for provider and telemetry operations.
