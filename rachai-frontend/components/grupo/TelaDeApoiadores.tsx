"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useGrupo } from "@/components/grupo/GrupoContexto";
import { AvisoDeErro, Cartao, Dinheiro, Etiqueta } from "@/components/ui";
import { api } from "@/lib/api/rachai";
import type { Apoiador } from "@/lib/api/tipos";
import { useRecurso } from "@/lib/useRecurso";

/** Quantas primeiras posições ganham o destaque visual (ADR 0006: selo é apresentação no front). */
const POSICOES_EM_DESTAQUE = 3;

/**
 * Tela 6 (#9): Reconhecimento de ajuda.
 * A lista já vem ordenada pela API (total contribuído, Vaquinhas apoiadas,
 * nome; ADR 0006). A posição exibida é só o índice dessa lista: o front não
 * ordena, não soma e não desempata.
 */
export function TelaDeApoiadores() {
  const { grupo } = useGrupo();
  const carregar = useCallback(() => api.apoiadores.consultar(grupo.id), [grupo.id]);
  const [estado] = useRecurso(carregar);

  return (
    <Cartao className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Reconhecimento de ajuda</h2>
        <p className="text-sm">
          Quem mais ajudou o Grupo com Contribuições em Vaquinhas. Pagar Despesas ou fazer Pagamentos não conta como
          ajuda.
        </p>
      </div>

      {estado.tipo === "carregando" && <p aria-busy="true">Carregando Apoiadores…</p>}
      {estado.tipo === "erro" && <AvisoDeErro erro={estado.erro} />}
      {estado.tipo === "ok" &&
        (estado.dados.length === 0 ? (
          <p>
            Ninguém contribuiu ainda. Quem contribuir numa{" "}
            <Link href={`/grupos/${grupo.id}/vaquinhas`} className="font-semibold text-acento hover:underline">
              Vaquinha
            </Link>{" "}
            aparece aqui.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-white/10">
            {estado.dados.map((apoiador, indice) => (
              <LinhaDoApoiador key={apoiador.membro_id} apoiador={apoiador} posicao={indice + 1} />
            ))}
          </ol>
        ))}
    </Cartao>
  );
}

function LinhaDoApoiador({ apoiador: a, posicao }: { apoiador: Apoiador; posicao: number }) {
  const { eu } = useGrupo();
  const destaque = posicao <= POSICOES_EM_DESTAQUE;

  return (
    <li className="flex items-center gap-4 py-3">
      <span className="sr-only">{posicao}º lugar: </span>
      <span
        aria-hidden="true"
        className={[
          "flex size-10 shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums",
          destaque ? "border-acento bg-acento/15 text-acento" : "border-borda-vidro text-texto-suave",
        ].join(" ")}
      >
        {posicao}º
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 font-medium text-texto">
          {a.nome}
          {a.membro_id === eu?.id && <Etiqueta tom="acento">Você</Etiqueta>}
        </span>
        <span className="text-sm">
          Apoiou {a.vaquinhas_apoiadas} {a.vaquinhas_apoiadas === 1 ? "Vaquinha" : "Vaquinhas"}
        </span>
      </div>
      <Dinheiro centavos={a.total_contribuido_centavos} className="font-semibold" />
    </li>
  );
}
