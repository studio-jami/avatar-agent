# Avatar Agent

Avatar Agent is the public repository for Jami Studio's real-time avatar interaction layer.
The project starts as an internal development surface for testing avatar UX, voice, and
agent-access workflows, then grows into reusable SDK and product integration pieces for
Jami Studio surfaces.

The core idea is intentionally narrow: the avatar is the interaction layer, not the owner of
every account integration. Tool calls, account access, planning systems, and subagents should
stay behind clean access streams and adapter boundaries so the visual/avatar layer can remain
portable across providers and products.

## Project Shape

- `docs/architecture/` - durable architecture and boundary docs.
- `docs/operations/` - runtime setup, environment, observability, and deployment notes.
- `docs/research/` - brainstorms, feasibility reports, and source research.
- `docs/decisions/` - durable decision records once choices are accepted.
- `docs/standards/` - local Jami Studio standards for this repo.
- `.changes/` - changelog fragments for production-meaningful changes.
- `assets/avatars/` - curated public avatar assets only. Do not commit staging media or private assets.

## Operating Principles

- Keep the public repo simple, modular, and provider-adaptable.
- Use official SDKs and protocol guidance where available.
- Prefer OpenTelemetry-style emit points and exporter configuration over provider-specific
  observability logic in product code.
- Keep secrets in host secret stores or local gitignored `.env` files; commit names only in
  `.env.example`.
- Do not add self-blocking gates, bespoke compliance scripts, or restrictive abstractions before
  the product surface needs them.

## Current Status

The initial feasibility recommendation is accepted: build the complete greenfield Anam SDK +
server-side ElevenLabs working surface, with provider keys kept server-side, telemetry wired by
configuration, and the access layer held behind clear boundaries for later full-account workflows.
