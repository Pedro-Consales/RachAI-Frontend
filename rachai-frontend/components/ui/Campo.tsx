import { useId, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  dica?: string;
  /** Mensagem de erro ligada a este campo (ex.: 422 do domínio). */
  erro?: string;
};

/** Input com rótulo, dica e erro, já ligados por aria. */
export function Campo({ rotulo, dica, erro, id, className = "", ...resto }: Props) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const dicaId = dica ? `${campoId}-dica` : undefined;
  const erroId = erro ? `${campoId}-erro` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={campoId} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <input
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[dicaId, erroId].filter(Boolean).join(" ") || undefined}
        className={[
          "h-11 rounded-xl border bg-fundo-1/60 px-3.5 text-texto placeholder:text-white/50",
          "transition-colors duration-200 focus:border-acento focus:outline-none",
          erro ? "border-divida" : "border-borda-vidro",
        ].join(" ")}
        {...resto}
      />
      {dica && !erro && (
        <p id={dicaId} className="text-xs text-texto-suave">
          {dica}
        </p>
      )}
      {erro && (
        <p id={erroId} className="text-xs text-divida">
          {erro}
        </p>
      )}
    </div>
  );
}
