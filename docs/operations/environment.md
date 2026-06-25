# Environment

Copy `.env.example` to `.env` for local development. Keep real values in `.env` or the
host secret store only.

## Required For Accepted Provider Surface

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

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
