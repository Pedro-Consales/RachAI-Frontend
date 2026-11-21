import { TelaDeMembros } from "@/components/grupo/TelaDeMembros";

/**
 * Página fina no servidor; a tela é Client Component. A tela só renderiza
 * depois que o Grupo chega pelo proxy /api, no cliente (ADR 0008), então a
 * navegação até ela não é instantânea por natureza. Por isso o opt-out.
 */
export const instant = false;

export default function Page() {
  return <TelaDeMembros />;
}
