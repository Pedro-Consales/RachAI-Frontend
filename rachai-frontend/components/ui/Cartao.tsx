import type { ComponentPropsWithoutRef, ElementType } from "react";

type Props<T extends ElementType> = {
  as?: T;
  /** Realça a borda e o fundo no hover. Use em cartões clicáveis ou de lista. */
  interativo?: boolean;
} & ComponentPropsWithoutRef<T>;

/** Cartão de vidro: base visual de todo bloco de conteúdo. */
export function Cartao<T extends ElementType = "section">({
  as,
  interativo = false,
  className = "",
  ...resto
}: Props<T>) {
  const Tag = as ?? "section";
  return (
    <Tag
      className={[
        "rounded-cartao border border-borda-vidro bg-vidro p-6 shadow-vidro backdrop-blur-[16px]",
        "transition-colors duration-200",
        interativo ? "hover:border-white/30 hover:bg-vidro-forte" : "",
        className,
      ].join(" ")}
      {...resto}
    />
  );
}
