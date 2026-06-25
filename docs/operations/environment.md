# Environment

Copy `.env.example` to `.env` for local development. Keep real values in `.env` or the
host secret store only.

## Required For Accepted Provider Surface

- `ANAM_API_KEY`
- `ANAM_AVATAR_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

## Optional Provider Keys

Model and computer-use providers are optional until a specific implementation stream consumes
them. Use the shared Jami Studio account-level env registry in `../oss/.env.example` as the
cross-repo naming reference.

## Public Repo Rules

- Commit variable names only.
- Do not commit real keys, signed URLs, transcripts, recordings, private account identifiers,
  or generated media from provider experiments.
- If a new provider is added, update `.env.example` and this doc in the same change.
