import type { Meio } from "./api/tipos";

/** Rótulo de cada Meio (ADR 0007). O Meio é declarado pelo Membro, nunca confirmado. */
export const ROTULO_DO_MEIO: Record<Meio, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  outro: "Outro",
};
