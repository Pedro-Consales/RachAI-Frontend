import { Suspense } from "react";
import { TelaDePagamentos } from "@/components/grupo/TelaDePagamentos";

/**
 * Página fina; a tela depende de dados buscados no cliente (ver app/grupos/[id]/page.tsx).
 * A tela lê ?de=&para=&valor= com useSearchParams, que pede um Suspense próprio.
 */
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<p aria-busy="true">Carregando…</p>}>
      <TelaDePagamentos />
    </Suspense>
  );
}
