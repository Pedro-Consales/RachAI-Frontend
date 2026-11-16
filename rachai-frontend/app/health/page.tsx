"use client";

import { useCallback, useEffect, useState } from "react";

type HealthResponse = {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
  timestamp: string;
};

type HealthState =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse; httpStatus: number; latencyMs: number }
  | { kind: "error"; message: string };

// Chamada relativa: o rewrite em next.config.ts encaminha /api/* para o Flask.
async function fetchHealth(): Promise<HealthState> {
  const start = performance.now();
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const latencyMs = Math.round(performance.now() - start);
    const data = (await response.json()) as HealthResponse;
    return { kind: "success", data, httpStatus: response.status, latencyMs };
  } catch {
    return {
      kind: "error",
      message: "Não foi possível conectar à API. O backend Flask está rodando na porta 5000?",
    };
  }
}

export default function HealthPage() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  const check = useCallback(async () => {
    setState({ kind: "loading" });
    setState(await fetchHealth());
  }, []);

  useEffect(() => {
    let active = true;
    fetchHealth().then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const healthy = state.kind === "success" && state.data.status === "ok";

  const badge =
    state.kind === "loading"
      ? { label: "Verificando…", className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" }
      : healthy
        ? { label: "Online", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" }
        : { label: "Com problema", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <section className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Status da API</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="mt-6 text-sm">
          {state.kind === "loading" && <p className="text-zinc-500">Consultando GET /api/health…</p>}

          {state.kind === "error" && <p className="text-red-700 dark:text-red-400">{state.message}</p>}

          {state.kind === "success" && (
            <dl className="grid grid-cols-2 gap-y-3">
              <dt className="text-zinc-500">HTTP</dt>
              <dd className="font-mono">{state.httpStatus}</dd>
              <dt className="text-zinc-500">API</dt>
              <dd className="font-mono">{state.data.status}</dd>
              <dt className="text-zinc-500">Banco de dados</dt>
              <dd className="font-mono">{state.data.database}</dd>
              <dt className="text-zinc-500">Latência</dt>
              <dd className="font-mono">{state.latencyMs} ms</dd>
              <dt className="text-zinc-500">Verificado em</dt>
              <dd className="font-mono">{new Date(state.data.timestamp).toLocaleTimeString("pt-BR")}</dd>
            </dl>
          )}
        </div>

        <button
          type="button"
          onClick={check}
          disabled={state.kind === "loading"}
          className="mt-8 h-11 w-full rounded-full bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          Verificar novamente
        </button>
      </section>
    </main>
  );
}
