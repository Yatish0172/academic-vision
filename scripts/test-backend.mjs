import { spawnSync } from "node:child_process";
import path from "node:path";
const python =
  process.env.PYTHON_EXE ||
  path.join(
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
const result = spawnSync(python, ["-m", "pytest", "tests", "-q"], {
  stdio: "inherit",
  windowsHide: true,
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
