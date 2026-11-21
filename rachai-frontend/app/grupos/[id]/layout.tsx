import { Suspense } from "react";
import { CarregandoGrupo, MolduraDoGrupo } from "@/components/grupo/MolduraDoGrupo";

/**
 * Carrega o Grupo uma vez e o entrega às telas por contexto (useGrupo).
 * Com cacheComponents, o acesso a `params` precisa de Suspense.
 */
export default function LayoutDoGrupo({ params, children }: LayoutProps<"/grupos/[id]">) {
  return (
    <Suspense fallback={<CarregandoGrupo />}>
      <MolduraDoGrupo params={params}>{children}</MolduraDoGrupo>
    </Suspense>
  );
}
