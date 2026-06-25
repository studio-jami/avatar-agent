import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readDotEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        if (!line.trim() || line.trimStart().startsWith("#")) {
          return [];
        }

        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) {
          return [];
        }

        return [[match[1], (match[2] ?? "").replace(/^['"]|['"]$/g, "").trim()]];
      }),
  );
}

const env = {
  ...process.env,
  ...readDotEnv(resolve(process.cwd(), ".env")),
};

const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "pnpm --filter @studio-jami/avatar-agent-web dev"]
  : ["--filter", "@studio-jami/avatar-agent-web", "dev"];

const child = spawn(command, args, {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 0);
});