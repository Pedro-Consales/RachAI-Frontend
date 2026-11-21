import { useId } from "react";

/** Grupo de opções em pílulas (role=radiogroup), para poucas escolhas exclusivas. */
export function EscolhaDeOpcao<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: readonly { valor: T; rotulo: string }[];
  valor: T;
  aoEscolher: (valor: T) => void;
}) {
  const rotuloId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={rotuloId} className="text-sm font-medium text-texto">
        {rotulo}
      </span>
      <div role="radiogroup" aria-labelledby={rotuloId} className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const marcado = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => aoEscolher(opcao.valor)}
              className={[
                "h-9 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                marcado
                  ? "border-acento bg-acento/15 text-acento"
                  : "border-borda-vidro text-texto-suave hover:text-texto",
              ].join(" ")}
            >
              {opcao.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
