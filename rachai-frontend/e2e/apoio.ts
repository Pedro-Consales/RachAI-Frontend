/** Apoio dos testes: semente de dados pela API e "quem sou eu". */
import { expect, type APIRequestContext, type Browser, type Page, type PlaywrightWorkerArgs } from "@playwright/test";
import type { Grupo, Membro, MembroId, Vaquinha } from "@/lib/api/tipos";

/** Mesma porta do playwright.config.ts. */
export const BASE = "http://localhost:3100";

/**
 * Para usar dentro de beforeAll, onde só existem fixtures de worker:
 * uma página e um cliente da API já apontando para BASE.
 */
export async function contextos(browser: Browser, playwright: PlaywrightWorkerArgs["playwright"]) {
  const page = await browser.newPage({ baseURL: BASE });
  const request = await playwright.request.newContext({ baseURL: BASE });
  return { page, request };
}

/** Formata como a tela formata, mas com espaço comum (o Intl usa espaço não separável). */
export const brl = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100).replace(/ /g, " ");

/** Casa um valor em R$ com qualquer espaço entre "R$" e o número. */
export const emReais = (centavos: number) => new RegExp(brl(centavos).replace("$", "\\$").replace(" ", "\\s"));

export function semente(request: APIRequestContext) {
  const post = async <T>(caminho: string, corpo?: unknown): Promise<T> => {
    const resposta = await request.post(`/api${caminho}`, { data: corpo });
    expect(resposta.ok(), `POST ${caminho}: ${await resposta.text()}`).toBeTruthy();
    return resposta.json();
  };
  const get = async <T>(caminho: string): Promise<T> => (await request.get(`/api${caminho}`)).json();

  return {
    get,
    post,
    async grupo(nome: string, membros: { nome: string; chave_pix?: string }[] = []) {
      const grupo = await post<Grupo>("/grupos", { nome });
      const lista: Record<string, Membro> = {};
      for (const m of membros) lista[m.nome] = await post<Membro>(`/grupos/${grupo.id}/membros`, m);
      return { grupo, m: lista };
    },
    despesaIgualitaria(grupoId: number, descricao: string, valor_centavos: number, pagador_id: MembroId, membros: MembroId[]) {
      return post(`/grupos/${grupoId}/despesas`, {
        descricao,
        valor_centavos,
        pagador_id,
        divisao: { modo: "igualitaria", membros },
      });
    },
    vaquinha(grupoId: number, titulo: string, meta_centavos: number, beneficiario_id: MembroId) {
      return post<Vaquinha>(`/grupos/${grupoId}/vaquinhas`, { titulo, descricao: "", meta_centavos, beneficiario_id });
    },
    contribuir(grupoId: number, vaquinhaId: number, membro_id: MembroId, valor_centavos: number) {
      return post(`/grupos/${grupoId}/vaquinhas/${vaquinhaId}/contribuicoes`, { membro_id, valor_centavos, meio: "pix" });
    },
  };
}

/** Define "quem sou eu" no localStorage (como a tela de Membros faz) e abre o caminho pedido. */
export async function comoMembro(page: Page, grupoId: number, membroId: MembroId | null, caminho: string) {
  await page.goto(`/grupos/${grupoId}`);
  await page.evaluate(
    ([chave, valor]) => (valor === null ? localStorage.removeItem(chave) : localStorage.setItem(chave, valor)),
    [`rachai:eu:${grupoId}`, membroId === null ? null : String(membroId)] as const,
  );
  await page.goto(caminho);
}
