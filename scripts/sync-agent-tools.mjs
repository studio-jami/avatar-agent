// Sync the access-stream tool contracts to the ElevenLabs agent as client tools.
//
// Source of truth: apps/web/app/lib/access-stream.tools.json
// This registers each contract as a `client` tool and attaches it to the agent
// referenced by ELEVENLABS_AGENT_ID, so the agent profile is reproducible from
// the repo instead of living only in the ElevenLabs dashboard.
//
// Usage:
//   node scripts/sync-agent-tools.mjs            # apply
//   node scripts/sync-agent-tools.mjs --dry-run  # preview only

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const BASE = "https://api.elevenlabs.io";
const DRY_RUN = process.argv.includes("--dry-run");

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        if (!line.trim() || line.trimStart().startsWith("#")) return [];
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) return [];
        return [[match[1], (match[2] ?? "").replace(/^['"]|['"]$/g, "").trim()]];
      }),
  );
}

const env = { ...readDotEnv(resolve(repoRoot, ".env")), ...process.env };
const API_KEY = env.ELEVENLABS_API_KEY || env.ELEVEN_LABS_API_KEY;
const AGENT_ID = env.ELEVENLABS_AGENT_ID;

if (!API_KEY || !AGENT_ID) {
  console.error("Missing ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID in .env. Aborting.");
  process.exit(1);
}

const contractsPath = resolve(repoRoot, "apps/web/app/lib/access-stream.tools.json");
const contracts = JSON.parse(readFileSync(contractsPath, "utf8"));
const managedNames = new Set(contracts.map((c) => c.name));

async function api(method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = text;
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }
  return payload;
}

function toClientToolBody(contract) {
  return {
    tool_config: {
      type: "client",
      name: contract.name,
      description: contract.description,
      response_timeout_secs: 20,
      expects_response: true,
      execution_mode: "immediate",
      parameters: contract.parameters ?? { type: "object", properties: {}, required: [] },
    },
  };
}

async function main() {
  console.log(`Access-stream tool sync${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`  agent: ${AGENT_ID}`);
  console.log(`  contracts: ${contracts.map((c) => c.name).join(", ")}\n`);

  const existing = await api("GET", "/v1/convai/tools");
  const existingTools = existing.tools ?? [];
  const byName = new Map();
  for (const tool of existingTools) {
    byName.set(tool.tool_config?.name, tool);
  }

  const managedIds = [];
  for (const contract of contracts) {
    const body = toClientToolBody(contract);
    const current = byName.get(contract.name);

    if (current && current.tool_config?.type === "client") {
      console.log(`  update client tool: ${contract.name} [${current.id}]`);
      if (!DRY_RUN) await api("PATCH", `/v1/convai/tools/${current.id}`, body);
      managedIds.push(current.id);
    } else if (current) {
      console.log(`  ! '${contract.name}' exists as type='${current.tool_config?.type}', not 'client'. Skipping rewrite; leaving as-is.`);
      managedIds.push(current.id);
    } else {
      console.log(`  create client tool: ${contract.name}`);
      if (DRY_RUN) {
        managedIds.push(`(new:${contract.name})`);
      } else {
        const created = await api("POST", "/v1/convai/tools", body);
        managedIds.push(created.id);
      }
    }
  }

  // Resolve which existing tool ids are "name-managed" so stale duplicates are dropped.
  const nameManagedIds = new Set(
    existingTools.filter((t) => managedNames.has(t.tool_config?.name)).map((t) => t.id),
  );

  const agent = await api("GET", `/v1/convai/agents/${AGENT_ID}`);
  const currentToolIds = agent.conversation_config?.agent?.prompt?.tool_ids ?? [];
  const keepFromCurrent = currentToolIds.filter((id) => !nameManagedIds.has(id));
  const finalToolIds = Array.from(new Set([...keepFromCurrent, ...managedIds]));

  console.log(`\n  agent tool_ids: ${JSON.stringify(currentToolIds)} -> ${JSON.stringify(finalToolIds)}`);

  if (!DRY_RUN) {
    await api("PATCH", `/v1/convai/agents/${AGENT_ID}`, {
      conversation_config: { agent: { prompt: { tool_ids: finalToolIds } } },
    });
    console.log("\nDone. Agent now exposes the access-stream client tools.");
  } else {
    console.log("\nDry run complete. No changes were made.");
  }
}

main().catch((error) => {
  console.error("\nSync failed:", error.message);
  process.exit(1);
});
