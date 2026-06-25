# Observability

Date: 2026-06-25
Status: Initial operations guidance

Avatar Agent should emit telemetry through OpenTelemetry-compatible APIs once code exists.
Exporters are configuration, not product logic. This follows the Jami Studio platform-adapter
direction: emit once, route to Sentry, PostHog, Amplitude, Google Analytics, or another backend
without changing call sites.

## Initial Backends

- Sentry: errors, traces, session replay-on-error, and performance spans. The OSS-family account has an active Sentry allocation documented upstream in `../oss/_ops/admin/programs/vendors/`.
- PostHog: product analytics, feature usage, session replay where appropriate, and AI observability if useful.
- Amplitude: product analytics and experiment/engagement analysis where it has better workflow fit.
- OpenTelemetry: the emit seam and collector/exporter standard. Prefer this over vendor-specific calls in shared product code.

## Event Families To Capture Later

- Avatar session lifecycle: requested, started, connected, interrupted, stopped, failed.
- Provider bridge health: session-token mint latency, signed-url failures, WebRTC connection failures.
- Conversation quality signals: turn latency, barge-in, interruption, fallback-to-text, user stop.
- Agent-access stream: dispatch started, background run attached, progress narrated, result surfaced.
- Cost/debug metadata where providers expose it, such as request IDs, trace IDs, and generation-cost headers.

## Secret Handling

Use `.env.example` for variable names only. Real values belong in local `.env`, deployment secrets,
or the upstream operator secret store. Never commit provider keys, transcripts containing private
data, raw traces, recordings, screenshots, or session logs.
