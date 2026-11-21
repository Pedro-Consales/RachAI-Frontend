import type { Centavos } from "@/lib/api/tipos";
import { formatarValor } from "@/lib/valor";

/**
 * Barra de progresso de Vaquinha. É apresentação e fica no front por decisão
 * explícita: a proporção serve só para desenhar a barra. O total e a Meta vêm
 * prontos da API. Contribuir acima da Meta é permitido (ADR 0005), então a
 * barra para em 100% mas o texto mostra o total real.
 */
export function BarraDeProgresso({ total, meta }: { total: Centavos; meta: Centavos }) {
  const largura = meta > 0 ? Math.min(100, (total * 100) / meta) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={meta}
      aria-valuenow={Math.min(total, meta)}
      aria-valuetext={`${formatarValor(total)} de ${formatarValor(meta)}`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div className="h-full rounded-full bg-acento transition-[width] duration-500" style={{ width: `${largura}%` }} />
    </div>
  );
}
