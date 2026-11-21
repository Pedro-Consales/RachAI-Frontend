import { expect, test, type Page } from "@playwright/test";
import type { SaldosDoGrupo } from "@/lib/api/tipos";
import { comoMembro, contextos, emReais, semente } from "./apoio";
import { botao, campo, escolher, link, selecao, ver } from "./apoio-tela";

test.describe.configure({ mode: "serial" });

test.describe("Tela 4: Pagamento (#7)", () => {
  let page: Page;
  let grupoId: number;
  let ids: Record<string, number>;

  test.beforeAll(async ({ browser, playwright }) => {
    const ctx = await contextos(browser, playwright);
    const request = ctx.request;
    const api = semente(request);
    const { grupo, m } = await api.grupo("República da Gávea", [
      { nome: "Ana", chave_pix: "ana@pix.com" },
      { nome: "Bia" },
      { nome: "Caio" },
    ]);
    grupoId = grupo.id;
    ids = { Ana: m.Ana.id, Bia: m.Bia.id, Caio: m.Caio.id };
    await api.despesaIgualitaria(grupoId, "Luz", 10000, m.Ana.id, [m.Ana.id, m.Bia.id, m.Caio.id]);
    page = ctx.page;
  });

  test("Grupo com um Membro só: faltam Membros", async ({ request, page: outra }) => {
    const { grupo } = await semente(request).grupo("Grupo de um só", [{ nome: "Fê" }]);
    await outra.goto(`/grupos/${grupo.id}/pagamentos`);
    await ver(outra, "Um Pagamento acontece entre dois Membros do Grupo.");
  });

  test("Saldos → 'Registrar Pagamento' abre o formulário preenchido", async ({ request }) => {
    await comoMembro(page, grupoId, ids.Bia, `/grupos/${grupoId}/saldos`);
    await page.getByRole("region", { name: "Seu Saldo" }).getByRole("link", { name: "Registrar Pagamento" }).click();
    await expect(page).toHaveURL(/\/pagamentos\?/);
    const saldos: SaldosDoGrupo = await semente(request).get(`/grupos/${grupoId}/saldos`);
    const t = saldos.transferencias.find((t) => t.de_membro_id === ids.Bia)!;
    expect(new URL(page.url()).searchParams.get("valor")).toBe(String(t.valor_centavos));
    await expect(selecao(page, "Quem pagou").locator("option:checked")).toHaveText("Bia (você)");
    await expect(selecao(page, "Quem recebeu").locator("option:checked")).toHaveText("Ana");
    await expect(campo(page, "Valor")).toHaveValue(emReais(t.valor_centavos));
  });

  test("a Chave Pix do credor fica à mão", async () => {
    await ver(page, "Chave Pix de Ana");
    await ver(page, "ana@pix.com");
    await expect(botao(page, "Copiar Chave Pix")).toBeVisible();
  });

  test("registrar: lista, URL limpa e Saldo de quem pagou zerado", async () => {
    await botao(page, "Registrar Pagamento").click();
    await ver(page, "Pagamento registrado.");
    await expect(page).toHaveURL(/\/pagamentos$/);
    await ver(page, /Bia\s*→\s*pagou para\s*Ana/);
    await ver(page, /Pix ·/);
    await link(page, "Ver Saldos").click();
    await expect(page).toHaveURL(/\/saldos$/);
    await ver(page, "Você está quitado.");
  });

  test("credor sem Chave Pix, Valor inválido e 422 do domínio", async () => {
    await page.goto(`/grupos/${grupoId}/pagamentos`);
    await escolher(page, "Quem recebeu", "Caio");
    await ver(page, "Caio não informou Chave Pix.");

    await campo(page, "Valor").fill("trinta");
    await botao(page, "Registrar Pagamento").click();
    await ver(page, "Use reais com até 2 casas, como 12,34.");

    await campo(page, "Valor").fill("0");
    await botao(page, "Registrar Pagamento").click();
    await ver(page, "O Valor do Pagamento deve ser positivo.");

    await escolher(page, "Quem recebeu", "Bia");
    await campo(page, "Valor").fill("5");
    await botao(page, "Registrar Pagamento").click();
    await ver(page, "Um Membro nao faz Pagamento para ele mesmo.");
  });

  test("Meio Dinheiro aparece na lista", async () => {
    await escolher(page, "Quem pagou", "Caio");
    await escolher(page, "Quem recebeu", "Ana");
    await campo(page, "Valor").fill("10,50");
    await page.getByRole("radio", { name: "Dinheiro" }).click();
    await botao(page, "Registrar Pagamento").click();
    await ver(page, /Caio\s*→\s*pagou para\s*Ana/);
    await ver(page, /Dinheiro ·/);
    await ver(page, emReais(1050));
  });

  test("parâmetros inválidos na URL são ignorados", async () => {
    await page.goto(`/grupos/${grupoId}/pagamentos?de=999&para=abc&valor=-5`);
    await expect(selecao(page, "Quem pagou").locator("option:checked")).toHaveText("Bia (você)");
    await expect(campo(page, "Valor")).toHaveValue("");
  });
});
