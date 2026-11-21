/**
 * Única porta de saída HTTP do front. Toda chamada à API passa por aqui.
 *
 * Os caminhos são relativos (`/api/...`): o rewrite de `next.config.ts`
 * encaminha para o Flask, o que dispensa CORS (ADR 0008). Por isso o cliente
 * é feito para rodar no navegador, em Client Components.
 */

import { ErroDaApi, MENSAGEM_INDISPONIVEL, tipoPorStatus } from "./erros";

type Metodo = "GET" | "POST";

async function requisitar<T>(
  metodo: Metodo,
  caminho: string,
  corpo?: unknown,
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      cache: "no-store",
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroDaApi("indisponivel", MENSAGEM_INDISPONIVEL);
  }

  const dados = await lerJson(resposta);

  if (resposta.ok) {
    if (dados === SEM_JSON) {
      throw new ErroDaApi("indisponivel", MENSAGEM_INDISPONIVEL, resposta.status);
    }
    return dados as T;
  }

  if (temMensagemDeErro(dados)) {
    throw new ErroDaApi(tipoPorStatus(resposta.status), dados.erro, resposta.status);
  }
  throw new ErroDaApi("indisponivel", MENSAGEM_INDISPONIVEL, resposta.status);
}

const SEM_JSON = Symbol("sem-json");

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    return SEM_JSON;
  }
}

function temMensagemDeErro(dados: unknown): dados is { erro: string } {
  return (
    typeof dados === "object" &&
    dados !== null &&
    typeof (dados as { erro?: unknown }).erro === "string"
  );
}

export const http = {
  get: <T>(caminho: string) => requisitar<T>("GET", caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisitar<T>("POST", caminho, corpo),
};
