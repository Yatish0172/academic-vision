import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const python =
  process.env.PYTHON_EXE ||
  path.join(
    root,
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
if (!existsSync(python)) {
  console.error(
    "Python environment missing. Follow README.md setup instructions first.",
  );
  process.exit(1);
}
const backend = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "backend.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8001",
  ],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
const frontend = spawn(
  process.execPath,
  [path.join(root, "node_modules/vite/bin/vite.js")],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  backend.kill();
  frontend.kill();
  setTimeout(() => process.exit(code), 500);
}
for (const child of [backend, frontend]) {
  child.on("error", (error) => {
    console.error(error.message);
    close(1);
  });
  child.on("exit", (code) => {
    if (!closing) close(code || 0);
  });
}
process.on("SIGINT", () => close());
process.on("SIGTERM", () => close());
