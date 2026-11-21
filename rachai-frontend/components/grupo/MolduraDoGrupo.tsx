"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useCallback, useMemo, type ReactNode } from "react";
import { AvisoDeErro, BotaoCopiar, Cartao } from "@/components/ui";
import { eErroDaApi } from "@/lib/api/erros";
import { api } from "@/lib/api/rachai";
import type { GrupoId, MembroId } from "@/lib/api/tipos";
import { useEu } from "@/lib/eu";
import { useRecurso } from "@/lib/useRecurso";
import { GrupoContexto, useGrupo, type ContextoDoGrupo } from "./GrupoContexto";

/** Abas do Grupo. Cada tela nova entra aqui no PR dela. */
const ABAS = [
  { caminho: "", rotulo: "Membros" },
  { caminho: "/despesas", rotulo: "Despesas" },
] as const;

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export function MolduraDoGrupo({ params, children }: Props) {
  const { id } = use(params);
  const grupoId = /^\d+$/.test(id) ? Number(id) : null;

  if (grupoId === null) return <GrupoNaoEncontrado />;
  return <GrupoCarregado grupoId={grupoId}>{children}</GrupoCarregado>;
}

function GrupoCarregado({ grupoId, children }: { grupoId: GrupoId; children: ReactNode }) {
  const carregar = useCallback(() => api.grupos.consultar(grupoId), [grupoId]);
  const [estado, recarregar] = useRecurso(carregar);
  const [euId, escolherEu] = useEu(grupoId);

  const contexto = useMemo<ContextoDoGrupo | null>(() => {
    if (estado.tipo !== "ok") return null;
    const grupo = estado.dados;
    const porId = new Map(grupo.membros.map((m) => [m.id, m]));
    return {
      grupo,
      recarregar,
      eu: euId === null ? null : (porId.get(euId) ?? null),
      escolherEu,
      nomeDe: (membroId: MembroId) => porId.get(membroId)?.nome ?? `Membro ${membroId}`,
    };
  }, [estado, recarregar, euId, escolherEu]);

  if (estado.tipo === "carregando") return <CarregandoGrupo />;

  if (estado.tipo === "erro") {
    // Exceção combinada: aqui o 404 vem de um código digitado ou de um link, então é erro da pessoa.
    if (eErroDaApi(estado.erro) && estado.erro.tipo === "nao_encontrado") return <GrupoNaoEncontrado />;
    return (
      <Pagina>
        <AvisoDeErro erro={estado.erro} />
      </Pagina>
    );
  }

  return (
    <GrupoContexto.Provider value={contexto}>
      <Pagina>
        <Cabecalho />
        <Abas grupoId={grupoId} />
        {children}
      </Pagina>
    </GrupoContexto.Provider>
  );
}

function Cabecalho() {
  const { grupo, eu } = useGrupo();
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm font-medium text-acento hover:underline">
          RachAÍ
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{grupo.nome}</h1>
        <p>
          Código do Grupo: <span className="font-semibold tabular-nums text-texto">{grupo.id}</span>
          {eu && (
            <>
              {" · "}Você é <span className="font-medium text-texto">{eu.nome}</span>
            </>
          )}
        </p>
      </div>
      <BotaoCopiar texto={() => `${window.location.origin}/grupos/${grupo.id}`} rotulo="Copiar link do Grupo" />
    </header>
  );
}

function Abas({ grupoId }: { grupoId: GrupoId }) {
  const caminhoAtual = usePathname();
  return (
    <nav aria-label="Seções do Grupo" className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(255_255_255/0.1)] [scrollbar-width:none]">
      {ABAS.map((aba) => {
        const href = `/grupos/${grupoId}${aba.caminho}`;
        const ativa = caminhoAtual === href;
        return (
          <Link
            key={aba.rotulo}
            href={href}
            aria-current={ativa ? "page" : undefined}
            className={[
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              ativa ? "border-acento text-texto" : "border-transparent hover:text-texto",
            ].join(" ")}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

function Pagina({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">{children}</main>;
}

export function CarregandoGrupo() {
  return (
    <Pagina>
      <p aria-busy="true">Carregando o Grupo…</p>
    </Pagina>
  );
}

function GrupoNaoEncontrado() {
  return (
    <Pagina>
      <Cartao className="flex flex-col items-start gap-3">
        <h1 className="text-xl font-semibold">Grupo não encontrado</h1>
        <p>Confira o código ou o link que você recebeu.</p>
        <Link href="/" className="font-semibold text-acento hover:underline">
          Voltar ao início
        </Link>
      </Cartao>
    </Pagina>
  );
}
