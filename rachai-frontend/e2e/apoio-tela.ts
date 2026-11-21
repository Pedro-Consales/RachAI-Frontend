/** Apoio de tela: o Next 16 mantém a rota anterior montada e escondida, então só vale o que está visível. */
import { expect, type Page } from "@playwright/test";

export async function ver(page: Page, texto: string | RegExp) {
  await expect(page.getByText(texto).filter({ visible: true }).first()).toBeVisible();
}

/** Texto exato: por padrão o getByText casa trechos sem diferenciar maiúsculas. */
export async function naoVer(page: Page, texto: string) {
  await expect(page.getByText(texto, { exact: true }).filter({ visible: true })).toHaveCount(0);
}

export const campo = (page: Page, nome: string) => page.getByRole("textbox", { name: nome, exact: true });
export const selecao = (page: Page, nome: string) => page.getByRole("combobox", { name: nome, exact: true });
export const botao = (page: Page, nome: string) => page.getByRole("button", { name: nome, exact: true });
export const link = (page: Page, nome: string) => page.getByRole("link", { name: nome, exact: true });

/** Escolhe uma opção pelo começo do texto (ex.: "Bia" casa "Bia (você)"). */
export async function escolher(page: Page, nome: string, opcao: string) {
  const s = selecao(page, nome);
  const valor = await s.locator("option", { hasText: new RegExp(`^${opcao}`) }).getAttribute("value");
  await s.selectOption(valor!);
}
