"use client";

import * as AnamSdk from "@anam-ai/js-sdk";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import dynamic from "next/dynamic";
import { MessageSquare, Settings, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import accessStreamToolContracts from "../lib/access-stream.tools.json";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AgentState } from "@/components/ui/orb";

const Orb = dynamic(() => import("@/components/ui/orb").then((mod) => mod.Orb), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse rounded-full bg-muted/40" />,
});

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

  const source = typeof record.source === "string" ? record.source : "";
  const role: TranscriptMessage["role"] =
    source === "user" || type.includes("user")
      ? "user"
      : source === "ai" || source === "agent" || type.includes("agent")
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
  const [showTranscript, setShowTranscript] = useState(false);
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

  const support = runtime?.providerSupport ?? { anam: false, elevenlabs: false, boson: false };
  const personas = runtime?.personas ?? [];
  const bosonAvatars = runtime?.bosonAvatars ?? [];
  const agentLabel = runtime?.elevenLabsAgent?.label ?? "Avatar";
  const activePersona = personas.find((persona) => persona.id === personaId);
  const displayLabel =
    provider === "elevenlabs" ? agentLabel : provider === "anam" ? activePersona?.label ?? "Avatar" : "Preview clip";

  const statusLabel = !support[provider]
    ? "Needs setup"
    : state === "connected"
      ? provider === "elevenlabs"
        ? elevenLabsConversation.isSpeaking
          ? "Speaking"
          : "Listening"
        : "Live"
      : state === "connecting"
        ? "Connecting"
        : state === "failed"
          ? "Error"
          : state === "checking"
            ? "Loading"
            : "Ready";

  const orbAgentState: AgentState =
    provider === "elevenlabs" && state === "connected"
      ? elevenLabsConversation.isSpeaking
        ? "talking"
        : "listening"
      : state === "connecting"
        ? "thinking"
        : null;

  function handleProviderChange(value: string) {
    const next = value as ProviderMode;
    setProvider(next);
    const ready = Boolean(runtime?.providerSupport[next]);
    setError(ready ? null : `${providerLabel(next)} setup is incomplete.`);
    setState(ready ? "ready" : "failed");
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium tracking-tight">{displayLabel}</span>
          <Badge variant="secondary" className="font-normal text-muted-foreground">
            {statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle transcript"
            onClick={() => setShowTranscript((open) => !open)}
          >
            <MessageSquare className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings" disabled={isLive}>
                <Settings className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={provider} onValueChange={handleProviderChange}>
                <DropdownMenuRadioItem value="elevenlabs" disabled={!support.elevenlabs}>
                  Voice
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="anam" disabled={!support.anam}>
                  Avatar video
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="boson" disabled={!support.boson}>
                  Preview clip
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              {provider === "anam" && personas.length > 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Persona</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={personaId} onValueChange={setPersonaId}>
                    {personas.map((persona) => (
                      <DropdownMenuRadioItem key={persona.id} value={persona.id}>
                        {persona.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </>
              ) : null}

              {provider === "boson" && bosonAvatars.length > 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Avatar asset</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={bosonAvatarId} onValueChange={setBosonAvatarId}>
                    {bosonAvatars.map((avatar) => (
                      <DropdownMenuRadioItem key={avatar.id} value={avatar.id}>
                        {avatar.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
        </div>
      </header>

      <section className="relative flex flex-1 items-center justify-center px-6 py-4" aria-label="Avatar stage">
        {provider === "elevenlabs" ? (
          <div className="relative aspect-square w-[min(72vmin,560px)]">
            <Orb agentState={orbAgentState} className="size-full" />
          </div>
        ) : provider === "anam" ? (
          <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border bg-muted shadow-sm">
            <video id="avatar-video" autoPlay playsInline className="size-full object-cover" aria-label="Live avatar video" />
          </div>
        ) : (
          <div className="aspect-square w-[min(72vmin,560px)] overflow-hidden rounded-2xl border bg-muted shadow-sm">
            <video
              src={bosonVideoSrc ?? undefined}
              autoPlay
              playsInline
              controls
              loop
              className="size-full object-cover"
              aria-label="Boson avatar video"
            />
          </div>
        )}
      </section>

      <footer className="flex flex-col items-center gap-3 px-6 pb-10 pt-2">
        {provider === "boson" ? (
          <input
            value={bosonPrompt}
            onChange={(event) => setBosonPrompt(event.target.value)}
            disabled={isLive}
            placeholder="Text to speak for the preview clip"
            className="h-10 w-full max-w-md rounded-lg border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        ) : null}

        <div className="flex items-center gap-2">
          {isLive ? (
            <Button size="lg" variant="secondary" className="rounded-full px-8" onClick={stopSession}>
              {provider === "boson" ? "Clear" : "Stop"}
            </Button>
          ) : (
            <Button size="lg" className="rounded-full px-10" onClick={startSession} disabled={!canStart}>
              {provider === "boson" ? "Generate" : "Start"}
            </Button>
          )}
          {!isLive && provider === "boson" && state === "connected" ? (
            <Button size="lg" variant="outline" className="rounded-full px-6" onClick={stopSession}>
              Clear
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </footer>

      <aside
        aria-label="Session transcript"
        className={cn(
          "fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l bg-card/95 shadow-xl backdrop-blur transition-transform duration-300 ease-out",
          showTranscript ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">Conversation</h2>
          <Button variant="ghost" size="icon" aria-label="Close transcript" onClick={() => setShowTranscript(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-4 py-3">
          {messages.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              No messages yet. Start a session to begin.
            </p>
          ) : (
            <div className="flex flex-col gap-3" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    message.role === "persona" && "border-primary/30 bg-primary/5",
                    message.role === "system" && "border-dashed bg-muted/40 text-muted-foreground",
                  )}
                >
                  <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {message.role === "persona" ? displayLabel : message.role}
                  </span>
                  <p className="leading-relaxed">{message.content}</p>
                  {message.interrupted ? (
                    <span className="mt-1 block text-xs text-muted-foreground">interrupted</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
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
