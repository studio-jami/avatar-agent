# Environment

Copy `.env.example` to `.env` for local development. Keep real values in `.env` or the
host secret store only.

## Required For ElevenLabs Direct Agent

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

Optional display metadata:

- `ELEVENLABS_AGENT_NAME` (defaults to `ElevenLabs agent`)

The direct agent surface uses the server-side `/api/elevenlabs-session` route to exchange
`ELEVENLABS_API_KEY` plus `ELEVENLABS_AGENT_ID` for a short-lived conversation token, then starts
the browser SDK with WebRTC. For the current deployment lane, set `ELEVENLABS_AGENT_ID` in local
and host secret storage to the current ElevenLabs agent ID; do not commit the ID.

## Required For Anam Live Surface

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

The Anam live surface uses the server-side ElevenLabs agent integration. `ANAM_AVATAR_ID` must be
an Anam avatar ID for the Anam account that owns `ANAM_API_KEY`; do not put a stateful Anam
persona ID in this field.

Optional display metadata:

- `AVATAR_PERSONA_NAME` (defaults to `Jami Studio`)
- `ELEVENLABS_VOICE_ID` (kept for account traceability; not required by the current broker)

Advanced multi-avatar deployments can use `AVATAR_AGENT_PRESETS` as a JSON array of objects with
`id`, `label`, `avatarId`, and `agentId`. Keep the simple `ANAM_AVATAR_ID` path as the default
unless production needs multiple selectable avatars.

The runtime also accepts upstream `ELEVEN_LABS_API_KEY` when projecting shared account values
from `../oss/.env`, but deployment secrets should prefer the app-local `ELEVENLABS_API_KEY` name.

## Optional Provider Keys

Model and computer-use providers are optional until a specific implementation stream consumes
them. Use the shared Jami Studio account-level env registry in `../oss/.env.example` as the
cross-repo naming reference.

Google Vertex/Gemini is intentionally deferred until the `jamie@yrka.io` lane is ready. Do not
block the current ElevenLabs credit lane on those provider keys.

## Configured Account Values

See `account-configuration.md` for the current local projection from `../oss/.env`, including
PostHog, Amplitude, and Datadog/OTLP-derived settings.

## Public Repo Rules

- Commit variable names only.
- Do not commit real keys, signed URLs, transcripts, recordings, private account identifiers,
  or generated media from provider experiments.
- If a new provider is added, update `.env.example` and this doc in the same change.
