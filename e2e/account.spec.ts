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

test("carteiras: cria secundária, torna principal e exclui", async ({ page }) => {
  await login(page)
  await headerLink(page, "Carteiras").click()
  await expect(page.getByRole("heading", { name: "Carteiras", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Adicionar carteira secundária" }).click()
  const form = page.getByRole("form", { name: "Nova carteira secundária" })
  await form.locator("#s-label").fill("Teste E2E")
  await form.locator("#s-network").selectOption("ethereum")
  await form.locator("#s-address").fill("0x1")
  await form.getByRole("button", { name: "Salvar carteira" }).click()
  await expect(form.getByText(/Endereço inválido/)).toBeVisible()

  await form.locator("#s-address").fill("0x1111111111111111111111111111111111111111")
  await form.getByRole("button", { name: "Salvar carteira" }).click()

  const list = page.getByRole("list", { name: "Carteiras secundárias" })
  const item = list.getByRole("listitem").filter({ hasText: "Teste E2E" })
  await expect(item).toBeVisible()

  await item.getByRole("button", { name: "Tornar principal" }).click()
  await expect(page.locator("#w-label")).toHaveValue("Teste E2E")
  await expect(item).toHaveCount(0)
  await expect(list.getByRole("listitem")).toHaveCount(2)

  for (const remaining of [2, 1]) {
    const old = list.getByRole("listitem").first()
    await old.getByRole("button", { name: "Excluir" }).click()
    await old.getByRole("button", { name: "Confirmar exclusão" }).click()
    if (remaining > 1) await expect(list.getByRole("listitem")).toHaveCount(remaining - 1)
  }

  await expect(page.getByText("Você ainda não adicionou uma carteira secundária.")).toBeVisible()
})