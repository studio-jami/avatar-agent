# Avatar Agent Feasibility Report

Date: 2026-06-25
Status: Draft for decision
Request: Set up the public Avatar Agent repository, audit existing research and current provider opportunities, and recommend a simple upstream-first implementation direction.
Source scope: Local README brainstorm, shared Jami Studio standards, master research reports, provider/account docs, and official provider docs available during setup.
Owner: Jami Studio

## Executive Summary

The project is feasible, and the lowest-churn path is to start with an Anam-powered embed/SDK surface connected to an ElevenLabs Conversational AI agent through Anam's server-side ElevenLabs integration. That path gives a working real-time avatar quickly, keeps API keys server-side, avoids browser audio bridging, and matches the current credit/opportunity posture.

The durable architecture should still follow the upstream Jami Studio research: the avatar is a thin interaction layer; tool execution and broad account access belong behind an access stream; realtime transport, realtime model, voice/TTS, observability, and product analytics stay behind provider seams. OpenTelemetry should be the emit standard, with Sentry/PostHog/Amplitude as configured consumers rather than product-owned dependencies.

Do not build LiveKit, Pipecat, MCP, A2A, or a full SDK scaffold before the first working avatar surface needs them. Record their boundaries now, then add them when a consuming implementation stream exists.

## Question Being Answered

What is the simplest public-repo foundation and first implementation shape for a Jami Studio real-time avatar agent that can support internal full-access workflows now and later become a reusable SDK/product integration layer?

## Source Scope And Method

Checked local sources:

- `README.md`, moved to `docs/research/brainstorms/initial-avatar-agent-brainstorm.md`.
- `../oss/_ops/planning/standards/` for dev-docs, planning, report, and source-truth standards.
- `../oss/_ops/planning/research/masters/audits/13-realtime-voice/recommendation.md`.
- `../oss/_ops/planning/research/masters/reports/C-capability-adapters/F11-provider-inference-and-realtime.md`.
- `../oss/_ops/planning/research/masters/reports/B-agent-substrate/F08-transport-and-interop.md`.
- `../oss/_ops/planning/research/masters/reports/B-agent-substrate/F09-ui-registry-and-render-seam.md`.
- `../oss/_ops/planning/research/masters/reports/C-capability-adapters/F13-platform-adapters.md`.
- `../oss/_ops/planning/research/masters/reports/D-distribution-products-ax/F15-agent-discoverability-ax.md`.
- `../oss/_ops/admin/programs/vendors/sentry.md` and `../oss/.env.example` for existing monitoring/account naming posture.

Checked official/current external sources:

- Anam embed overview and Python SDK docs.
- Anam cookbook recipe for server-side ElevenLabs agents.
- ElevenLabs API introduction.
- Google June 24, 2026 Gemini 3.5 Flash computer-use announcement.
- MCP introduction docs.
- OpenTelemetry overview docs.
- Sentry Next.js OpenTelemetry support docs.
- PostHog and Amplitude docs landing pages.

No live provider credentials were used, and no provider integration was executed.

## Current Project State

The repo contained a brainstorm README and curated image assets under `avatars/`. There is no application code, package manifest, deployment target, provider integration, docs system, or release automation yet.

This setup adds a public README, `AGENTS.md`, docs hierarchy, `.env.example`, observability notes, and `.changes/` fragments without adding build gates or implementation scaffolding before a stack is chosen.

## Official / External Findings

Anam offers three web embed options: Widget, Player, and SDK. Widget is a Web Component with events and tool-call support; Player is an isolated iframe; SDK gives direct control over media streams and UI. Anam embed options require HTTPS and microphone access, and SDK/Widget require external JavaScript support.

Anam's Python SDK supports real-time audio/video streaming, typed async APIs, text/audio input, transcripts, audio passthrough, direct text-to-speech, and server-side use. This matters for later backend or media-pipeline experiments, but the first public web surface can start with the JavaScript embed/SDK path.

