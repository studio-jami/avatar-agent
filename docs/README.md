# Avatar Agent Docs

Durable documentation lives here. Keep current operating rules in the owning doc, not in
dated reports or brainstorms.

## Sections

- `architecture/` - runtime boundaries, provider seams, and system shape.
- `operations/` - local environment, monitoring, observability, deployment, and release notes.
- `decisions/` - accepted decisions and their rationale.
- `research/` - brainstorms, feasibility reports, and source research.

Shared Jami Studio documentation standards live in `../oss/_ops/planning/standards/` from
the workspace root. This repo points to those standards instead of forking them.# Avatar Agent Docs

This directory owns durable repository documentation.

## Structure

- `architecture/` - boundaries, data flow, provider seams, and integration shape.
- `operations/` - local setup, environment, observability, deployment, and changelog operation.
- `research/` - brainstorms, feasibility reports, source audits, and external research.
- `decisions/` - accepted durable decisions.

Shared documentation standards live upstream in the `oss` repo under `_ops/planning/standards/`.
Keep this repo focused on its own durable behavior and link to upstream standards instead of copying them.
