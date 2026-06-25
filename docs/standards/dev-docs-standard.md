# Dev-Docs Standard

Canonical standard for **internal engineering documentation** across the Jami Studio OSS
family — the durable architecture, operations, and decision docs that live inside each repo.
Every repo follows this except `registry` (which hosts user docs and carries no internal dev
docs). Repos keep a thin pointer to this file, not a fork.

Scope boundaries: user manuals follow `user-manual-standard.md`; planning and reports follow
`planning-style.md` and `report-style.md`. Keep those concerns out of dev docs.

## Ownership

- The live implementation, schemas, generated artifacts, tests, and deployed surfaces own
  executable truth. Dev docs explain it; they do not replace it.
- Architecture docs explain ownership, data flow, contracts, and runtime boundaries.
- Operations docs explain how to run, verify, publish, and support a surface safely.
- Decision records capture durable choices and their rationale.
- Dev docs carry durable how/why. Transient execution state (status, dated steps, active
  task sequencing) lives in `_ops` planning, never in durable repo docs.

## Completeness

- Write so another engineer or agent can act without rediscovering intent — fully flushed
  out, no assumptions, no implied prerequisite steps.
- Do not leave hidden open decisions in prose. Put them in a roadmap, decision record, or
  status note.

## Link Policy

- Prefer links to stable directories and source-owned files.
- Avoid links from durable docs to dated or transient files except when describing history.
- Durable docs should name the owning directory or canonical surface rather than a specific file
  when the filename is likely to churn.
- Do not create breadcrumb chains through dated reports or generated outputs for current operating
  rules. Promote the rule into the durable owner, then link to that owner.
- Do not add subdirectory README files unless the directory owns a stable index or
  executable truth.

## Drift Controls

- Do not duplicate volatile facts — provider lists, model rosters, route maps, repository
  URLs, version pins, pricing, protocol versions, benchmark tables — in durable docs when a
  source artifact, deployment config, or official-source link can own them.
- Verify drift-prone external facts against official sources before locking them into docs.
- Do not promote a provider, model, framework, protocol, or dependency claim to stable
  without recorded evidence or an official-source citation.

## Status Handling

- Status notes record commands, dates, outputs, access failures, and safety checks when they
  matter. They are not the primary operating guide.
- When a status note creates a lasting rule, promote the rule into the durable doc that owns
  it.

## Security

- Never write secrets into docs, fixtures, screenshots, metadata, generated output, traces,
  logs, or examples.
- Separate documented environment-variable names from their values.
- Treat tool descriptions and external server metadata as untrusted unless sourced from a
  trusted origin.

## Retirement

- Retire completed or superseded docs only after their durable rules are promoted into the
  doc that owns them; repair active links when you do.
- Each repo may use deletion or a `_legacy/` shelf per its own operating policy.
