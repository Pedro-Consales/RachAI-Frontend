import { eErroDaApi, MENSAGEM_INDISPONIVEL, type ErroDaApi } from "@/lib/api/erros";

/**
 * Tratamento visual por tipo de erro (contrato da ADR 0008):
 * - dominio (422): a mensagem do domínio, em destaque, para a pessoa corrigir.
 * - requisicao/nao_encontrado (400/404): erro de aplicação, texto genérico
 *   com o detalhe técnico recolhido.
 * - indisponivel: a API não respondeu.
 */
export function AvisoDeErro({ erro }: { erro: unknown }) {
  if (!erro) return null;

  if (!eErroDaApi(erro)) {
    return <Caixa titulo="Algo deu errado" texto="Recarregue a página e tente de novo." />;
  }

  switch (erro.tipo) {
    case "dominio":
      return (
        <p role="alert" className="rounded-xl border border-divida/40 bg-divida/10 px-4 py-3 text-sm text-divida">
          {erro.message}
        </p>
      );
    case "indisponivel":
      return <Caixa titulo="RachAÍ fora do ar" texto={MENSAGEM_INDISPONIVEL} />;
    default:
      return <ErroDeAplicacao erro={erro} />;
  }
}

function ErroDeAplicacao({ erro }: { erro: ErroDaApi }) {
  return (
    <Caixa titulo="Erro na aplicação" texto="O RachAÍ não conseguiu completar esta ação. Recarregue a página e tente de novo.">
      <details className="mt-2 text-xs text-texto-suave">
        <summary className="cursor-pointer">Detalhes técnicos</summary>
        <code className="mt-1 block font-mono">
          HTTP {erro.status}: {erro.message}
        </code>
      </details>
    </Caixa>
  );
}

function Caixa({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-borda-vidro bg-fundo-1/80 px-4 py-3 text-sm">
      <p className="font-semibold text-texto">{titulo}</p>
      <p className="mt-0.5 text-texto-suave">{texto}</p>
      {children}
    </div>
  );
}
