import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const python = path.join(
  root,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
const dataDir = mkdtempSync(path.join(tmpdir(), "academic-vision-browser-"));
const backend = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "backend.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8011",
  ],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      FACE_ATTENDANCE_DATA_DIR: dataDir,
      ALLOWED_ORIGINS: "http://127.0.0.1:3011",
    },
  },
);
const frontend = spawn(
  process.execPath,
  [path.join(root, "node_modules/vite/bin/vite.js"), "--port", "3011"],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, API_TARGET: "http://127.0.0.1:8011" },
  },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill();
  frontend.kill();
  setTimeout(() => process.exit(code), 300);
}
for (const child of [backend, frontend]) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
