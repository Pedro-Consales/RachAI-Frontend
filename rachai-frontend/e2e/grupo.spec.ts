import { expect, test } from "@playwright/test";
import { botao, campo, ver } from "./apoio-tela";

test.describe.configure({ mode: "serial" });

test.describe("Tela 1: Grupo e Membros (#3)", () => {
  test("início: erros de criar e de entrar", async ({ page }) => {
    await page.goto("/");
    await botao(page, "Criar Grupo").click();
    await ver(page, "O nome do Grupo nao pode ser vazio.");

    await campo(page, "Código do Grupo").fill("abc");
    await botao(page, "Entrar").click();
    await ver(page, "O código do Grupo é um número.");

    await campo(page, "Código do Grupo").fill("999999");
    await botao(page, "Entrar").click();
    await ver(page, "Grupo não encontrado.");
  });

  test("criar Grupo, adicionar Membros e escolher quem sou eu", async ({ page }) => {
    await page.goto("/");
    await campo(page, "Nome do Grupo").fill("República da Gávea");
    await botao(page, "Criar Grupo").click();
    await expect(page).toHaveURL(/\/grupos\/\d+$/);
    await ver(page, "O Grupo ainda não tem Membros.");

    // O primeiro Membro vira "quem sou eu" e a Chave Pix chega aparada.
    await campo(page, "Nome").fill("Ana");
    await campo(page, "Chave Pix").fill("  ana@pix.com  ");
    await botao(page, "Adicionar Membro").click();
    await ver(page, "Chave Pix: ana@pix.com");
    await ver(page, "Você é Ana");

    await campo(page, "Nome").fill("Bia");
    await botao(page, "Adicionar Membro").click();
    await ver(page, "Sem Chave Pix");

    await campo(page, "Nome").fill("ana");
    await botao(page, "Adicionar Membro").click();
    await ver(page, "Ja existe um Membro chamado ana no Grupo.");

    await botao(page, "Sou eu").click();
    await ver(page, "Você é Bia");
    await page.reload();
    await ver(page, "Você é Bia");

    await botao(page, "Não sou eu").click();
    await ver(page, "Quem é você neste Grupo?");
  });

  test("URL de Grupo inexistente ou inválida", async ({ page }) => {
    for (const caminho of ["/grupos/999999", "/grupos/abc"]) {
      await page.goto(caminho);
      await ver(page, "Confira o código ou o link que você recebeu.");
    }
  });
});
