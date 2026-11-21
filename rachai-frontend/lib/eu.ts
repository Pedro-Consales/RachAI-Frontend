/**
 * "Quem sou eu" (ADR 0001): não há login. A pessoa escolhe qual Membro ela é
 * na lista do Grupo, e a escolha fica só neste navegador, por Grupo.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { GrupoId, MembroId } from "./api/tipos";

const chave = (grupoId: GrupoId) => `rachai:eu:${grupoId}`;
const EVENTO = "rachai:eu";

function ler(grupoId: GrupoId): MembroId | null {
  try {
    const valor = Number(localStorage.getItem(chave(grupoId)));
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function assinar(aoMudar: () => void) {
  window.addEventListener("storage", aoMudar);
  window.addEventListener(EVENTO, aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener(EVENTO, aoMudar);
  };
}

/** Id do Membro escolhido neste navegador (ou null) e a função para trocar. */
export function useEu(grupoId: GrupoId) {
  const euId = useSyncExternalStore(
    assinar,
    () => ler(grupoId),
    () => null,
  );

  const escolher = useCallback(
    (membroId: MembroId | null) => {
      try {
        if (membroId === null) localStorage.removeItem(chave(grupoId));
        else localStorage.setItem(chave(grupoId), String(membroId));
      } catch {
        // Sem localStorage (aba privada bloqueada): a escolha não persiste.
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [grupoId],
  );

  return [euId, escolher] as const;
}
