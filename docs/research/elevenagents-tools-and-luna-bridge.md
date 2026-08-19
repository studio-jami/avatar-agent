# ElevenAgents Tools & Luna Bridge — Source Audit

Date: 2026-08-19
Status: Superseded — canonical copy moved to `jamesnavinhill/luna-avatar`

> ⚠️ The canonical home for this audit is now
> [`luna-avatar/docs/research/elevenagents-tools-and-luna-bridge.md`](https://github.com/jamesnavinhill/luna-avatar/blob/main/docs/research/elevenagents-tools-and-luna-bridge.md).
> Moved on 2026-08-19 alongside the voice/avatar layer's decision record.

## Question being answered

How do ElevenLabs (ElevenAgents) voice agent ↔ Luna calls actually get made, and how do
streaming updates flow back to the ElevenLabs voice agent without breaking conversational flow?

## Scope and method

Verified against three classes of source, in order:

1. **Live SDK** installed in `avatar-agent/apps/web/node_modules`:
   - `@elevenlabs/react@1.9.0`
   - `@elevenlabs/client@1.14.0` (the react package's dependency)
   - `@elevenlabs/types@0.16.0`
2. **Official ElevenLabs docs**, fetched live 2026-08-19 (product is now branded **ElevenAgents**,
   not "Conversational AI").
3. **Eve framework docs** in the `eve-source-code` sibling repo (`docs/channels/mcp.mdx`,
   `docs/channels/eve.mdx`, `docs/connections/overview.mdx`, `docs/guides/remote-agents.md`).

Product branding and the MCP tool surface are drift-prone provider facts; both were re-verified
live rather than trusted from prior docs.

## Verified provider findings

### Tool taxonomy (four kinds, from the official tools index)

| Tool type | Where it runs | Fit for 11→Luna |
| --- | --- | --- |
| **Client tools** | On the device (widget JS) | Agent calls → your registered handler fetches Luna → handler returns a string; "wait for response" appends the result to the ElevenLabs conversation context. |
| **Webhook tools** | ElevenLabs server-side, calls a REST URL | Agent calls → ElevenLabs POSTs to Luna's eve HTTP session API → Luna replies → result appended to context. |
| **MCP tools** | ElevenLabs runs an MCP client to your MCP server | Agent attaches Luna's `mcpChannel` as an MCP server. Approval modes: `always_ask`, fine-grained per-tool, or none. |
| **System tools** | Platform-internal | Agent transfer, end call, update state — not for the Luna bridge. |

Source: <https://elevenlabs.io/docs/eleven-agents/customization/tools>

### MCP is native in ElevenLabs, with approval

- MCP is workspace-scoped (`can_use_mcp_servers` setting); disabled by default; unavailable under
  Zero Retention Mode or HIPAA.
- Supports **SSE** and **HTTP streamable** transports.
- Approval: `always_ask` (recommended), fine-grained (auto-approved / requires-approval /
  disabled per tool), or none.
- Attach via dashboard, or via API/TS SDK (`mcp_servers.create` + agent `prompt.mcp_server_ids`).

Source: <https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp>

### The SDK's client-side surface (verified from `@elevenlabs/client@1.14.0` types)

`BaseConversation` exposes, in addition to `startSession`/`endSession`:

- `sendContextualUpdate(text, options?)` → emits `contextual_update` (`text`, optional
  `context_id`). Push context into a live conversation.
- `sendUserMessage(text)` → emits `user_message`. Inject a user-role message to steer.
- `sendMCPToolApprovalResult(toolCallId, isApproved)` → approve/deny a pending MCP tool call.
- `sendUserActivity()`, `sendMultimodalMessage()`, `sendFeedback()`, `uploadFile()`.

Client tool result returns to the agent via `client_tool_result` (`tool_call_id`, `result`,
`is_error`).

Relevant callbacks (from `Callbacks`): `onMCPToolCall`, `onMCPConnectionStatus`,
`onAgentToolRequest`, `onAgentToolResponse`, `onAgentToolResponseFullPayload` (carries
`full_tool_result`), `onClientToolCall` (via `onUnhandledClientToolCall`), `onConversationMetadata`,
`onExternalAgentConnected`.

MCP tool-call states observed on the wire (`mcp_tool_call`) are `loading →
awaiting_approval → success | failure`, each carrying `service_id`, `tool_call_id`, `tool_name`,
`parameters`, and (on success) `result`.

Source (local): `avatar-agent/apps/web/node_modules/@elevenlabs/client/dist/BaseConversation.d.ts`,
`dist/utils/events.d.ts`; `@elevenlabs/types/generated/types/asyncapi-types.ts`.

### The reverse direction (ElevenLabs *as* an MCP server) is distinct

The hosted MCP server at `https://api.elevenlabs.io/v1/mcp` lets an MCP client (Claude, etc.)
*manage agents*. This is not the 11→Luna bridge; it is the "manage ElevenAgents as code" surface.

Source: <https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp>

### Agent-to-agent / transfer

Agent-specific "call another agent" tooling is now under **System tools → Agent transfer**
(transfer conversations between ElevenAgents agents by configured rules), and the older
"agent tool" surface is deprecated. This is distinct from delegating *to Luna*: Luna is reached
as an external MCP server, not as another ElevenAgents agent.

Source: <https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools>

## Luna / eve side (what the bridge attaches to)

- Luna publishes as an MCP server via `mcpChannel` with four tools: `agent_start`, `agent_get`,
  `agent_update`, `agent_cancel`. Default route `/eve/v1/mcp`.
  Source: `eve-source-code/docs/channels/mcp.mdx`
- Luna also exposes the durable HTTP session API under `/eve/v1/session*` with an NDJSON stream
  and control routes (cancel/clear/compact/reset). This is the "watch progress" surface.
  Source: `eve-source-code/docs/channels/eve.mdx`

## Conclusion

The bridge is native on both sides. ElevenLabs runs an MCP client; Luna runs an MCP server. The
only authored work is (a) connecting them and (b) the widget's dual-session relay that turns
Luna's stream events into `sendContextualUpdate` milestones for the live voice. No bespoke
bridge protocol, no second tool registry.

See the locked decisions for the resulting architecture:
[`../decisions/voice-avatar-layer-architecture.md`](../decisions/voice-avatar-layer-architecture.md).

## Sources (verified live 2026-08-19)

- <https://elevenlabs.io/docs/eleven-agents/overview>
- <https://elevenlabs.io/docs/eleven-agents/customization/tools>
- <https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp>
- <https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp>
- <https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools>
- <https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools>
- <https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools>
- `avatar-agent/apps/web/node_modules/@elevenlabs/client@1.14.0` (dist type declarations)
- `avatar-agent/apps/web/node_modules/@elevenlabs/types@0.16.0` (generated payload types)
- `eve-source-code/docs/channels/mcp.mdx`, `docs/channels/eve.mdx`,
  `docs/connections/overview.mdx`, `docs/guides/remote-agents.md`,
  `docs/patterns/multi-tenant-memory.md`