Anam's server-side ElevenLabs recipe connects the Anam Engine directly to an ElevenLabs Conversational AI agent. The server fetches an ElevenLabs signed URL, creates an Anam session token with `elevenLabsAgentSettings`, and the client uses normal Anam `createClient(...).streamToVideoElement(...)`. Keys remain server-side, browser audio bridging is avoided, latency is reduced versus client-side bridging, and Anam Lab can provide recordings/transcripts. The recipe notes that browser-side client tools are not supported in the server-side integration; server-side tools/webhooks and conversation history work.

ElevenLabs official API docs expose official Node/Python SDKs and generation metadata headers, including character cost, request ID, and trace ID. Those should be captured as telemetry attributes when ElevenLabs calls are made.

Google announced Gemini 3.5 Flash built-in computer use on 2026-06-24, with safety guidance around explicit confirmation for sensitive/irreversible actions, prompt-injection safeguards, sandboxing, human-in-the-loop verification, and access controls. This is relevant to future computer-use providers but should not be mixed into the avatar surface itself.

MCP is an open standard for connecting AI apps to external tools, data, and workflows. It is relevant as an access-layer surface, not as a prerequisite for the initial avatar embed.

OpenTelemetry is vendor-agnostic instrumentation for traces, metrics, and logs. Sentry's Next.js docs state the SDK uses OpenTelemetry under the hood and can pick up emitted spans. PostHog and Amplitude both cover product analytics, replay/visibility, and AI-related product surfaces. The repo should therefore emit standard telemetry and configure exporters/SDKs by environment.

## Industry Standard Shape

The industry-standard shape is a thin realtime interaction layer over a server-owned session broker:

- Client renders avatar media and UX state.
- Server mints short-lived provider sessions and keeps provider keys private.
- Access/tool work happens behind backend tools, MCP, webhooks, or a run manager.
- Observability is emitted through standard traces/events, with provider request/cost metadata attached.
- Provider-specific code lives behind adapters so the surface can move between hosted avatar providers, self-hosted realtime transport, or future S2S models.

## Implementation Options

### Option A: Anam Player Or Widget First

Use Anam's iframe Player or Widget as the first internal surface.

Fits when speed matters most and customization can be limited.
Tradeoffs: fastest path and least code, but Player has limited host-page interaction and Widget/Player are more provider-shaped.
Operational impact: requires Anam account setup, allowed domains for Widget, HTTPS, microphone permission, and env names.
Reversibility: high if wrapped as one provider surface.

### Option B: Anam SDK Plus Server-Side ElevenLabs Agent

Build a small web surface using Anam JS SDK and a server endpoint that mints Anam sessions from ElevenLabs signed URLs.

