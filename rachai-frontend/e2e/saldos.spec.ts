import { expect, test } from "@playwright/test";
import type { SaldosDoGrupo } from "@/lib/api/tipos";
import { brl, comoMembro, contextos, emReais, semente } from "./apoio";
import { naoVer, ver } from "./apoio-tela";

test.describe("Tela 3: Saldos e Transferências sugeridas (#6)", () => {
  let grupoId: number;
  let ids: Record<string, number>;
  let saldos: SaldosDoGrupo;

  test.beforeAll(async ({ browser, playwright }) => {
    const { page, request } = await contextos(browser, playwright);
    await page.close();
    const api = semente(request);
    const { grupo, m } = await api.grupo("República da Gávea", [
      { nome: "Ana", chave_pix: "ana@pix.com" },
      { nome: "Bia" },
      { nome: "Caio" },
    ]);
    grupoId = grupo.id;
    ids = { Ana: m.Ana.id, Bia: m.Bia.id, Caio: m.Caio.id };
    await api.despesaIgualitaria(grupoId, "Luz", 10000, m.Ana.id, [m.Ana.id, m.Bia.id, m.Caio.id]);
    await api.post(`/grupos/${grupoId}/pagamentos`, { de_membro_id: m.Caio.id, para_membro_id: m.Ana.id, valor_centavos: 1000, meio: "pix" });
    saldos = await api.get(`/grupos/${grupoId}/saldos`);
  });

  test("sem quem sou eu: convite em vez do Saldo em destaque", async ({ page }) => {
    await comoMembro(page, grupoId, null, `/grupos/${grupoId}/saldos`);
    await ver(page, /para ver o seu Saldo em destaque/);
    await naoVer(page, "Seu Saldo");
  });

  test("todo Saldo e toda Transferência aparecem exatamente como a API devolveu", async ({ page }) => {
    await comoMembro(page, grupoId, null, `/grupos/${grupoId}/saldos`);
    for (const s of saldos.saldos) await ver(page, emReais(s.saldo_centavos));
    for (const t of saldos.transferencias) await ver(page, emReais(t.valor_centavos));
    await expect(page.getByRole("link", { name: "Saldos", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("quem sou eu devedor: Saldo negativo em destaque e 'Pague'", async ({ page }) => {
    await comoMembro(page, grupoId, ids.Bia, `/grupos/${grupoId}/saldos`);
    const meu = saldos.saldos.find((s) => s.membro_id === ids.Bia)!;
    const destaque = page.getByRole("region", { name: "Seu Saldo" });
    await expect(destaque.getByText(emReais(meu.saldo_centavos))).toBeVisible();
    await expect(destaque).toContainText("Você deve ao Grupo.");
    const t = saldos.transferencias.find((t) => t.de_membro_id === ids.Bia)!;
    await expect(destaque).toContainText(new RegExp(`Pague\\s*${brl(t.valor_centavos).replace("$", "\\$").replace(" ", "\\s")}\\s*para\\s*Ana`));
  });

  test("quem sou eu credor: 'Receba' de cada devedor", async ({ page }) => {
    await comoMembro(page, grupoId, ids.Ana, `/grupos/${grupoId}/saldos`);
    const destaque = page.getByRole("region", { name: "Seu Saldo" });
    await expect(destaque).toContainText("Você tem a receber.");
    await expect(destaque).toContainText(/Receba[\s\S]*de\s*Bia/);
    await expect(destaque).toContainText(/Receba[\s\S]*de\s*Caio/);
  });

  test("Grupo sem Despesas: todos quitados @celular", async ({ page, request }) => {
    const { grupo, m } = await semente(request).grupo("Grupo quitado", [{ nome: "Duda" }, { nome: "Edu" }]);
    await comoMembro(page, grupo.id, m.Duda.id, `/grupos/${grupo.id}/saldos`);
    await ver(page, "Você está quitado.");
    await ver(page, "Ninguém deve nada a ninguém.");
  });
});
