import { expect, test, type Page } from "@playwright/test";
import { comoMembro, contextos, emReais, semente } from "./apoio";
import { botao, campo, escolher, link, selecao, ver } from "./apoio-tela";

test.describe.configure({ mode: "serial" });

const linhas = (page: Page) =>
  page.getByRole("heading", { name: "Despesas", exact: true }).locator("..").locator(":scope > ul > li").filter({ visible: true });

test.describe("Tela 2: Despesas (#4, #5)", () => {
  let page: Page;
  let grupoId: number;

  test.beforeAll(async ({ browser, playwright }) => {
    const ctx = await contextos(browser, playwright);
    const request = ctx.request;
    const api = semente(request);
    const { grupo, m } = await api.grupo("República da Gávea", [{ nome: "Ana" }, { nome: "Bia" }, { nome: "Caio" }]);
    grupoId = grupo.id;
    page = ctx.page;
    await comoMembro(page, grupoId, m.Bia.id, `/grupos/${grupoId}`);
  });

  test("Grupo sem Membros manda adicionar Membros primeiro", async ({ request, page: outra }) => {
    const { grupo } = await semente(request).grupo("Grupo vazio");
    await outra.goto(`/grupos/${grupo.id}/despesas`);
    await ver(outra, "Ainda não há Membros");
  });

  test("a aba leva à tela e o Pagador começa em quem sou eu", async () => {
    await link(page, "Despesas").click();
    await expect(page).toHaveURL(/\/despesas$/);
    await ver(page, "Nenhuma Despesa lançada ainda.");
    await expect(selecao(page, "Pagador").locator("option:checked")).toHaveText("Bia (você)");
  });

  test("Valor em formato inválido dá erro no campo, sem chamar a API", async () => {
    await campo(page, "Descrição").fill("Luz");
    await campo(page, "Valor").fill("abc");
    await botao(page, "Lançar Despesa").click();
    await ver(page, "Use reais com até 2 casas, como 12,34.");
    await expect(linhas(page)).toHaveCount(0);
  });

  test("igualitária R$ 100 entre 3: Cotas 33,34 / 33,33 / 33,33 vindas da API", async () => {
    await escolher(page, "Pagador", "Ana");
    await campo(page, "Valor").fill("100");
    await botao(page, "Lançar Despesa").click();
    await ver(page, "Despesa lançada.");
    await expect(linhas(page)).toHaveCount(1);
    await ver(page, "Pago por Ana");
    await linhas(page).first().getByText("Ver Cotas").click();
    await expect(linhas(page).first().getByText(emReais(3334))).toBeVisible();
    await expect(linhas(page).first().getByText(emReais(3333))).toHaveCount(2);
  });

  test("422: descrição vazia e Divisão sem participantes", async () => {
    await campo(page, "Valor").fill("10");
    await botao(page, "Lançar Despesa").click();
    await ver(page, "A descricao da Despesa nao pode ser vazia.");

    await campo(page, "Descrição").fill("Nada");
    for (const nome of ["Ana", "Bia", "Caio"]) await page.getByRole("checkbox", { name: nome }).uncheck();
    await botao(page, "Lançar Despesa").click();
    await ver(page, "A Divisao precisa de ao menos um Membro.");
  });

  test("Pagador fora da Divisão, com data informada", async () => {
    await page.getByRole("checkbox", { name: "Bia" }).check();
    await page.getByRole("checkbox", { name: "Caio" }).check();
    await campo(page, "Descrição").fill("Gás");
    await campo(page, "Valor").fill("30,00");
    await page.getByLabel("Data").fill("2026-11-01");
    await botao(page, "Lançar Despesa").click();
    await expect(linhas(page)).toHaveCount(2);
    await ver(page, "01/11/2026");
  });

  test("por valores: formato inválido, soma diferente (422) e soma certa", async () => {
    await page.getByRole("radio", { name: "Por valores" }).click();
    await campo(page, "Descrição").fill("Mercado");
    await campo(page, "Valor").fill("50");
    await campo(page, "Cota de Ana").fill("dez");
    await botao(page, "Lançar Despesa").click();
    await ver(page, "Use reais com até 2 casas, como 12,34.");

    await campo(page, "Cota de Ana").fill("10");
    await campo(page, "Cota de Caio").fill("30");
    await botao(page, "Lançar Despesa").click();
    await ver(page, "A soma das Cotas deve ser igual ao Valor da Despesa.");

    await campo(page, "Cota de Caio").fill("40");
    await botao(page, "Lançar Despesa").click();
    await expect(linhas(page)).toHaveCount(3);
    await ver(page, "Mercado");
  });
});
