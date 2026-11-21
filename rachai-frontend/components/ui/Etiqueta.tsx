import type { ReactNode } from "react";

/**
 * Badge. "credito" e "divida" seguem a regra de cor: verde só para crédito
 * e quitado, vermelho só para dívida e erro.
 */
type Tom = "neutro" | "acento" | "credito" | "divida";

const TONS: Record<Tom, string> = {
  neutro: "border-borda-vidro bg-vidro text-texto-suave",
  acento: "border-acento/40 bg-acento/10 text-acento",
  credito: "border-credito/40 bg-credito/10 text-credito",
  divida: "border-divida/40 bg-divida/10 text-divida",
};

export function Etiqueta({ tom = "neutro", children }: { tom?: Tom; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONS[tom]}`}
    >
      {children}
    </span>
  );
}
