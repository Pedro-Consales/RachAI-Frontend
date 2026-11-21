"use client";

import { createContext, useContext } from "react";
import type { Grupo, Membro, MembroId } from "@/lib/api/tipos";

export type ContextoDoGrupo = {
  grupo: Grupo;
  /** Busca o Grupo de novo (ex.: depois de adicionar um Membro). */
  recarregar: () => void;
  /** O Membro escolhido como "quem sou eu" neste navegador, se houver. */
  eu: Membro | null;
  escolherEu: (membroId: MembroId | null) => void;
  /** Nome do Membro pelo id, para telas cuja resposta só traz `*_membro_id`. */
  nomeDe: (membroId: MembroId) => string;
};

export const GrupoContexto = createContext<ContextoDoGrupo | null>(null);

export function useGrupo(): ContextoDoGrupo {
  const contexto = useContext(GrupoContexto);
  if (!contexto) throw new Error("useGrupo precisa estar dentro de /grupos/[id].");
  return contexto;
}
