import { expect, test, type Page } from "@playwright/test";
import type { Vaquinha } from "@/lib/api/tipos";
import { comoMembro, contextos, emReais, semente } from "./apoio";
import { botao, campo, escolher, link, selecao, ver } from "./apoio-tela";

test.describe.configure({ mode: "serial" });

test.describe("Tela 5: Vaquinhas (#8)", () => {
  let page: Page;
  let grupoId: number;
  let ids: Record<string, number>;
  const barra = () => page.getByRole("progressbar").filter({ visible: true }).first();

  test.beforeAll(async ({ browser, playwright }) => {
    const ctx = await contextos(browser, playwright);
    const request = ctx.request;
    const { grupo, m } = await semente(request).grupo("República da Gávea", [{ nome: "Ana" }, { nome: "Bia" }, { nome: "Caio" }]);
    grupoId = grupo.id;
    ids = { Ana: m.Ana.id, Bia: m.Bia.id, Caio: m.Caio.id };
    page = ctx.page;
    await comoMembro(page, grupoId, ids.Bia, `/grupos/${grupoId}/vaquinhas`);
  });

  test("lista vazia e aba ativa", async () => {
    await ver(page, /Nenhuma Vaquinha aberta ainda/);
    await expect(link(page, "Vaquinhas")).toHaveAttribute("aria-current", "page");
  });

  test("Meta inválida, Meta zero (422) e título vazio (422)", async () => {
    await campo(page, "Título").fill("Geladeira nova");
    await campo(page, "Meta").fill("trezentos");
    await botao(page, "Abrir Vaquinha").click();
    await ver(page, "Use reais com até 2 casas, como 12,34.");

    await campo(page, "Meta").fill("0");
    await botao(page, "Abrir Vaquinha").click();
    await ver(page, "A Meta da Vaquinha deve ser positiva.");

    await campo(page, "Título").fill("");
    await campo(page, "Meta").fill("300");
    await botao(page, "Abrir Vaquinha").click();
    await ver(page, "O titulo da Vaquinha nao pode ser vazio.");
  });

  test("abrir Vaquinha para a Ana: barra zerada", async () => {
    await campo(page, "Título").fill("Geladeira nova");
    await campo(page, "Descrição").fill("A antiga parou de gelar.");
    await campo(page, "Meta").fill("300");
    await escolher(page, "Beneficiário", "Ana");
    await botao(page, "Abrir Vaquinha").click();
    await ver(page, "Para Ana");
    await expect(barra()).toHaveAttribute("aria-valuenow", "0");
  });

  test("contribuir: total e barra vêm da API", async ({ request }) => {
    await campo(page, "Valor da Contribuição").fill("50");
    await botao(page, "Contribuir").click();
    await ver(page, "Contribuições (1)");
    const [v]: Vaquinha[] = await semente(request).get(`/grupos/${grupoId}/vaquinhas`);
    expect(v.total_arrecadado_centavos).toBe(5000);
    await expect(barra()).toHaveAttribute("aria-valuenow", "5000");
    await ver(page, emReais(5000));
  });

  test("Beneficiário contribuindo mostra o 422", async () => {
    await escolher(page, "Quem contribui", "Ana");
    await campo(page, "Valor da Contribuição").fill("10");
    await botao(page, "Contribuir").click();
    await ver(page, "O Beneficiario nao contribui na propria Vaquinha.");
  });

  test("acima da Meta: 'Meta atingida', barra cheia e continua aberta", async () => {
    await escolher(page, "Quem contribui", "Caio");
    await campo(page, "Valor da Contribuição").fill("300");
    await page.getByRole("radio", { name: "Dinheiro" }).click();
    await botao(page, "Contribuir").click();
    await ver(page, emReais(35000));
    await ver(page, "Meta atingida");
    await ver(page, "Aberta");
    await expect(barra().locator("div")).toHaveAttribute("style", /width: 100%/);
  });

  test("encerrar pede confirmação e move para Encerradas", async ({ request }) => {
    await botao(page, "Encerrar Vaquinha").click();
    await ver(page, /Encerrar não tem volta/);
    await botao(page, "Cancelar").click();
    await botao(page, "Encerrar Vaquinha").click();
    await botao(page, "Confirmar encerramento").click();
    await expect(page.getByRole("heading", { name: "Encerradas" })).toBeVisible();
    await expect(botao(page, "Contribuir")).toHaveCount(0);
    const [v]: Vaquinha[] = await semente(request).get(`/grupos/${grupoId}/vaquinhas`);
    expect(v.status).toBe("encerrada");
  });

  test("Vaquinha não entra no Saldo", async () => {
    await page.goto(`/grupos/${grupoId}/saldos`);
    await ver(page, "Ninguém deve nada a ninguém.");
  });

  test("quem sou eu Beneficiário: 'Quem contribui' começa em outro Membro @celular", async ({ page: p, request }) => {
    const api = semente(request);
    const { grupo, m } = await api.grupo("Outro Grupo", [{ nome: "Ana" }, { nome: "Bia" }]);
    await api.vaquinha(grupo.id, "Viagem da Bia", 80000, m.Bia.id);
    await comoMembro(p, grupo.id, m.Bia.id, `/grupos/${grupo.id}/vaquinhas`);
    await expect(selecao(p, "Quem contribui").locator("option:checked")).toHaveText("Ana");
  });
});
