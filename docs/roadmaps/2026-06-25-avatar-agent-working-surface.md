# Avatar Agent Working Surface Implementation Plan

Date: 2026-06-25
Status: Implemented in repo foundation pass
Source reports: `docs/research/2026-06-25-avatar-agent-feasibility.md`
Owner: Jami Studio
Surface: `apps/web/`, `docs/operations/`, `.changes/`

## Purpose

Deliver the accepted greenfield Anam SDK + server-side ElevenLabs working surface end to end,
with runtime configuration, telemetry hooks, documentation, changelog, and verification in parity.

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked or requires operator action

## Source Findings

- [x] Anam's server-side ElevenLabs path keeps API keys server-side and lets the browser use the normal Anam client session token.
- [x] The repo has curated public avatar assets under `assets/avatars/`.
- [x] Local standards live under `docs/standards/`.
- [x] Live provider verification requires operator-provided `ANAM_API_KEY`, `ANAM_AVATAR_ID`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_AGENT_ID`.

## Locked Decisions

- [x] Build the first working surface as a Next.js app under `apps/web/`.
- [x] Keep provider keys server-side and return only short-lived client session tokens.
- [x] Keep telemetry provider-agnostic at emit sites.
- [x] Do not add MCP/A2A/LiveKit/Pipecat until a consuming access-stream implementation needs them.

## Scope Boundaries

- [x] Public repo tracks env names, docs, app code, and curated assets only.
- [x] No private recordings, transcripts, provider exports, or secrets are tracked.
- [x] Browser client tools are not assumed for the Anam server-side ElevenLabs path.

## Repo Guidance

- [x] Follow `docs/standards/`.
- [x] Add changelog fragments for production-meaningful changes.
- [x] Verify the complete working surface with typecheck and build.

## Target Repository Shape

- [x] Root pnpm workspace.
- [x] `apps/web/` Next.js app.
- [x] Server-side provider broker route.
- [x] Runtime readiness route.
- [x] Safe telemetry route and server event seam.
- [x] Avatar console UI with video, controls, transcript, status, errors, and provider trace.
- [x] Operations docs for local development.

## Cross-Stream Dependency Map

- [x] Env names and provider broker enable the avatar UI.
- [x] Runtime readiness enables actionable local setup states before live credentials are present.
- [x] Telemetry seam enables later exporter integration without changing UI call sites.

## Workstream 1: Web App Foundation

Goal: Create the buildable app shell and workspace commands.

Depends on:

- [x] Repo foundation and local standards.

Enables:

- [x] Provider broker and avatar UI.

Primary areas:

- `package.json`
- `pnpm-workspace.yaml`
- `apps/web/`

Implementation tasks:

- [x] Add package metadata and scripts.
- [x] Add Next.js app config and TypeScript config.
- [x] Add global UI styling.

Exit criteria:

- [x] Workspace can install, typecheck, and build.

Suggested verification:

- `pnpm typecheck`
- `pnpm build`

## Workstream 2: Provider Broker

Goal: Mint live Anam sessions from ElevenLabs signed URLs without exposing provider keys to the client.

Depends on:

- [x] Web app foundation.

Enables:

- [x] Avatar UI live connection.

Primary areas:

- `apps/web/app/api/anam-session/route.ts`
- `apps/web/app/lib/provider-session.ts`
- `apps/web/app/lib/server-env.ts`

Implementation tasks:

- [x] Validate required env values server-side.
- [x] Request ElevenLabs signed URL for the configured agent.
- [x] Request Anam session token with `elevenLabsAgentSettings`.
- [x] Return only client-safe session token and non-secret trace metadata.

Exit criteria:

- [x] Route builds and fails with actionable errors when env is missing.

Suggested verification:

- `pnpm typecheck`
- `pnpm build`

## Workstream 3: Avatar Console

Goal: Provide the usable operator surface for starting, stopping, viewing, and diagnosing a live avatar session.

Depends on:

- [x] Provider broker.

Enables:

- [x] Internal avatar workflow testing.

Primary areas:

- `apps/web/app/ui/avatar-console.tsx`
- `apps/web/app/globals.css`

Implementation tasks:

- [x] Add runtime readiness check.
- [x] Add start/stop controls.
- [x] Stream Anam video into the page.
- [x] Accumulate transcript chunks.
- [x] Display status, errors, and provider trace metadata.

Exit criteria:

- [x] UI builds and can attempt a live session when credentials are configured.

Suggested verification:

- `pnpm typecheck`
- `pnpm build`

## Workstream 4: Telemetry And Operations

Goal: Provide safe telemetry hooks and runnable development docs.

Depends on:

- [x] Avatar console.

Enables:

- [x] Provider latency/error/cost inspection during live testing.

Primary areas:

- `apps/web/app/api/telemetry/route.ts`
- `apps/web/app/lib/server-telemetry.ts`
- `docs/operations/development.md`
- `.changes/`

Implementation tasks:

- [x] Add client lifecycle event route.
- [x] Add server telemetry seam.
- [x] Document local run commands and runtime shape.
- [x] Add changelog fragment.

Exit criteria:

- [x] No secrets are logged by default; telemetry records safe lifecycle metadata.

Suggested verification:

- `pnpm typecheck`
- `pnpm build`

## Final Verification And Closeout

- [x] Run `pnpm install`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm build`.
- [x] Confirm Markdown diagnostics are clean.
- [x] Confirm no populated secrets are tracked.
- [ ] Commit and push intentional changes.

## Acceptance Criteria

- [x] The repo has a complete buildable web surface for the accepted Anam + ElevenLabs path.
- [x] Provider keys stay server-side.
- [x] UI supports runtime readiness, start, stop, transcript, status, error, and provider trace states.
- [x] Telemetry hooks exist without vendor lock-in at emit sites.
- [x] Docs, changelog, and implementation stay in parity.
- [!] Live provider session is verified after operator credentials are available locally or in deployment.

## Implementation Order

1. [x] Workspace and app foundation.
2. [x] Provider broker.
3. [x] Avatar console.
4. [x] Telemetry and docs.
5. [x] Install dependencies and verify build.
6. [ ] Commit and push.

## Expansion Track

- Add a production deployment target for `avatar.jami.studio`.
- Add access-stream integration once its owning system is selected.
- Add OpenTelemetry exporter configuration when the deployment host is chosen.
- Add LiveKit/Pipecat only when the owned realtime supervisor becomes the active implementation surface.
