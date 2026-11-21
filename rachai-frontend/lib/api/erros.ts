/**
 * Contrato de erro da API (ADR 0008): o corpo é `{"erro": "mensagem"}`.
 *
 * Cada status vira um `tipo` com um tratamento visual distinto:
 * - "dominio" (422): regra de negócio violada. A mensagem é do domínio e vai
 *   para o usuário como está.
 * - "requisicao" (400) e "nao_encontrado" (404): erro de aplicação, ou seja,
 *   o front mandou algo errado ou apontou para um recurso que não existe.
 * - "indisponivel": a API não respondeu com o contrato (Flask fora do ar,
 *   proxy devolvendo HTML, 5xx). Não faz parte da ADR: é falha de infra.
 */

export type TipoDeErro =
  | "dominio"
  | "requisicao"
  | "nao_encontrado"
  | "indisponivel";

export class ErroDaApi extends Error {
  readonly tipo: TipoDeErro;
  /** Status HTTP; ausente quando nem houve resposta (falha de rede). */
  readonly status?: number;

  constructor(tipo: TipoDeErro, mensagem: string, status?: number) {
    super(mensagem);
    this.name = "ErroDaApi";
    this.tipo = tipo;
    this.status = status;
  }
}

export function eErroDaApi(erro: unknown): erro is ErroDaApi {
  return erro instanceof ErroDaApi;
}

/** Dado um status com corpo `{erro}`, diz o tipo. */
export function tipoPorStatus(status: number): TipoDeErro {
  switch (status) {
    case 422:
      return "dominio";
    case 404:
      return "nao_encontrado";
    case 400:
    case 405:
      return "requisicao";
    default:
      return "indisponivel";
  }
}

export const MENSAGEM_INDISPONIVEL =
  "Não foi possível falar com o RachAÍ agora. Tente de novo em instantes.";
