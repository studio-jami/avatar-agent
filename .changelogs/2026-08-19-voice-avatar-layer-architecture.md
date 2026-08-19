# Changelog — Superseded (canonical moved to `jamesnavinhill/luna-avatar`)

Date: 2026-08-19
Type: docs

> Superseded: this planning work's canonical home is the `luna-avatar` repo changelog.

- Added decision record `docs/decisions/voice-avatar-layer-architecture.md` locking the
  single-brain / transport-layer boundary, the one-store-many-seams memory policy, the
  ElevenLabs↔Luna MCP bridge, the per-hop model routing + gateway tracing ladder, the
  retirement of the bespoke access-stream registry, the new-monorepo repo shape, and the
  provider-adapter seams (broker contracts + composer + per-engine drivers, account ≠ provider).
- Added source audit `docs/research/elevenagents-tools-and-luna-bridge.md` with the verified
  ElevenAgents tool taxonomy (client / webhook / MCP / system), the native MCP support + approval
  modes, and the client-side `sendContextualUpdate` / `sendUserMessage` streaming-update surface,
  checked against the installed `@elevenlabs/client@1.14.0` types and official docs.
