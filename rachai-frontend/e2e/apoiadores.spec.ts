import { expect, test } from "@playwright/test";
import type { Apoiador } from "@/lib/api/tipos";
import { comoMembro, contextos, emReais, semente } from "./apoio";
import { ver } from "./apoio-tela";

test.describe("Tela 6: Apoiadores (#9)", () => {
  let grupoId: number;
  let ids: Record<string, number>;

  test.beforeAll(async ({ browser, playwright }) => {
    const { page, request } = await contextos(browser, playwright);
    await page.close();
    const api = semente(request);
    const { grupo, m } = await api.grupo(
      "República da Gávea",
      ["Ana", "Bia", "Caio", "Duda", "Edu"].map((nome) => ({ nome })),
    );
    grupoId = grupo.id;
    ids = Object.fromEntries(Object.entries(m).map(([nome, membro]) => [nome, membro.id]));
    // Edu só paga Despesa: não conta como ajuda (ADR 0006).
    await api.despesaIgualitaria(grupoId, "Mercado", 90000, ids.Edu, Object.values(ids));
    const v1 = await api.vaquinha(grupoId, "Geladeira", 30000, ids.Ana);
    const v2 = await api.vaquinha(grupoId, "Viagem", 50000, ids.Bia);
    const v3 = await api.vaquinha(grupoId, "Bike", 20000, ids.Caio);
    await api.contribuir(grupoId, v1.id, ids.Bia, 10000);
    await api.contribuir(grupoId, v1.id, ids.Bia, 2000); // mesma Vaquinha: conta uma vez
    await api.contribuir(grupoId, v1.id, ids.Caio, 5000);
    await api.contribuir(grupoId, v2.id, ids.Caio, 7000);
    await api.contribuir(grupoId, v2.id, ids.Duda, 12000);
    await api.contribuir(grupoId, v3.id, ids.Ana, 1000);
    await api.post(`/grupos/${grupoId}/vaquinhas/${v2.id}/encerrar`); // encerrada continua contando
  });

  test("Grupo sem Contribuições: convite para as Vaquinhas", async ({ page, request }) => {
    const { grupo } = await semente(request).grupo("Grupo sem ajuda", [{ nome: "Gil" }]);
    await page.goto(`/grupos/${grupo.id}/apoiadores`);
    await ver(page, /Ninguém contribuiu ainda/);
  });

  test("a lista segue exatamente a ordem e os valores da API, com destaque só no top 3 @celular", async ({
    page,
    request,
  }) => {
    const api: Apoiador[] = await semente(request).get(`/grupos/${grupoId}/apoiadores`);
    // Sanidade da semente: empate em R$ 120, Caio apoiou 2 Vaquinhas, Bia antes de Duda pelo nome.
    expect(api.map((a) => a.nome)).toEqual(["Caio", "Bia", "Duda", "Ana"]);

    await comoMembro(page, grupoId, ids.Duda, `/grupos/${grupoId}/apoiadores`);
    const linhas = page.getByRole("listitem").filter({ has: page.locator("[aria-hidden=true]") });
    await expect(linhas).toHaveCount(api.length);
    for (const [i, a] of api.entries()) {
      const linha = linhas.nth(i);
      await expect(linha).toContainText(`${i + 1}º`);
      await expect(linha).toContainText(a.nome);
      await expect(linha.getByText(emReais(a.total_contribuido_centavos))).toBeVisible();
      await expect(linha).toContainText(`Apoiou ${a.vaquinhas_apoiadas} ${a.vaquinhas_apoiadas === 1 ? "Vaquinha" : "Vaquinhas"}`);
      const marca = linha.locator("[aria-hidden=true]");
      if (i < 3) await expect(marca).toHaveClass(/border-acento/);
      else await expect(marca).not.toHaveClass(/border-acento/);
    }
    await expect(linhas.nth(2)).toContainText("Você");
  });

  test("quem só pagou Despesa não aparece", async ({ page }) => {
    await page.goto(`/grupos/${grupoId}/apoiadores`);
    await expect(page.getByRole("listitem").filter({ hasText: "Edu" })).toHaveCount(0);
  });
});
