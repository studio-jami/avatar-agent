"use client";

import * as AnamSdk from "@anam-ai/js-sdk";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import accessStreamToolContracts from "../lib/access-stream.tools.json";

type ConnectionState = "idle" | "checking" | "ready" | "connecting" | "connected" | "failed";
type ProviderMode = "anam" | "elevenlabs" | "boson";

type RuntimeConfig = {
  providerReady: boolean;
  providerSupport: {
    anam: boolean;
    elevenlabs: boolean;
    boson: boolean;
  };
  defaultProvider: ProviderMode | null;
  personas: Array<{ id: string; label: string }>;
  defaultPersonaId?: string;
  elevenLabsAgent?: { label: string };
  bosonAvatars: Array<{ id: string; label: string; fileName: string }>;
  defaultBosonAvatarId?: string;
};

type TranscriptMessage = {
  id: string;
  role: "user" | "persona" | "system";
  content: string;
  interrupted?: boolean;
};

type SessionResponse = {
  sessionToken?: string;
  persona?: { id: string; label: string };
  error?: string;
};

type ElevenLabsSessionResponse = {
  conversationToken?: string;
  agent?: { label: string };
  error?: string;
};

type BosonCreateResponse = {
  videoId?: string;
  status?: string;
  progress?: number;
  error?: string;
};

type BosonStatusResponse = {
  videoId?: string;
  status?: string;
  progress?: number;
  error?: unknown;
};

type AnamClientLike = {
  addListener?: (event: unknown, listener: (event: Record<string, unknown>) => void) => void;
  on?: (event: unknown, listener: (event: Record<string, unknown>) => void) => void;
  streamToVideoElement: (elementId: string) => Promise<void>;
  stopStreaming?: () => Promise<void>;
};

const createClient = (AnamSdk as unknown as { createClient: (sessionToken: string) => AnamClientLike }).createClient;
const AnamEvent = (AnamSdk as unknown as { AnamEvent?: Record<string, unknown> }).AnamEvent ?? {};

function telemetry(name: string, attributes: Record<string, string | number | boolean> = {}) {
  navigator.sendBeacon?.(
    "/api/telemetry",
    new Blob([JSON.stringify({ name, attributes })], { type: "application/json" }),
  );
}

type AccessStreamToolContract = { name: string; description: string };

type ClientToolHandler = (parameters: Record<string, unknown>) => Promise<string>;

function buildAccessStreamClientTools(
  onToolEvent: (toolName: string, phase: "invoked" | "completed" | "failed") => void,
): Record<string, ClientToolHandler> {
  const contracts = accessStreamToolContracts as AccessStreamToolContract[];

  return Object.fromEntries(
    contracts.map((contract) => [
      contract.name,
      async (parameters: Record<string, unknown>) => {
        onToolEvent(contract.name, "invoked");
        try {
          const response = await fetch("/api/access-stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: contract.name, parameters: parameters ?? {} }),
          });
          const payload = (await response.json()) as { result?: string; error?: string };
          if (!response.ok || typeof payload.result !== "string") {
            throw new Error(payload.error ?? "Access stream tool failed.");
          }
          onToolEvent(contract.name, "completed");
          return payload.result;
        } catch (error) {
          onToolEvent(contract.name, "failed");
          return error instanceof Error ? `Tool error: ${error.message}` : "Tool error.";
        }
      },
    ]),
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addAnamListener(client: AnamClientLike, eventName: string, listener: (event: Record<string, unknown>) => void) {
  const event = AnamEvent[eventName] ?? eventName;
  if (client.addListener) {
    client.addListener(event, listener);
    return;
  }
  client.on?.(event, listener);
}

function roleFromEvent(role: unknown): TranscriptMessage["role"] {
  if (role === "user" || role === "persona") {
    return role;
  }
  return "system";
}

function appendTranscript(messages: TranscriptMessage[], event: Record<string, unknown>): TranscriptMessage[] {
  const id = typeof event.id === "string" ? event.id : crypto.randomUUID();
  const content = typeof event.content === "string" ? event.content : "";
  if (!content) {
    return messages;
  }

  const index = messages.findIndex((message) => message.id === id);
  if (index >= 0) {
    const next = [...messages];
    next[index] = {
      ...next[index],
      content: `${next[index].content}${content}`,
      interrupted: Boolean(event.interrupted),
    };
    return next;
  }

  return [
    ...messages,
    {
      id,
      role: roleFromEvent(event.role),
      content,
      interrupted: Boolean(event.interrupted),
    },
  ].slice(-24);
}

function asEventRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function nestedString(record: Record<string, unknown>, key: string, nestedKey: string): string | undefined {
  const child = asEventRecord(record[key]);
  const value = child?.[nestedKey];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function appendElevenLabsTranscript(messages: TranscriptMessage[], event: unknown): TranscriptMessage[] {
  const record = asEventRecord(event);
  if (!record) {
    return messages;
  }

  const type = typeof record.type === "string" ? record.type : "message";
  const content =
    nestedString(record, "user_transcription_event", "user_transcript") ??
    nestedString(record, "agent_response_event", "agent_response") ??
    nestedString(record, "agent_response_correction_event", "corrected_agent_response") ??
    (typeof record.message === "string" ? record.message : undefined) ??
    (typeof record.text === "string" ? record.text : undefined);

  if (!content) {
    return messages;
  }

  const role: TranscriptMessage["role"] = type.includes("user")
    ? "user"
    : type.includes("agent")
      ? "persona"
      : "system";

  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      role,
      content,
    },
  ].slice(-24);
}

