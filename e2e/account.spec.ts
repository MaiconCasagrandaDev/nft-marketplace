import { expect, test } from "@playwright/test"
import { login } from "./helpers"

const headerLink = (page: import("@playwright/test").Page, name: string) =>
  page.locator("header").getByRole("link", { name, exact: true })

test("perfil: edita o nome e a alteração persiste ao navegar", async ({ page }) => {
  await login(page)
  await headerLink(page, "Perfil").click()
  await expect(page.getByRole("heading", { name: "Perfil do colecionador" })).toBeVisible()

  await page.locator("#displayName").fill("Ana Colecionadora")
  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(page.getByText("Perfil atualizado.")).toBeVisible()

  const menu = page.getByRole("navigation", { name: "Menu do perfil" })
  await menu.getByRole("link", { name: "Carteiras" }).click()
  await menu.getByRole("link", { name: "Dados do perfil" }).click()
  await expect(page.locator("#displayName")).toHaveValue("Ana Colecionadora")
})

test("perfil: valida campos e recusa senha atual incorreta", async ({ page }) => {
  await login(page)
  await headerLink(page, "Perfil").click()

  const original = await page.locator("#email").inputValue()
  await page.locator("#email").fill("invalido")
  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(page.getByText("E-mail inválido")).toBeVisible()
  await page.locator("#email").fill(original)

  await page.locator("#currentPassword").fill("senhaerrada1")
  await page.locator("#newPassword").fill("NovaSenha@123")
  await page.locator("#confirmPassword").fill("NovaSenha@123")
  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(page.getByText("Senha atual incorreta")).toBeVisible()
})

test("carteiras: cria, torna principal e exclui", async ({ page }) => {
  await login(page)
  await headerLink(page, "Carteiras").click()
  await expect(page.getByRole("heading", { name: "Carteiras", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Adicionar carteira" }).click()
  await page.locator("#w-label").fill("Teste E2E")
  await page.locator("#w-address").fill("0x1")
  await page.getByRole("button", { name: "Salvar carteira" }).click()
  await expect(page.getByText(/Endereço inválido/)).toBeVisible()

  await page.locator("#w-address").fill("0x1111111111111111111111111111111111111111")
  await page.getByLabel("Definir como carteira principal").check()
  await page.getByRole("button", { name: "Salvar carteira" }).click()

  const item = page.getByRole("listitem").filter({ hasText: "Teste E2E" })
  await expect(item).toBeVisible()
  await expect(item.getByText("Principal")).toBeVisible()

  await item.getByRole("button", { name: "Excluir" }).click()
  await item.getByRole("button", { name: "Confirmar exclusão" }).click()
  await expect(page.getByRole("listitem").filter({ hasText: "Teste E2E" })).toHaveCount(0)
})