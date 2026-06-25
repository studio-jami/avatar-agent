"use client";

import * as AnamSdk from "@anam-ai/js-sdk";
import { useEffect, useRef, useState } from "react";

type ConnectionState = "idle" | "checking" | "ready" | "connecting" | "connected" | "failed";

type RuntimeConfig = {
  providerReady: boolean;
  personas: Array<{ id: string; label: string }>;
  defaultPersonaId?: string;
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

export function AvatarConsole() {
  const clientRef = useRef<AnamClientLike | null>(null);
  const [state, setState] = useState<ConnectionState>("checking");
  const [runtime, setRuntime] = useState<RuntimeConfig | null>(null);
  const [personaId, setPersonaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

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
        setPersonaId(config.defaultPersonaId ?? config.personas[0]?.id ?? "");
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

  async function startSession() {
    setState("connecting");
    setError(null);
    setMessages([]);
    telemetry("avatar.session.start_requested");

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
        telemetry("avatar.session.connected");
      });
      addAnamListener(client, "CONNECTION_CLOSED", () => {
        setState("ready");
        telemetry("avatar.session.closed");
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
      telemetry("avatar.session.start_failed");
    }
  }

  async function stopSession() {
    await clientRef.current?.stopStreaming?.();
    clientRef.current = null;
    setState(runtime?.providerReady ? "ready" : "idle");
    telemetry("avatar.session.stop_requested");
  }

  const canStart = state === "ready" || state === "failed";
  const isLive = state === "connecting" || state === "connected";

  return (
    <main className="console-shell">
      <section className="stage" aria-label="Avatar session stage">
        <div className="video-frame">
          <video id="avatar-video" autoPlay playsInline aria-label="Live avatar video" />
          {state !== "connected" ? <div className="video-placeholder" aria-hidden="true" /> : null}
        </div>

        <div className="controls" aria-label="Session controls">
          <label>
            <span>Persona</span>
            <select value={personaId} onChange={(event) => setPersonaId(event.target.value)} disabled={isLive}>
              {(runtime?.personas ?? []).map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.label}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button type="button" onClick={startSession} disabled={!canStart}>
              Start
            </button>
            <button type="button" onClick={stopSession} disabled={!isLive}>
              Stop
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
