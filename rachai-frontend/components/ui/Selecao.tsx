import { useId, type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  rotulo: string;
  dica?: string;
};

/** Select com rótulo, no mesmo visual do Campo. */
export function Selecao({ rotulo, dica, id, className = "", children, ...resto }: Props) {
  const gerado = useId();
  const selecaoId = id ?? gerado;
  const dicaId = dica ? `${selecaoId}-dica` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={selecaoId} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <select
        id={selecaoId}
        aria-describedby={dicaId}
        className="h-11 rounded-xl border border-borda-vidro bg-fundo-1/60 px-3 text-texto transition-colors duration-200 focus:border-acento focus:outline-none"
        {...resto}
      >
        {children}
      </select>
      {dica && (
        <p id={dicaId} className="text-xs text-texto-suave">
          {dica}
        </p>
      )}
    </div>
  );
}
