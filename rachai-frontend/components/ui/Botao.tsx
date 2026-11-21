import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-acento text-fundo-1 hover:bg-acento-forte",
  secundario: "border border-borda-vidro bg-vidro text-texto hover:bg-vidro-forte",
  fantasma: "text-texto-suave hover:text-texto hover:bg-vidro",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  carregando?: boolean;
};

export function Botao({
  variante = "primario",
  carregando = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold",
        "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        className,
      ].join(" ")}
      {...resto}
    >
      {carregando ? "Aguarde…" : children}
    </button>
  );
}
