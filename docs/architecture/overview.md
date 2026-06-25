# Architecture Overview

Avatar Agent is the avatar-facing interaction layer. It should present a real-time avatar,
capture user input, stream responses, and connect to an access stream that owns tools,
accounts, subagents, and long-running work.

## Boundary

- The avatar layer owns session start/stop, media rendering, transcript display, and UX state.
- The access layer owns tool calls, account access, task dispatch, and background runs.
- Provider adapters own Anam, ElevenLabs, LiveKit, realtime model, analytics, and
  observability integration details.

## Initial Provider Shape

The accepted greenfield path is a complete Anam SDK surface plus ElevenLabs Conversational AI,
with server-side session token minting so provider keys stay off the client. The architecture
keeps realtime media transport and realtime model selection as separate seams so LiveKit/Pipecat,
Anam, or future providers can be evaluated without rewriting the product surface.

## Non-Goals

- The avatar layer does not directly own broad account credentials.
- The avatar layer does not run heavy background work inline.
- The public repo does not carry private recordings, raw provider exports, or staging media.
