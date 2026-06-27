import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getBosonConfig, type BosonVideoSize } from "./server-env";

const BOSON_VIDEOS_ENDPOINT = "https://api.boson.ai/v1/videos";

type BosonVideoCreateRequest = {
  avatarId?: unknown;
  prompt?: unknown;
  size?: unknown;
};

type BosonVideo = {
  id: string;
  status: string;
  progress?: number;
  error?: unknown;
};

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asVideoSize(value: unknown): BosonVideoSize | undefined {
  if (value === "640x640" || value === "640x480" || value === "480x640") {
    return value;
  }
  return undefined;
}

function liveAvatarDirectory(): string {
  const candidates = [
    resolve(process.cwd(), "public/avatars/live"),
    resolve(process.cwd(), "../../assets/avatars/live"),
    resolve(process.cwd(), "../assets/avatars/live"),
    resolve(process.cwd(), "assets/avatars/live"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to locate assets/avatars/live directory for Boson ref_image");
}

async function readProviderError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || response.statusText;
}

export async function createBosonVideo(input: BosonVideoCreateRequest): Promise<BosonVideo> {
  const config = getBosonConfig();
  const prompt = asOptionalString(input.prompt) ?? "Give a short intro as the Jami Studio avatar.";
  const size = asVideoSize(input.size) ?? config.videoSize;

  const selectedAvatar = config.avatars.find((avatar) => avatar.id === asOptionalString(input.avatarId)) ?? config.avatars[0];
  if (!selectedAvatar) {
    throw new Error("Missing Boson avatar asset configuration");
  }

  const imagePath = resolve(liveAvatarDirectory(), selectedAvatar.fileName);
  const imageBuffer = await readFile(imagePath);

  const form = new FormData();
  form.set("model", "higgs-avatar");
  form.set("size", size);
  form.set("ref_image", new Blob([imageBuffer]), selectedAvatar.fileName);
  form.set(
    "input_tts",
    JSON.stringify({
      model: config.ttsModel,
      input: prompt,
      voice: "default",
    }),
  );

  const createResponse = await fetch(BOSON_VIDEOS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: form,
    cache: "no-store",
  });

  if (!createResponse.ok) {
    throw new Error(`Boson video creation failed (${createResponse.status}): ${await readProviderError(createResponse)}`);
  }

  const payload = (await createResponse.json()) as Partial<BosonVideo>;
  if (!payload.id || typeof payload.id !== "string") {
    throw new Error("Boson video response did not include a valid id");
  }

  return {
    id: payload.id,
    status: typeof payload.status === "string" ? payload.status : "queued",
    progress: typeof payload.progress === "number" ? payload.progress : undefined,
    error: payload.error,
  };
}

export async function getBosonVideo(videoId: string): Promise<BosonVideo> {
  const config = getBosonConfig();
  const response = await fetch(`${BOSON_VIDEOS_ENDPOINT}/${videoId}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Boson video status failed (${response.status}): ${await readProviderError(response)}`);
  }

  const payload = (await response.json()) as Partial<BosonVideo>;
  return {
    id: typeof payload.id === "string" ? payload.id : videoId,
    status: typeof payload.status === "string" ? payload.status : "queued",
    progress: typeof payload.progress === "number" ? payload.progress : undefined,
    error: payload.error,
  };
}

export async function getBosonVideoContent(videoId: string): Promise<Response> {
  const config = getBosonConfig();
  const response = await fetch(`${BOSON_VIDEOS_ENDPOINT}/${videoId}/content`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Boson video content failed (${response.status}): ${await readProviderError(response)}`);
  }

  return response;
}
