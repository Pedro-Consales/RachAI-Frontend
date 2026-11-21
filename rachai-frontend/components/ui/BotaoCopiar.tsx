"use client";

import { useState } from "react";
import { Botao } from "./Botao";

type Props = {
  /** O texto, ou uma função que o monta na hora do clique. */
  texto: string | (() => string);
  rotulo?: string;
  variante?: "secundario" | "fantasma";
  className?: string;
};

/** Copia um texto (link do Grupo, Chave Pix) e confirma por 2 s. */
export function BotaoCopiar({ texto, rotulo = "Copiar", variante = "secundario", className }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(typeof texto === "function" ? texto() : texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua visível na tela.
    }
  }

  return (
    <Botao variante={variante} onClick={copiar} className={className} aria-live="polite">
      {copiado ? "Copiado!" : rotulo}
    </Botao>
  );
}
