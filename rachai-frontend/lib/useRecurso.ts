/**
 * Carrega um recurso da API no cliente e expõe o estado da carga.
 * Quem mostra o erro é a tela, com <AvisoDeErro>.
 */

import { useCallback, useEffect, useState } from "react";

export type EstadoDoRecurso<T> =
  | { tipo: "carregando" }
  | { tipo: "ok"; dados: T }
  | { tipo: "erro"; erro: unknown };

export function useRecurso<T>(carregar: () => Promise<T>) {
  const [estado, setEstado] = useState<EstadoDoRecurso<T>>({ tipo: "carregando" });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar().then(
      (dados) => ativo && setEstado({ tipo: "ok", dados }),
      (erro: unknown) => ativo && setEstado({ tipo: "erro", erro }),
    );
    return () => {
      ativo = false;
    };
  }, [carregar, versao]);

  /** Busca de novo sem voltar ao estado "carregando" (evita piscar a tela). */
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return [estado, recarregar] as const;
}