Fits the brainstorm best: custom UI, transcript handling, server-side keys, lower audio-bridging complexity, and immediate use of ElevenLabs credits.
Tradeoffs: more code than Player/Widget, but still much less than self-hosted realtime infrastructure. Browser client tools are not supported by Anam's server-side ElevenLabs path, so tool access should run server-side through ElevenLabs webhooks or the access stream.
Operational impact: needs `ANAM_API_KEY`, `ANAM_AVATAR_ID`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_AGENT_ID`; later adds observability keys.
Reversibility: high if the session broker is written as a provider adapter.

### Option C: LiveKit/Pipecat Realtime Supervisor

Build the fuller Jami Studio realtime supervisor architecture from the research: self-hostable media transport, realtime model behind LLM adapter, dispatch to harness/access stream, and narration via event replay.

Fits the long-term platform architecture and avoids vendor lock-in.
Tradeoffs: heavier operational scope and not necessary before the first avatar surface proves UX and workflow value.
Operational impact: requires media infrastructure, token minting, worker lifecycle, more observability, and provider eval.
Reversibility: strong long-term architecture, higher initial cost.

### Option D: Open-Weight / Self-Hosted Avatar Model First

Investigate open-weight realtime avatar or speech-to-speech models hosted on partner credits.

Fits only if provider cost/control becomes the dominant constraint.
Tradeoffs: likely slower to reach a polished real-time talking avatar than Anam/ElevenLabs. Higher model, media, and infra burden.
Operational impact: GPU hosting, model licensing checks, media pipeline work, and quality evaluation.
Reversibility: medium; useful as research, not first implementation.

## Technical Implications

Architecture: keep a server-side session broker as the first real code seam. It should accept public avatar/agent IDs or server-selected defaults, request provider session credentials, and return only short-lived client tokens.

API/MCP/contracts: MCP belongs to the access layer when tool/data surfaces are exposed. The avatar repo should not invent an MCP server until a capability register exists.

Providers: Anam and ElevenLabs are the first provider candidates. LiveKit/Pipecat remain the architecture track for a more owned realtime supervisor. Gemini computer use is a future provider path for computer-control work, not avatar rendering.

Security: keys stay server-side; signed URLs are minted just-in-time; public repo tracks env names only. Sensitive/irreversible computer-use actions require explicit confirmation and sandboxing if adopted later.

Source policy: current provider facts are drift-prone and should be re-verified at implementation lock.

Tests: do not add brittle tests before code exists. Once the first session broker exists, test env validation, provider error mapping, and no-secret client responses.

Performance: first UX success depends on session startup latency, voice turn latency, transcript reliability, interruption behavior, and media stability.

Observability: emit session lifecycle, provider request IDs, trace IDs, cost metadata, transcript events, and access-stream dispatch lifecycle. Keep raw private transcript capture opt-in and out of default telemetry.

Deployment: a subdomain such as `avatar.jami.studio` is operationally cleaner than a path under the main app if this stays a separate experimental surface; a path can work later when embedded into `jami.studio` product routing.

## Project Implications

Implementation should start with a single working avatar surface, not a full SDK, CLI, MCP server, or release pipeline. The repo setup should stay thin: public README, docs, env names, changelog fragments, and observability direction. Public assets must remain curated.

The changelog system should remain fragment-based until real releases need automation. The first implementation stream should produce a small session broker and a UI that can connect, render the avatar, show basic status/transcript, stop cleanly, and emit telemetry when configured.

## Risks And Constraints

- Provider docs, model availability, pricing, and credits drift quickly.
- Anam server-side ElevenLabs integration does not support browser-side client tools; access work must be server-side or use a different integration shape.
- Long realtime voice sessions can accumulate provider cost quickly.
- Broad local/account access in a public repo must be kept out of committed files and mediated by local/operator systems.
- Computer-use providers need explicit confirmation and sandboxing for sensitive or irreversible actions.
- No live provider verification was run during this setup.

## Recommended Direction

Choose Option B first: Anam SDK plus server-side ElevenLabs agent session broker. It best matches the brainstorm, uses existing credits, keeps keys server-side, gives enough UI control to build the real interaction layer, and remains small enough to avoid premature platform weight.

Keep Option A available as an even faster fallback if the SDK path hits account or domain friction. Keep Option C as the accepted architecture track once the first working surface proves the workflow. Treat Option D as research only until a provider cost or quality constraint forces it.

## Decision Points

### First Avatar Surface

Options:

- Option A: Anam Player/Widget.
- Option B: Anam SDK plus server-side ElevenLabs integration.
- Option C: LiveKit/Pipecat supervisor first.

Tradeoffs:

- Option A: fastest and lowest code, less control.
- Option B: still simple, more control, aligns with credits and server-side key handling.
- Option C: best long-term ownership, too heavy before proof.

Recommendation: Option B.

Why: It is the smallest path that still exercises the actual SDK and interaction-layer shape.

Implication if different: Option A narrows early UX control; Option C requires infra and adapter work before the avatar workflow is proven.

### Access Layer Boundary

Options:

- Option A: Avatar directly calls every account/tool provider.
- Option B: Avatar talks to an access stream that owns account/tool/subagent work.
- Option C: Put everything inside the ElevenLabs agent.

Tradeoffs:

- Option A: quick demos, maximum credential sprawl and lock-in.
- Option B: clean separation, reusable by Jami Studio and yrka.io, aligns with upstream research.
- Option C: useful for simple webhooks, but risks provider lock-in and hidden business logic.

Recommendation: Option B.

Why: It keeps the avatar visual layer portable and makes full-access work reusable across products.

Implication if different: More future migration work and more secret/account exposure in the avatar repo.

### Observability Owner

Options:

- Option A: Direct Sentry/PostHog/Amplitude calls everywhere.
- Option B: OpenTelemetry-style emit points plus configured exporters/SDKs.
- Option C: No observability until production.

Tradeoffs:

- Option A: fast but sticky.
- Option B: standard, portable, matches existing Jami research and Sentry account posture.
- Option C: hides latency/cost failures during the most important UX work.

Recommendation: Option B.

Why: OpenTelemetry is the least-churn upstream standard, while Sentry/PostHog/Amplitude remain configurable consumers.

Implication if different: Direct vendor calls create migration work; no telemetry slows provider and UX evaluation.

### Deployment Home

Options:

- Option A: `avatar.jami.studio`.
- Option B: `jami.studio/avatar`.
- Option C: local-only until production.

Tradeoffs:

- Option A: clean isolation for experimental auth, CSP, and provider callbacks.
- Option B: tighter product integration, but couples routing/security earlier.
- Option C: avoids hosting work but blocks real microphone/HTTPS/provider-domain testing.

Recommendation: Option A for internal development, with later embedding into product routes if needed.

Why: The avatar surface has distinct provider, CSP, microphone, and auth concerns during exploration.

Implication if different: A path route may be fine later but creates more coupling now.

## Decision Questions For Discussion

- First surface: use Anam SDK plus server-side ElevenLabs integration, with Player/Widget only as fallback?
- Access boundary: keep account/tool/subagent work behind an access stream instead of inside the avatar provider?
- Observability: emit standard telemetry first, then export to Sentry/PostHog/Amplitude by config?
- Deployment: use `avatar.jami.studio` for the internal development surface?

## Next Step If Accepted

Write a focused implementation plan for the first provider spike: server session broker, avatar UI, transcript/status handling, env validation, minimal telemetry, and deployment target. Then implement the smallest working surface against live Anam/ElevenLabs credentials.

## Sources

- `README.md` original brainstorm, preserved at `docs/research/brainstorms/initial-avatar-agent-brainstorm.md`.
- `../oss/_ops/planning/standards/`.
- `../oss/_ops/planning/research/masters/audits/13-realtime-voice/recommendation.md`.
- `../oss/_ops/planning/research/masters/reports/C-capability-adapters/F11-provider-inference-and-realtime.md`.
- `../oss/_ops/planning/research/masters/reports/B-agent-substrate/F08-transport-and-interop.md`.
- `../oss/_ops/planning/research/masters/reports/B-agent-substrate/F09-ui-registry-and-render-seam.md`.
- `../oss/_ops/planning/research/masters/reports/C-capability-adapters/F13-platform-adapters.md`.
- `../oss/_ops/planning/research/masters/reports/D-distribution-products-ax/F15-agent-discoverability-ax.md`.
- `../oss/_ops/admin/programs/vendors/sentry.md`.
- `../oss/.env.example`.
- <https://anam.ai/docs/embed/overview>
- <https://anam.ai/docs/python-sdk/overview>
- <https://anam.ai/cookbook/elevenlabs-server-side-agents>
- <https://elevenlabs.io/docs/api-reference/introduction>
- <https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-computer-use-gemini-3-5-flash/>
- <https://modelcontextprotocol.io/docs/getting-started/intro>
- <https://opentelemetry.io/docs/what-is-opentelemetry/>
- <https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry/>
- <https://posthog.com/docs>
- <https://amplitude.com/docs>
