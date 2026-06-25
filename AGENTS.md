# Agent Rules For Avatar Agent

Avatar Agent is the public Jami Studio repo for the realtime avatar interaction layer.
Keep the repo simple, modular, public-safe, and provider-adaptable.

## Source Of Truth

1. Live code, configuration, and generated artifacts once they exist.
2. Durable repo docs under `docs/architecture/`, `docs/operations/`, and `docs/decisions/`.
3. Feasibility reports and brainstorms under `docs/research/`.
4. Local repo standards in `docs/standards/`.

Never treat a brainstorm or feasibility report as implemented behavior unless the code proves it.
Follow `docs/standards/` for repo docs, reports, plans, and source-of-truth handling.

## Repo Rules

- The avatar is an interaction layer, not the owner of account integrations or heavy agent work.
- Keep account access, tools, subagents, and long-running work behind clean access streams and adapter seams.
- Use official SDKs, APIs, and open protocols where they exist. Do not hand-roll provider protocols.
- Keep provider choices swappable by configuration. Do not hardcode one avatar, voice, realtime model, analytics vendor, or deployment target as the permanent default.
- Keep secrets out of tracked files. `.env.example` lists names only; real values live in local `.env` or the host secret store.
- Do not commit staging media, private avatars, screenshots with sensitive data, logs, traces, transcripts, or generated residue.
- `assets/avatars/` contains only curated public avatar assets.
- This is greenfield work: implement complete working surfaces end to end, with docs, operations, changelog, and verification in parity. Do not leave deliberately partial surfaces that create drift.
- Do not add self-blocking gates, bespoke compliance scripts, or restrictive abstractions before the product surface needs them.

## Docs And Changelog

- Follow the shared dev-docs, planning, report, and source-truth standards from `docs/standards/`.
- Research and feasibility reports live in `docs/research/`.
- Durable decisions live in `docs/decisions/` after acceptance.
- Add a `.changes/` fragment for production-meaningful docs, code, CI, security, operations, package, or public behavior changes.
- Keep fragments short and factual. Add aggregation only when release cadence needs it.

## Verification

- Validate the complete working surface affected by the change, including docs and runtime behavior when code exists.
- When code exists, add project-local commands here instead of relying on global assumptions.
- For docs-only work, validate Markdown diagnostics and review the changed files.
- Before closeout, confirm no secrets or private assets are staged.
