/**
 * Formatação de Valor: centavos ⇄ texto em R$. É apresentação, não regra:
 * não soma, não divide, não arredonda Valor de domínio (ADR 0008).
 */

import type { Centavos } from "./api/tipos";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1234 → "R$ 12,34"; -500 → "-R$ 5,00". */
export function formatarValor(centavos: Centavos): string {
  return BRL.format(centavos / 100);
}

/**
 * Lê o que a pessoa digitou e devolve centavos, ou `null` se não for um
 * número em reais com até 2 casas. Aceita "12", "12,3", "12,34",
 * "1.234,56" e "R$ 12,34". Não valida regra de domínio (ex.: Valor positivo):
 * isso é da API, que responde 422.
 */
export function lerValor(texto: string): Centavos | null {
  const limpo = texto.replace(/R\$|\s/g, "");
  const casa = /^-?(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.exec(limpo);
  if (!casa) return null;
  const negativo = limpo.startsWith("-");
  const [inteiros, fracao = ""] = limpo.replace("-", "").replace(/\./g, "").split(",");
  const centavos = Number(inteiros) * 100 + Number(fracao.padEnd(2, "0"));
  return negativo ? -centavos : centavos;
}
