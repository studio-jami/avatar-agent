/**
 * Lightfield adapter — the ONLY file that knows Lightfield's API shape.
 *
 * The access stream talks to a provider-neutral `ops-feed` (see ops-feed.ts);
 * Lightfield is today's implementation of that feed. To swap the central
 * bucket later (Notion, Linear, a custom aggregator), add a sibling adapter
 * and point ops-feed at it — no tool contracts or agent config change.
 *
 * Server-only. Reads the key from the host environment; never exposed to the client.
 */

const BASE = process.env.LIGHTFIELD_API_BASE?.trim() || "https://api.lightfield.app/v1";
const VERSION = process.env.LIGHTFIELD_API_VERSION?.trim() || "2026-03-01";

function apiKey(): string {
  return process.env.LIGHTFIELD_API_KEY?.trim() || process.env.LIGHTHOUSE_API_KEY?.trim() || "";
}

export function lightfieldConfigured(): boolean {
  return apiKey().length > 0;
}

type LightfieldField = { valueType?: string; value?: unknown };
type LightfieldEntity = { id: string; createdAt?: string; fields?: Record<string, LightfieldField> };
type LightfieldList = { data?: LightfieldEntity[]; totalCount?: number };

async function lfGet(path: string): Promise<LightfieldList> {
  const key = apiKey();
  if (!key) {
    throw new Error("Lightfield is not configured (missing LIGHTFIELD_API_KEY).");
  }

  const response = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${key}`, "Lightfield-Version": VERSION },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Lightfield ${path} failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as LightfieldList;
}

// Lightfield caps page size at 25; gather up to `max` items via offset paging.
const LF_PAGE_SIZE = 25;

async function lfList(resource: string, max: number): Promise<LightfieldEntity[]> {
  const items: LightfieldEntity[] = [];
  let offset = 0;

  while (items.length < max) {
    const { data = [], totalCount } = await lfGet(`/${resource}?limit=${LF_PAGE_SIZE}&offset=${offset}`);
    items.push(...data);
    offset += LF_PAGE_SIZE;
    if (data.length < LF_PAGE_SIZE) break;
    if (typeof totalCount === "number" && items.length >= totalCount) break;
  }

  return items.slice(0, max);
}

type LightfieldWriteResult = { id: string; httpLink?: string };

async function lfPost(path: string, body: unknown): Promise<LightfieldWriteResult> {
  const key = apiKey();
  if (!key) {
    throw new Error("Lightfield is not configured (missing LIGHTFIELD_API_KEY).");
  }

  const response = await fetch(BASE + path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Lightfield-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Lightfield POST ${path} failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return (await response.json()) as LightfieldWriteResult;
}

function rawValue(entity: LightfieldEntity, key: string): unknown {
  const field = entity.fields?.[key];
  return field && "value" in field ? field.value : null;
}

function stringValue(entity: LightfieldEntity, key: string): string | null {
  const value = rawValue(entity, key);
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function nameValue(entity: LightfieldEntity, key: string): string | null {
  const value = rawValue(entity, key);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as { firstName?: unknown; lastName?: unknown };
    const parts = [record.firstName, record.lastName].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" ");
  }
  return null;
}

function stringArray(entity: LightfieldEntity, key: string): string[] {
  const value = rawValue(entity, key);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
}

function epoch(iso: string | null): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
}

export type FeedMeeting = {
  id: string;
  title: string;
  startIso: string | null;
  start: number | null;
  attendees: string[];
  organizer: string | null;
  url: string | null;
  prep: string | null;
};

export type FeedAccount = {
  id: string;
  name: string;
  status: string | null;
  website: string | null;
  lastInteractionIso: string | null;
  lastInteraction: number | null;
  notes: string | null;
};

export type FeedTask = {
  id: string;
  title: string;
  status: string | null;
  dueIso: string | null;
  due: number | null;
};

export async function listMeetings(limit = 20): Promise<FeedMeeting[]> {
  const data = await lfList("meetings", limit);
  return data.map((entity) => {
    const startIso = stringValue(entity, "$startDate");
    return {
      id: entity.id,
      title: stringValue(entity, "$title") ?? "(untitled meeting)",
      startIso,
      start: epoch(startIso),
      attendees: stringArray(entity, "$attendeeEmails"),
      organizer: stringValue(entity, "$organizerEmail"),
      url: stringValue(entity, "$meetingUrl"),
      prep: stringValue(entity, "$meetingPrep"),
    };
  });
}

export async function listAccounts(limit = 100): Promise<FeedAccount[]> {
  const data = await lfList("accounts", limit);
  return data.map((entity) => {
    const lastInteractionIso = stringValue(entity, "$lastInteractionAt");
    return {
      id: entity.id,
      name: stringValue(entity, "$name") ?? "(unnamed account)",
      status: stringValue(entity, "$accountStatus"),
      website: stringValue(entity, "$website"),
      lastInteractionIso,
      lastInteraction: epoch(lastInteractionIso),
      notes: stringValue(entity, "$notes"),
    };
  });
}

export async function listTasks(limit = 20): Promise<FeedTask[]> {
  const data = await lfList("tasks", limit);
  return data.map((entity) => {
    const dueIso = stringValue(entity, "$dueDate");
    return {
      id: entity.id,
      title: stringValue(entity, "$title") ?? stringValue(entity, "$name") ?? "(untitled task)",
      status: stringValue(entity, "$status"),
      dueIso,
      due: epoch(dueIso),
    };
  });
}

export type FeedContact = {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  linkedIn: string | null;
  lastInteractionIso: string | null;
};

export async function listContacts(limit = 100): Promise<FeedContact[]> {
  const data = await lfList("contacts", limit);
  return data.map((entity) => ({
    id: entity.id,
    name: nameValue(entity, "$name") ?? "(unnamed contact)",
    email: stringValue(entity, "$email"),
    title: stringValue(entity, "$title"),
    linkedIn: stringValue(entity, "$linkedIn"),
    lastInteractionIso: stringValue(entity, "$lastInteractionAt"),
  }));
}

export type FeedMember = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
};

export async function listMembers(limit = 25): Promise<FeedMember[]> {
  const data = await lfList("members", limit);
  return data.map((entity) => ({
    id: entity.id,
    name: nameValue(entity, "$name") ?? "(unnamed member)",
    email: stringValue(entity, "$email"),
    role: stringValue(entity, "$role"),
  }));
}

export async function createNote(input: {
  title: string;
  content?: string;
  accountId?: string;
  contactId?: string;
}): Promise<LightfieldWriteResult> {
  const fields: Record<string, string> = { $title: input.title };
  if (input.content) fields.$content = input.content;

  const relationships: Record<string, string> = {};
  if (input.accountId) relationships.$account = input.accountId;
  if (input.contactId) relationships.$contact = input.contactId;

  const body: Record<string, unknown> = { fields };
  if (Object.keys(relationships).length > 0) body.relationships = relationships;

  return lfPost("/notes", body);
}

export async function createTask(input: {
  title: string;
  assignedTo: string;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETE" | "CANCELLED";
  dueAt?: string;
  accountId?: string;
}): Promise<LightfieldWriteResult> {
  const fields: Record<string, string> = {
    $title: input.title,
    $status: input.status ?? "TODO",
  };
  if (input.dueAt) fields.$dueAt = input.dueAt;

  const relationships: Record<string, string> = { $assignedTo: input.assignedTo };
  if (input.accountId) relationships.$account = input.accountId;

  return lfPost("/tasks", { fields, relationships });
}
