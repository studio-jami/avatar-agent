# User-Manual Standard

Canonical standard for **end-user product documentation** (user manuals, guides, tutorials,
install/setup, and SDK/CLI/contract reference) across the Jami Studio OSS family. It is one
general contract covering **both** registry items and standalone products; product-specific
detail is extracted to each repo's `AGENTS.md` or repo dev docs rather than forked here, so
there is one source and minimal cross-drift. A separate per-product standard is created only
if contents genuinely demand it.

Scope boundaries: internal engineering docs follow `dev-docs-standard.md`; planning and
reports follow `planning-style.md` and `report-style.md`.

## Where User Manuals Live

- **Registry items** (Jami Agent Harness, Studio UI, Orchestra): user manuals publish through
  the single `registry` docs host (`registry.jami.studio/docs`). The product repo does not
  keep its user manuals; the canonical source flows outward to `registry`.
- **Standalone products** (Intercal, Collectiva): self-own their landing page and user
  manuals as their own site, not via `registry`.
- **Marketing** (`jami.studio`) carries no user manual; status and how-to belong in docs, not
  marketing copy.

## Hosting

- Mintlify is the documentation host throughout — every user-manual surface (registry-hosted
  or standalone) uses Mintlify with a `docs.json` owning IA, nav, and branding. New OSS
  products follow the same Mintlify flow.
- Keep page paths compatible with `docs.json`; avoid a top-level `api` folder (Mintlify
  reserves that route). Maintain stable canonical URLs.
- Broken-link checks pass (zero) and the site renders before publish.

## One Canon, One Source

- User manuals flow from a single canonical source — the owning product's accepted contracts
  and source docs — and are generated or published outward, never hand-forked across
  surfaces. The same guidelines and expectations are baked into that source.
- Generated content carries enough metadata to identify its source contract, generation time,
  generator version, and verification state.

## Completeness And Honesty

- A reader must be able to accomplish the documented task from the docs alone — install,
  configure, and build the first real thing — with no assumed prior steps. Fully flushed out;
  no `TODO`, "coming soon", or placeholder copy in shipped manuals.
- Customer-visible claims match actual behavior. Document only verified behavior — e.g.,
  Harness and Studio UI expose a Developer Reference (SDK · CLI · Contracts), not a fabricated
  REST API. Examples are real, not mocked.

## Drift And Security

- Do not duplicate volatile facts (versions, pricing, routes, provider lists) in manuals;
  point to the source artifact or official docs. Verify drift-prone facts before publishing.
- Never put secrets in docs, examples, or generated output. Publishable analytics IDs are
  read from env per the active plan; never commit a private or secret token.

## Repo-Specific Detail Stays In The Repo

Product naming, IA/nav layout, page paths, install commands, and any per-product manual
convention live in that product's `AGENTS.md` or repo dev docs — not in this standard. This
file is the shared contract; the specifics are extracted to keep it general and drift-free.
