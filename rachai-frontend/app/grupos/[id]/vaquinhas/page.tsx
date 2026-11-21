import { TelaDeVaquinhas } from "@/components/grupo/TelaDeVaquinhas";

/** Página fina; a tela depende de dados buscados no cliente (ver app/grupos/[id]/page.tsx). */
export const instant = false;

export default function Page() {
  return <TelaDeVaquinhas />;
}