function providerLabel(provider: ProviderMode): string {
  if (provider === "anam") {
    return "Anam live session";
  }

  if (provider === "elevenlabs") {
    return "ElevenLabs direct agent";
  }

  return "Boson Higgs preview";
}

function AvatarConsoleContent() {
  const clientRef = useRef<AnamClientLike | null>(null);
  const bosonPollRef = useRef(0);
  const [state, setState] = useState<ConnectionState>("checking");
  const [runtime, setRuntime] = useState<RuntimeConfig | null>(null);
  const [provider, setProvider] = useState<ProviderMode>("anam");
  const [personaId, setPersonaId] = useState("");
  const [bosonAvatarId, setBosonAvatarId] = useState("");
  const [bosonPrompt, setBosonPrompt] = useState("Give a short intro as the Jami Studio avatar.");
  const [bosonVideoSrc, setBosonVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const accessStreamClientTools = useMemo(
    () =>
      buildAccessStreamClientTools((toolName, phase) => {
        telemetry(`avatar.access_stream.${phase}`, { tool: toolName, provider: "elevenlabs" });
        setMessages((current) =>
          [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "system" as const,
              content: `access stream · ${toolName} ${phase}`,
            },
          ].slice(-24),
        );
      }),
    [],
  );
  const elevenLabsConversation = useConversation({
    clientTools: accessStreamClientTools,
    onConnect: () => {
      setState("connected");
      telemetry("avatar.session.connected", { provider: "elevenlabs" });
    },
    onDisconnect: () => {
      setState(runtime?.providerReady ? "ready" : "idle");
      telemetry("avatar.session.closed", { provider: "elevenlabs" });
    },
    onMessage: (message) => {
      setMessages((current) => appendElevenLabsTranscript(current, message));
    },
    onError: (message) => {
      setError(typeof message === "string" ? message : "ElevenLabs provider emitted an error.");
      setState("failed");
    },
  });

  function addSystemMessage(content: string) {
    setMessages((current) => {
      const next = [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system" as const,
          content,
        },
      ];
      return next.slice(-24);
    });
  }

  useEffect(() => {
    let active = true;

    async function loadRuntime() {
      try {
        const response = await fetch("/api/runtime", { cache: "no-store" });
        const config = (await response.json()) as RuntimeConfig;
        if (!active) {
          return;
        }
        setRuntime(config);
        setProvider(config.defaultProvider ?? "anam");
        setPersonaId(config.defaultPersonaId ?? config.personas[0]?.id ?? "");
        setBosonAvatarId(config.defaultBosonAvatarId ?? config.bosonAvatars[0]?.id ?? "");
        setState(config.providerReady ? "ready" : "failed");
        if (!config.providerReady) {
          setError("Provider setup is incomplete.");
        }
      } catch {
        if (active) {
          setState("failed");
          setError("Runtime configuration check failed.");
        }
      }
    }

    loadRuntime();
    return () => {
      active = false;
    };
  }, []);

  function providerIsReady(nextProvider: ProviderMode): boolean {
    return Boolean(runtime?.providerSupport[nextProvider]);
  }

  async function startSession() {
    if (provider === "boson") {
      await startBosonVideo();
      return;
    }

    if (provider === "elevenlabs") {
      await startElevenLabsConversation();
      return;
    }

    setState("connecting");
    setError(null);
    setBosonVideoSrc(null);
    telemetry("avatar.session.start_requested", { provider: "anam" });

    try {
      const response = await fetch("/api/anam-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: personaId || undefined,
          userId: "jami-operator",
          dynamicVariables: {
            surface: "avatar-agent-web",
          },
        }),
      });

      const payload = (await response.json()) as SessionResponse;
      if (!response.ok || !payload.sessionToken) {
        throw new Error(payload.error ?? "Session token request failed.");
      }

      const client = createClient(payload.sessionToken);
      clientRef.current = client;

      addAnamListener(client, "MESSAGE_STREAM_EVENT_RECEIVED", (event) => {
        setMessages((current) => appendTranscript(current, event));
      });
      addAnamListener(client, "CONNECTION_ESTABLISHED", () => {
        setState("connected");
        telemetry("avatar.session.connected", { provider: "anam" });
      });
      addAnamListener(client, "CONNECTION_CLOSED", () => {
        setState("ready");
        telemetry("avatar.session.closed", { provider: "anam" });
      });
      addAnamListener(client, "ERROR", (event) => {
        setError(typeof event.message === "string" ? event.message : "Avatar provider emitted an error.");
        setState("failed");
      });

      await client.streamToVideoElement("avatar-video");
      setState("connected");
    } catch (sessionError) {
      setState("failed");
      setError(sessionError instanceof Error ? sessionError.message : "Unable to start avatar session.");
      telemetry("avatar.session.start_failed", { provider: "anam" });
    }
  }

  async function startElevenLabsConversation() {
    setState("connecting");
    setError(null);
    setBosonVideoSrc(null);
    telemetry("avatar.session.start_requested", { provider: "elevenlabs" });

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch("/api/elevenlabs-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json()) as ElevenLabsSessionResponse;
      if (!response.ok || !payload.conversationToken) {
        throw new Error(payload.error ?? "ElevenLabs conversation token request failed.");
      }

      addSystemMessage(`ElevenLabs agent ready (${payload.agent?.label ?? "direct agent"}).`);
      elevenLabsConversation.startSession({
        conversationToken: payload.conversationToken,
        connectionType: "webrtc",
        userId: "jami-operator",
        dynamicVariables: {
          surface: "avatar-agent-web",
        },
      });
    } catch (sessionError) {
      setState("failed");
      setError(sessionError instanceof Error ? sessionError.message : "Unable to start ElevenLabs conversation.");
      telemetry("avatar.session.start_failed", { provider: "elevenlabs" });
    }
  }

  async function startBosonVideo() {
    setState("connecting");
    setError(null);
    const runId = Date.now();
    bosonPollRef.current = runId;
    telemetry("avatar.session.start_requested", { provider: "boson" });

    try {
      const createResponse = await fetch("/api/boson-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId: bosonAvatarId || undefined,
          prompt: bosonPrompt,
        }),
      });

      const created = (await createResponse.json()) as BosonCreateResponse;
      if (!createResponse.ok || !created.videoId) {
        throw new Error(created.error ?? "Boson generation request failed.");
      }

      addSystemMessage(`Boson video requested (${created.videoId}).`);

      while (bosonPollRef.current === runId) {
        const statusResponse = await fetch(`/api/boson-video/${created.videoId}`, { cache: "no-store" });
        const statusPayload = (await statusResponse.json()) as BosonStatusResponse;
        if (!statusResponse.ok || !statusPayload.status) {
          throw new Error(typeof statusPayload.error === "string" ? statusPayload.error : "Boson status poll failed.");
        }

        if (statusPayload.status === "completed") {
          const contentUrl = `/api/boson-video/${created.videoId}/content?ts=${Date.now()}`;
          setBosonVideoSrc(contentUrl);
          setState("connected");
          telemetry("avatar.session.connected", { provider: "boson" });
          addSystemMessage(`Boson video completed (${created.videoId}).`);
          return;
        }

        if (statusPayload.status === "failed") {
          throw new Error(typeof statusPayload.error === "string" ? statusPayload.error : "Boson video generation failed.");
        }

        await wait(2000);
      }
    } catch (sessionError) {
      setState("failed");
      setError(sessionError instanceof Error ? sessionError.message : "Unable to generate Boson video.");
      telemetry("avatar.session.start_failed", { provider: "boson" });
    }
  }

  async function stopSession() {
    if (provider === "boson") {
      bosonPollRef.current = 0;
      setBosonVideoSrc(null);
      setState(runtime?.providerReady ? "ready" : "idle");
      telemetry("avatar.session.stop_requested", { provider: "boson" });
      return;
    }

    if (provider === "elevenlabs") {
      elevenLabsConversation.endSession();
      setState(runtime?.providerReady ? "ready" : "idle");
      telemetry("avatar.session.stop_requested", { provider: "elevenlabs" });
      return;
    }

    await clientRef.current?.stopStreaming?.();
    clientRef.current = null;
    setState(runtime?.providerReady ? "ready" : "idle");
    telemetry("avatar.session.stop_requested", { provider: "anam" });
  }

  const canStart = (providerIsReady(provider) && (state === "ready" || state === "failed")) || (provider === "boson" && state === "connected");
  const isLive = state === "connecting" || ((provider === "anam" || provider === "elevenlabs") && state === "connected");

  return (
    <main className="console-shell">
      <section className="stage" aria-label="Avatar session stage">
        <div className="video-frame">
          {provider === "anam" ? (
            <video id="avatar-video" autoPlay playsInline aria-label="Live avatar video" />
          ) : provider === "elevenlabs" ? (
            <div className="audio-agent" data-speaking={elevenLabsConversation.isSpeaking}>
              <span>{runtime?.elevenLabsAgent?.label ?? "ElevenLabs agent"}</span>
              <strong>{elevenLabsConversation.isSpeaking ? "speaking" : "listening"}</strong>
              <small>{elevenLabsConversation.status}</small>
            </div>
          ) : (
            <video src={bosonVideoSrc ?? undefined} autoPlay playsInline controls loop aria-label="Boson avatar video" />
          )}
          {state !== "connected" ? <div className="video-placeholder" aria-hidden="true" /> : null}
        </div>

        <div className="controls" aria-label="Session controls">
          <label>
            <span>Provider</span>
            <select
              value={provider}
              onChange={(event) => {
                const next = event.target.value as ProviderMode;
                setProvider(next);
                const ready = Boolean(runtime?.providerSupport[next]);
                setError(ready ? null : `${providerLabel(next)} setup is incomplete.`);
                setState(ready ? "ready" : "failed");
              }}
              disabled={isLive}
            >
              <option value="anam">Anam live session</option>
              <option value="elevenlabs">ElevenLabs direct agent</option>
              <option value="boson">Boson Higgs preview</option>
            </select>
          </label>

          {provider === "elevenlabs" ? (
            <label>
              <span>Agent</span>
              <input value={runtime?.elevenLabsAgent?.label ?? "ElevenLabs agent"} readOnly disabled />
            </label>
          ) : (
            <label>
            <span>{provider === "anam" ? "Persona" : "Live asset"}</span>
            {provider === "anam" ? (
              <select value={personaId} onChange={(event) => setPersonaId(event.target.value)} disabled={isLive}>
                {(runtime?.personas ?? []).map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>
            ) : (
              <select value={bosonAvatarId} onChange={(event) => setBosonAvatarId(event.target.value)} disabled={isLive}>
                {(runtime?.bosonAvatars ?? []).map((avatar) => (
                  <option key={avatar.id} value={avatar.id}>
                    {avatar.label}
                  </option>
                ))}
              </select>
            )}
            </label>
          )}

          {provider === "boson" ? (
            <label className="full-width">
              <span>Prompt</span>
              <input
                value={bosonPrompt}
                onChange={(event) => setBosonPrompt(event.target.value)}
                disabled={isLive}
                placeholder="Text to speak for comparison clip"
              />
            </label>
          ) : null}

          <div className="button-row">
            <button type="button" onClick={startSession} disabled={!canStart}>
              {provider === "boson" ? "Generate" : "Start"}
            </button>
            <button type="button" onClick={stopSession} disabled={!isLive}>
              {provider === "boson" ? "Clear" : "Stop"}
            </button>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
      </section>

      <aside className="side-panel" aria-label="Session transcript">
        <section>
          <h2>Conversation</h2>
          <div className="transcript" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} data-role={message.role}>
                <strong>{message.role}</strong>
                <p>{message.content}</p>
                {message.interrupted ? <small>interrupted</small> : null}
              </article>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}

export function AvatarConsole() {
  return (
    <ConversationProvider>
      <AvatarConsoleContent />
    </ConversationProvider>
  );
}
