import type { Centavos } from "@/lib/api/tipos";
import { formatarValor } from "@/lib/valor";

type Props = {
  centavos: Centavos;
  /**
   * "saldo" colore pelo sinal que veio da API: positivo = crédito (verde),
   * negativo = dívida (vermelho), zero = quitado (verde). Não calcula nada.
   */
  modo?: "neutro" | "saldo";
  className?: string;
};

/** Valor monetário em fonte tabular, para colunas alinharem. */
export function Dinheiro({ centavos, modo = "neutro", className = "" }: Props) {
  const cor =
    modo === "saldo" ? (centavos < 0 ? "text-divida" : "text-credito") : "text-texto";
  return (
    <span className={`tabular-nums tracking-tight whitespace-nowrap ${cor} ${className}`}>{formatarValor(centavos)}</span>
  );
}
