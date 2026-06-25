# Source-of-Truth Policy

- **Status:** Active (established by WS1, 2026-06-14)
- **Owner:** Jamie
- **Repo:** `studio-jami/oss` — `_ops` tree, branch `main`
- **Authoritative working roadmap:** the unified master roadmap under `planning/oss-vision/roadmaps/`

This is the durable contract for **where each kind of content is canonical** across the
Jami Studio OSS family and how `_ops` relates to the product repos. It outlives any dated
plan: when the roadmap retires, this policy carries the ongoing rules.

## Principle: source of truth is split by content type

Each kind of content has exactly one canonical home. Built/deployed/generated artifacts are
canonical in the **product repo** that builds them. Cross-repo planning, admin, and shared
standards are canonical in **`_ops`**. Product docs are not mirrored into `_ops`; the live
docs site and source docs stay in their owning repos.

## Per-content-type canonical table

| Content type | Canonical home | Notes |
| --- | --- | --- |
| Published Mintlify docs site (pages + `docs.json`) | `registry` | Single docs host; served at `registry.jami.studio/docs`. |
| Harness product prose | `jami-harness/docs/` → published into `registry/harness/*` | Never publish `jami-harness/apps/docs/` evidence as product docs. |
| Studio concept docs + composition/packaging taxonomy | `studio-ui/docs/architecture/*` → published into `registry/*` | Taxonomy doc owned by `studio-ui`. |
| Generated contracts (OpenAPI, SBOM, evidence, `registry.json`, token/CSS/TS output) | the product repo that generates them | Generated artifacts point back to their generating source. |
| Unified working roadmap | **`_ops/planning/oss-vision/roadmaps/master-roadmap.md`** | The master roadmap is the only human-edited working roadmap. Project roadmap views are generated projections; historical hardcopies live under `_legacy/`. |
| CI-checked engineering docs | the owning product repo | Each repo's `docs/engineering/*`. |
| `docs-standards.md` (docs canon) | `registry/docs/engineering/standards/docs-standards.md` | **Stays in repo-land** — not copied into `_ops`. Product repos may keep short pointer files only. |
| Plan + report style guides | **`_ops/planning/_standards/`** | Single shared copy: `planning-style.md`, `report-style.md`. |
| Shared cross-repo research corpus | **`_ops/planning/_research/master/`** | The single corpus home. |
| Cross-repo planning, roadmaps, decisions, research, user-notes | **`_ops/planning/<project>/`** | Per-project planning taxonomy (below). |
| Manual orchestration guidance and history | **`_ops/planning/.orchestra/`** + per-project `.orchestra/` folders | Shared manual prompts/history live at the planning root; per-project folders carry only repo-specific orchestration guidance and logs. |
| Admin (legal, marketing/brand, programs, publishing) | **`_ops/admin/`** | Now versioned (was previously gitignored). |
| `planning/<project>/docs/` or `planning/<project>/*-docs` | not allowed | Product docs belong in the owning product repo; `_ops` stores planning, decisions, research, and admin context. |
| Secret values (private keys, admin tokens, SA JSON, key paths) | gitignored `.env` files by tier | App-specific envs stay in their project roots. OSS-family account-level envs live in protected `_ops/.env`. `.env.example` files are the only tracked env files. Publishable client IDs may appear in documented static/client config. |

## Product docs boundary — and NO cross-repo OS symlinks

- The published Mintlify docs live in `registry`; `_ops` must not carry a copied
  `docs.json`/MDX corpus under `planning/<project>/`.
- Source docs stay in `jami-harness/docs` and `studio-ui/docs`; `_ops` may reference those
  paths from planning docs but does not copy them.
- `node scripts/check-docs-boundary.mjs --oss-root <oss-root>` fails CI when a product docs
  corpus appears under `_ops/planning/<project>/docs/` or `_ops/planning/<project>/*-docs`.
- **No committed cross-repo OS symlinks.** A committed symlink to a sibling `_ops/` path does
  not survive `git clone`, so Mintlify / Cloudflare / CI would break. Local-only, gitignored
  convenience junctions for browsing are allowed but are never canonical.

## Roadmap Source Rule

