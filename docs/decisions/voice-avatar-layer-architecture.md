# Decision Record — Realtime Voice / Avatar Layer Architecture

Date: 2026-08-19
Status: Superseded — canonical copy moved to `jamesnavinhill/luna-avatar`

> ⚠️ The canonical home for this record is now
> [`luna-avatar/docs/decisions/voice-avatar-layer-architecture.md`](https://github.com/jamesnavinhill/luna-avatar/blob/main/docs/decisions/voice-avatar-layer-architecture.md).
> It was moved on 2026-08-19 when the voice/avatar layer became its own repo. This repo
> (`avatar-agent`) stays as the public web console / demo. Do not edit the architecture
> decisions here; edit the copy in `luna-avatar`.

## Purpose

Lock the durable shape of the realtime voice/avatar layer (the "Luna home" — a floating,
always-on widget with wake word, video feed, and voice) and its relationship to the Luna
agent harness, the Agency Gateway, and the other apps/agents/tools in the workspace.

This record is the single source of truth for boundary questions. Working notes and
source audits support it; they do not replace it. See
[`../research/elevenagents-tools-and-luna-bridge.md`](../research/elevenagents-tools-and-luna-bridge.md)
for the verified provider findings that underpin D2–D4.

## Locked decisions

### D1 — Luna is the single brain; the avatar layer is a transport, not a brain

Luna (the `eve` agent project) owns all tools, subagents, connections, memory, schedules,
and durable streaming. The voice/avatar layer owns only realtime media (Anam video,
ElevenLabs voice), the floating-widget UX, and the bridge that reaches Luna.

This matches the boundary already declared in `docs/architecture/overview.md` ("the avatar is
the interaction layer, not the owner of every account integration, tool call, planning system,
or subagent"). The current avatar-agent code has drifted past that boundary by hand-rolling a
second tool registry (`access-stream.tools.json` + the `/api/access-stream` route); D5 retires
it.

Rationale: two brains under development in parallel is the fork that produces every
"why does this CRM lookup exist in two places" problem. One brain, one set of durable rules,
one memory store.

### D2 — One memory/knowledge store, many seams

There is a single underlying memory/knowledge store owned by the harness. Every consumer
reaches it through a seam, never through its own knowledge base:

- **Luna (harness)**: full read/write via memory tools + dynamic-instruction injection.
- **ElevenLabs voice agent**: a narrow tool surface (read memory, write memory). It is a *door*,
  not a brain.
- **admin / elements / other apps & agents**: the same tools via the HTTP/MCP seam.

Store shape: Neon Postgres + `pgvector` for structured facts plus vectors. This reuses the Neon
home already in use by `gardens` and `luna`, and matches eve's canonical
multi-tenant-memory pattern (`eve-source-code/docs/patterns/multi-tenant-memory.md`).

Memory/knowledge tiers (to be declared before the store is built, per the Luna handoff warning
against ambiguous ownership):

| Tier | Example | Live-in |
| --- | --- | --- |
| Global | durable preferences, identity facts | Postgres + vector |
| Project | per-project knowledge | Postgres + vector |
| Session/thread | conversation-scoped working memory | `defineState` (`eve/context`) |
| Code index | "where is symbol X" | context pools (LanceDB + gateway Voyage embeddings) |

The code-index pool is already live in Luna (`scripts/context-index.ts`). The other tiers are the
next slice, not a second parallel system.

### D3 — ElevenLabs ↔ Luna bridge is MCP-on-MCP; streaming updates flow back through the widget

ElevenLabs (ElevenAgents) natively attaches **MCP servers**. Luna natively *is* one via
`mcpChannel` (`agent_start` / `agent_get` / `agent_update` / `agent_cancel`). The bridge is
therefore:

1. **Command path**: the ElevenLabs voice agent calls Luna through an ElevenLabs **MCP tool**
   pointing at Luna's `mcpChannel`. ElevenLabs runs the MCP client; Luna runs the durable turn;
   the result returns as the tool result for the voice to read out.
2. **Progress path (streaming updates)**: the floating widget holds **both** sessions — the
   ElevenLabs session (`@elevenlabs/react`) and the Luna session (`useEveAgent` / the eve Client
   SDK). It watches Luna's durable NDJSON stream and injects concise milestones back into the live
   ElevenLabs conversation using `sendContextualUpdate(text, { contextId })` (and, when the voice
   agent should be actively steered, `sendUserMessage(text)`).

The voice never blocks on Luna and Luna never blocks on the voice: Luna runs in its own durable
session; the widget only relays milestones. This is the "local store / queue separation layer"
from `docs/user-notes/planning.md`, made concrete.

Alternative transports (webhook tools → Luna's HTTP session API; client tools proxying) remain
available but are secondary to the MCP path.

### D4 — Model selection is per-hop; the gateway traces every hop

Each hop chooses its own model. There is no single "the" model for the whole pipeline:

- **ElevenLabs voice agent** picks its own LLM for personality, turn-taking, and tool selection.
- **Luna** routes through the Agency Gateway's `eve-orchestrator` alias for its general brain,
  and can reach a **specific model** by declaring a subagent with its own model or by pointing a
  tool at a concrete gateway alias.

The routing ladder a surface may use:

```text
direct gateway        → any model alias
harness direct        → Luna root model (eve-orchestrator)
harness intent-router → Luna delegates to a specialist subagent / model
```

The Agency Gateway is the mandatory termination point for every model call, so every hop is
marked (`surface:*` tag) and traced (PostHog / Langfuse / Sentry) regardless of which surface or
route initiated it.

### D5 — Retire the bespoke access-stream registry

The hand-rolled `access-stream.tools.json` + `/api/access-stream` tool registry has no remaining
reason to exist once ElevenLabs attaches Luna's MCP channel directly. Its CRM/ops lookups become
Luna `connections` (MCP or OpenAPI); the voice agent reaches them through the MCP tool.

This is the untard: a second brain-with-tools that duplicates what the harness already owns.
Removing it is what prevents the fork from recurring.

### D6 — The "home" requires a desktop shell (direction noted, not yet built)

An always-on floating widget with system tray, global hotkeys, wake word, and cross-program
usage cannot be delivered by a browser tab (which is all `avatar.jami.studio` is today). It
requires a desktop shell. Direction of record: **Electron** (pure TS/JS, no new toolchain,
most-mature tray/global-shortcut/mic story), with **Tauri v2** noted as the lighter swap if
footprint matters. Wake word: **openWakeWord** (MIT, on-device) as default, Porcupine as the
higher-accuracy alternative — pending a verification pass before either is named final in an
implementation plan.

The existing web console stays as the browser companion surface; the provider-broker and
session logic becomes a shared package (`@jami/avatar-client`) both surfaces import, reusing
`gardens`'s `use-avatar-session` single-ownership hook.

### D7 — Repo shape: one new monorepo; existing repos stay in their lane

The "home" and its shared client logic live in a **new** pnpm monorepo, not inside any
existing repo:

```text
luna-home/                      ← new (jamesnavinhill/, personal operator tool)
  apps/desktop/                 ← Electron shell: tray, wake word, hotkeys, floating voice/video widget
  packages/avatar-client/       ← shared seam: broker client, multi-account config, use-avatar-session
```

- **avatar-agent** stays exactly as-is: the public web console / demo on Vercel
  (`avatar.jami.studio`). Later it consumes `@jami/avatar-client` as a published package instead
  of carrying its own broker/session code — that is what makes D5's retirement mechanical.
- **gardens** stays as the member-facing companion product. Its `use-avatar-session` is the
  inputs for the shared package; converting it into a consumer is its own slice, not now.
- **luna** stays the UI-less brain/harness; the desktop app is a *client of* luna.

Rationale: the "home" is a personal, always-on operator tool; avatar-agent is a public product
repo with a deployed surface; gardens is a member product. Mixing those lifecycles into one repo
recreates the coupling this record removes. Keep one source (the package) with no path-symlink
shims — publish real `@jami/avatar-client`.

### D8 — Provider adapter seams: swap engines, not just accounts

Provider-adaptability at the media layer is a required property, not an afterthought. It is
currently only nominal in code (see D8's "weld" note). The seams to build:

- **Account ≠ provider.** Account = a credential bundle (the gardens multi-account pattern,
  already solved); provider/engine = which voice or video engine runs. They stay orthogonal.
  An account can serve multiple engines; an engine resolves credentials *from* an account.
- **Two broker contracts.** `VoiceSessionBroker` and `VideoSessionBroker`, each with one
  operation: `createSession(input) → { connectionToken, agent, providerTrace }`. One adapter file
  per engine owns that engine's wire shape — the same pattern as `ops-feed` → `lightfield`.
- **One composer.** Replaces the current inline weld where `provider-session.ts` mints an
  ElevenLabs signed URL *then* wraps it inside the Anam session-token request. A video engine and
  a voice engine are two independent axes that must compose, not fuse.
- **Per-provider client driver.** A neutral product state machine
  (`idle/connecting/connected/failed`, normalized transcript, listening/speaking) with one
  driver file per engine translating its events into the normalized shape. Adding an engine =
  adding a driver; nothing above it changes.

Named engines (the only list in scope):

| Axis | Engines |
| --- | --- |
| Voice | ElevenLabs (first), Deepgram |
| Video | Anam (first), Vivix |

- **Deepgram** is a voice/audio platform (STT, TTS, voice agent) — same family as ElevenLabs, so
  it is a `VoiceSessionBroker` adapter.
- **Vivix** is a realtime **video avatar** platform (Realtime Avatar API: TRTC media +
  WSS control channel + source-image avatars with motion). It is a `VideoSessionBroker` adapter,
  same family as Anam. Note: Vivix bundles its own ASR/TTS/LLM pipeline, but its TTS defaults to
  ElevenLabs via `pipeline_config.tts_config` — so it is not a second voice platform.
  Verified against <https://platform.vivix.ai/doc/streaming-avatar/configuration>.
- Google and any other engines are **later and currently unnamed**. Do not design for, commit,
  or hand-roll adapters for engines not in this list until they are explicitly named. Adapter-level
  facts for Deepgram and Vivix (SDK shape, tool relay) are verified at integration time, not
  asserted in advance.

First implementation consequence: the ElevenLabs↔Anam weld in `provider-session.ts` is the first
thing `packages/avatar-client` must separate into the two brokers + composer.

Testing/posture: existing balances make multi-engine dev free to exercise — ElevenLabs and Anam
have ample credits/hours; Deepgram has $200 credit; Vivix has 2M realtime-avatar API credits.
These are allocated accounts, so engine-swap tests may reach the live providers without a
spend-approval gate on top of the standing no-unauthorized-spend rule.

## What this rules out

- A second tool registry / knowledge base living in the voice layer.
- ElevenLabs as a primary work executor; it is a voice surface that delegates.
- A bespoke A2A bridge: eve has no native A2A (ACP, UCP, HTTP session API, and MCP are the
  native surfaces). A2A is deferred until it demonstrates net value.
- Inventing or committing un-named voice/video engines beyond the planning-doc list.

- A second tool registry / knowledge base living in the voice layer.
- ElevenLabs as a primary work executor; it is a voice surface that delegates.
- A bespoke A2A bridge: eve has no native A2A (ACP, UCP, HTTP session API, and MCP are the
  native surfaces). A2A is deferred until it demonstrates net value.

## Sources

- Eve HTTP channel — `eve-source-code/docs/channels/eve.mdx`
- Eve MCP channel — `eve-source-code/docs/channels/mcp.mdx`
- Eve connections (MCP/OpenAPI) — `eve-source-code/docs/connections/overview.mdx`
- Eve remote agents — `eve-source-code/docs/guides/remote-agents.md`
- Eve state (`defineState`) — `eve-source-code/docs/concepts/state.md`
- Eve multi-tenant memory pattern — `eve-source-code/docs/patterns/multi-tenant-memory.md`
- [ElevenAgents overview](https://elevenlabs.io/docs/eleven-agents/overview)
- [ElevenAgents MCP tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp)
- [ElevenAgents hosted MCP](https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp)
- [ElevenAgents tools index](https://elevenlabs.io/docs/eleven-agents/customization/tools)
