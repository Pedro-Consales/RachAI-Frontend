// Sobe o backend Flask do RachAÍ com um banco SQLite novo, só para os testes.
// Usado pelo `webServer` do playwright.config.ts. O banco real do backend não é tocado.
//
// BACKEND_DIR: pasta do backend (padrão: ../../inf1041-trabalho-a2, a pasta irmã do repo).
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const backend = resolve(process.env.BACKEND_DIR ?? join(import.meta.dirname, "..", "..", "..", "inf1041-trabalho-a2"));
const python = [join(backend, ".venv", "Scripts", "python.exe"), join(backend, ".venv", "bin", "python")].find(existsSync);

if (!python) {
  console.error(`Não achei o ambiente Python do backend em ${backend}/.venv. Veja o README do backend.`);
  process.exit(1);
}

const banco = join(tmpdir(), "rachai-e2e.db");
rmSync(banco, { force: true });

const flask = spawn(
  python,
  ["-c", `from app.main import create_app; create_app(${JSON.stringify(banco)}).run(port=5000)`],
  { cwd: backend, stdio: "inherit" },
);
flask.on("exit", (codigo) => process.exit(codigo ?? 0));
for (const sinal of ["SIGINT", "SIGTERM"]) process.on(sinal, () => flask.kill());