- Agents edit the unified master roadmap at `planning/oss-vision/roadmaps/master-roadmap.md` for
  all project work.
- Per-project roadmap files under `roadmaps/generated/` are generated projections from the master.
- Historical project hardcopies belong under `_legacy/` and must not be hand-maintained as second
  sources for milestone definitions, stable codes, versions, dependencies, or status.
- Do not write generated blocks into historical hardcopy files; that mixes static context with
  machine output and creates more maintenance. The source direction is one-way: master roadmap ->
  generated project views -> Multica or other disposable projections.
- Project roadmaps may keep durable repo-local metadata such as ownership, file areas, commands,
  verified local evidence, and historical context, but those notes must not duplicate or override
  task definitions that belong in the master.

## Durable Link Hygiene

- Durable docs point to stable parent directories or canonical surfaces by default.
- Do not hardcode dated, transient, generated, or session-specific filenames in durable docs unless
  the document is explicitly historical or the file is itself the rare canonical source.
- Avoid breadcrumb chains where a reader must follow multiple stale file links to find the current
  source. A durable doc should name the owning directory/surface and the rule for finding current
  material.

## Per-project planning taxonomy (normalized)

Each project under `_ops/planning/<project>/` uses:

```text
.orchestra/  repo-specific orchestration guidance and subagent logs only
decisions/    durable decision records
research/     project-scoped feasibility reports + research
roadmaps/     generated projection views
user-notes/   captured owner notes
_legacy/      historical hardcopy roadmaps/research/agent docs
user-manuals/ canonical until a repo home is chosen (where present)
```

- Shared manual orchestration prompts, reusable orchestration guidance, and historical
  orchestration logs live under `_ops/planning/.orchestra/`.
- **No `dev/` directory** in the per-project planning taxonomy.
- Per-project `roadmaps/` directories contain generated projections. Agents do not manually update
  milestone definitions there; they update the unified master roadmap and let generated views refresh
  separately.
- Roadmap status is owned by Multica. The committed status snapshot is generated evidence refreshed
  by the roadmap reconciliation workflow on every `main` push and scheduled run; do not write live
  status back into the master roadmap or project roadmap hardcopies.

## Narrow `.gitignore` + env-tier rule

- `_ops/.gitignore` is **narrow**: everything versions (`admin/`, `.agents/` docs,
  `planning/`) **except** real secrets and machine-local scratch.
- Secrets live only in gitignored `.env` files. App-specific envs stay in the owning project root
  as expected. OSS-family account-level envs, operator tokens, and cross-repo access keys live in
  protected `_ops/.env`, with `_ops/.env.example` carrying names only. `git status` must never show
  `.agents/.env` or `_ops/.env`, and neither is staged or committed.
- Do not delete unknown or candidate-removal env values during cleanup. Move them to a dated
  `## [QUARANTINE]` section at the bottom of the same gitignored file with a short reason, then
  remove only after explicit owner approval.
- PostHog `phc_*`, GA4 `G-*`, and Cloudflare Web Analytics beacon tokens are
  client-publishable IDs. Keep their canonical record in gitignored `.env`, but allow them
  in tracked client/static integration config where the platform requires literal
  publishable IDs. No private/secret token or service-account JSON is ever tracked.
- `.agents/temp_inspect_sheet.py` reads the gcloud key path from `GCLOUD_SA_KEY_FILE` (set in
  `.agents/.env`); the key path is never hardcoded.
- The nested repo `admin/programs/registry-log/` (remote
  `github.com/studio-jami/orchestrator-logs`) is gitignored here so it is managed only by its
  own remote, not embedded in this index.

## Per-repo standards / agent-doc de-dup

The plan/report style guides now live only under `_ops/planning/_standards/`, and shared manual
orchestration guidance/history lives under `_ops/planning/.orchestra/`. Product repos do not keep
local agent folders or plan/report standard pointer files. `docs-standards.md` intentionally stays
canonical in repo-land, consolidated in `registry`, not `_ops`.

## Research-corpus de-dup (confirmed)

The owner's de-dup (2026-06-13) is verified: there is no duplicated `research/master/` tree.
Project-scoped research lives under `planning/<project>/research/`;
`_ops/planning/_research/master/` is the single home for any shared cross-repo corpus.
