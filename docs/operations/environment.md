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
and host secret storage to the agent ID supplied for `My Agent`; do not commit the ID.

## Required For Anam Live Surface

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

## Required For Boson Higgs Preview

- `BOSON_API_KEY`

Optional tuning:

- `BOSON_TTS_MODEL` (defaults to `higgs-tts-3`)
- `BOSON_VIDEO_SIZE` (`640x640` | `640x480` | `480x640`, defaults to `640x640`)

Boson preview reads avatar still images from `assets/avatars/live` and exposes those as selectable
comparison assets in the console.

Named persona IDs can be configured with `AVATAR_PERSONA_KEYS` plus matching variables. For
example, `AVATAR_PERSONA_KEYS=MEGAN,SARAH,ALEXIS` tells the server to read `MEGAN`, `SARAH`,
and `ALEXIS` as Anam avatar/persona IDs and expose only friendly labels to the browser. The
server reuses `ELEVENLABS_AGENT_ID` unless a persona-specific `<KEY>_ELEVENLABS_AGENT_ID` is set.

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
