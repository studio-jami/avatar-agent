import toolContracts from "./access-stream.tools.json";
import { opsFeed } from "./feeds/ops-feed";

/**
 * Access stream: the single server-side seam where the avatar's tools, account
 * access, and (later) subagents live. The voice/avatar layer never calls
 * providers directly — it emits a tool intent that is dispatched here.
 *
 * Tool *contracts* (name, description, parameters) live in
 * `access-stream.tools.json` so the same definitions drive the server registry,
 * the client tool wiring, and the agent-sync script. Tool *handlers* live here.
 *
 * To add a capability: add a contract entry to the JSON, then add a handler of
 * the same name below. Keep handlers provider-agnostic.
 */

export type AccessStreamToolContract = {
  name: string;
  description: string;
  parameters?: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
};

export const accessStreamToolContracts = toolContracts as unknown as AccessStreamToolContract[];

export type AccessStreamArgs = Record<string, unknown>;

type AccessStreamHandler = (args: AccessStreamArgs) => Promise<string> | string;

const DEFAULT_TIMEZONE = process.env.AVATAR_DEFAULT_TIMEZONE?.trim() || "America/New_York";

function readString(args: AccessStreamArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "an unscheduled time";
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "an unscheduled time";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(time));
}

function snippet(text: string | null, max = 280): string | null {
  if (!text) return null;
  const clean = text.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

async function resolveAccount(name: string): Promise<{ id: string; name: string } | null> {
  const accounts = await opsFeed.listAccounts(200);
  const needle = name.toLowerCase();
  const match =
    accounts.find((account) => account.name.toLowerCase() === needle) ??
    accounts.find((account) => account.name.toLowerCase().includes(needle));
  return match ? { id: match.id, name: match.name } : null;
}

const handlers: Record<string, AccessStreamHandler> = {
  get_current_time(args) {
    const timezone = readString(args, "timezone") ?? DEFAULT_TIMEZONE;
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "long",
      }).format(new Date());
      return `It is currently ${formatted} (${timezone}).`;
    } catch {
      const fallback = new Intl.DateTimeFormat("en-US", {
        timeZone: DEFAULT_TIMEZONE,
        dateStyle: "full",
        timeStyle: "long",
      }).format(new Date());
      return `'${timezone}' is not a valid timezone, so using ${DEFAULT_TIMEZONE}: it is currently ${fallback}.`;
    }
  },

  list_access_capabilities() {
    const lines = accessStreamToolContracts.map((tool) => `- ${tool.name}: ${tool.description}`);
    return `You currently have ${accessStreamToolContracts.length} access-stream tools wired in:\n${lines.join("\n")}`;
  },

  async get_today_brief() {
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't pull your brief.";
    }

    const [meetings, tasks] = await Promise.all([opsFeed.listMeetings(40), opsFeed.listTasks(40)]);
    const now = Date.now();

    const upcoming = meetings
      .filter((meeting) => meeting.start != null && meeting.start >= now)
      .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
      .slice(0, 5);
    const recent = meetings
      .filter((meeting) => meeting.start != null && meeting.start < now)
      .sort((a, b) => (b.start ?? 0) - (a.start ?? 0))
      .slice(0, 3);
    const openTasks = tasks
      .filter((task) => (task.status ?? "").toLowerCase() !== "done")
      .slice(0, 5);

    const parts: string[] = [];

    if (upcoming.length > 0) {
      parts.push(
        `Upcoming meetings:\n${upcoming
          .map((meeting) => `- ${meeting.title} at ${formatDateTime(meeting.startIso)}`)
          .join("\n")}`,
      );
    } else {
      parts.push("You have no upcoming meetings on the feed.");
      if (recent.length > 0) {
        parts.push(
          `Most recent meetings:\n${recent
            .map((meeting) => `- ${meeting.title} on ${formatDateTime(meeting.startIso)}`)
            .join("\n")}`,
        );
      }
    }

    if (openTasks.length > 0) {
      parts.push(
        `Open tasks:\n${openTasks
          .map((task) => `- ${task.title}${task.dueIso ? ` (due ${formatDateTime(task.dueIso)})` : ""}`)
          .join("\n")}`,
      );
    } else {
      parts.push("No open tasks on the feed.");
    }

    return parts.join("\n\n");
  },

  async find_account(args) {
    const query = readString(args, "query");
    if (!query) {
      return "Tell me which company or account you want me to look up.";
    }
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't look up accounts.";
    }

    const accounts = await opsFeed.listAccounts(200);
    const needle = query.toLowerCase();
    const match =
      accounts.find((account) => account.name.toLowerCase() === needle) ??
      accounts.find((account) => account.name.toLowerCase().includes(needle));

    if (!match) {
      return `I couldn't find an account matching "${query}". There are ${accounts.length} accounts on the feed.`;
    }

    const details: string[] = [`${match.name}`];
    if (match.website) details.push(`Website: ${match.website}`);
    if (match.lastInteractionIso) details.push(`Last interaction: ${formatDateTime(match.lastInteractionIso)}`);
    const status = snippet(match.status);
    if (status) details.push(`Status: ${status}`);
    const notes = snippet(match.notes, 200);
    if (notes) details.push(`Notes: ${notes}`);

    return details.join("\n");
  },

  async list_accounts() {
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't list accounts.";
    }
    const accounts = await opsFeed.listAccounts(200);
    if (accounts.length === 0) return "There are no accounts on the feed yet.";
    const names = accounts.map((account) => account.name).sort((a, b) => a.localeCompare(b));
    return `You're tracking ${accounts.length} accounts:\n${names.map((name) => `- ${name}`).join("\n")}`;
  },

  async find_meeting(args) {
    const query = readString(args, "query");
    if (!query) return "Which meeting should I pull up?";
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't look up meetings.";
    }

    const meetings = await opsFeed.listMeetings(60);
    const needle = query.toLowerCase();
    const match = meetings.find((meeting) => meeting.title.toLowerCase().includes(needle));
    if (!match) {
      return `I couldn't find a meeting matching "${query}".`;
    }

    const details: string[] = [match.title, `When: ${formatDateTime(match.startIso)}`];
    if (match.attendees.length > 0) details.push(`Attendees: ${match.attendees.join(", ")}`);
    const prep = snippet(match.prep, 400);
    if (prep) details.push(`Prep: ${prep}`);
    return details.join("\n");
  },

  async find_contact(args) {
    const query = readString(args, "query");
    if (!query) return "Who should I look up?";
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't look up contacts.";
    }

    const contacts = await opsFeed.listContacts(200);
    const needle = query.toLowerCase();
    const match =
      contacts.find((contact) => contact.name.toLowerCase() === needle) ??
      contacts.find((contact) => contact.name.toLowerCase().includes(needle));

    if (!match) {
      return `I couldn't find a contact matching "${query}". There are ${contacts.length} contacts on the feed.`;
    }

    const details: string[] = [match.name];
    if (match.title) details.push(`Title: ${match.title}`);
    if (match.email) details.push(`Email: ${match.email}`);
    if (match.linkedIn) details.push(`LinkedIn: ${match.linkedIn}`);
    if (match.lastInteractionIso) details.push(`Last interaction: ${formatDateTime(match.lastInteractionIso)}`);
    return details.join("\n");
  },

  async log_note(args) {
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't save notes.";
    }
    const content = readString(args, "note") ?? readString(args, "content");
    if (!content) return "What should the note say?";

    const title = readString(args, "title") ?? (content.length > 60 ? `${content.slice(0, 60)}…` : content);
    const accountName = readString(args, "account");

    let accountId: string | undefined;
    let resolvedName: string | undefined;
    if (accountName) {
      const resolved = await resolveAccount(accountName);
      if (!resolved) {
        return `I couldn't find an account named "${accountName}" to attach the note to. Try without an account, or check the name.`;
      }
      accountId = resolved.id;
      resolvedName = resolved.name;
    }

    await opsFeed.createNote({ title, content, accountId });
    return `Saved a note${resolvedName ? ` on ${resolvedName}` : ""}: "${title}".`;
  },

  async create_task(args) {
    if (!opsFeed.isConfigured()) {
      return "The ops feed isn't connected yet, so I can't create tasks.";
    }
    const title = readString(args, "title");
    if (!title) return "What's the task?";

    const accountName = readString(args, "account");
    const dueAt = readString(args, "due_date");

    let accountId: string | undefined;
    let resolvedName: string | undefined;
    if (accountName) {
      const resolved = await resolveAccount(accountName);
      if (!resolved) {
        return `I couldn't find an account named "${accountName}" to attach the task to.`;
      }
      accountId = resolved.id;
      resolvedName = resolved.name;
    }

    const members = await opsFeed.listMembers(5);
    const assignedTo = members[0]?.id;
    if (!assignedTo) {
      return "I couldn't find a workspace member to assign the task to.";
    }

    await opsFeed.createTask({ title, assignedTo, dueAt, accountId });
    return `Created task "${title}"${resolvedName ? ` on ${resolvedName}` : ""}${dueAt ? `, due ${formatDateTime(dueAt)}` : ""}.`;
  },
};

export function getAccessStreamToolNames(): string[] {
  return accessStreamToolContracts.map((tool) => tool.name);
}

export function hasAccessStreamTool(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(handlers, name);
}

export async function runAccessStreamTool(name: string, args: AccessStreamArgs = {}): Promise<string> {
  const handler = handlers[name];
  if (!handler) {
    throw new Error(`Unknown access stream tool: ${name}`);
  }

  return handler(args);
}
