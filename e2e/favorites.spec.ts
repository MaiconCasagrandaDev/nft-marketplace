import { expect, test } from "@playwright/test"
import { login } from "./helpers"

test("favoritar no detalhe leva o NFT para a lista de interesse", async ({ page }) => {
  await login(page)
  await page.getByRole("link", { name: /Sage Nomad #009/ }).first().click()
  await expect(page).toHaveURL(/\/nft\/nft-009/)

  const toggle = page.getByRole("button", { name: /^(favoritar|remover) sage nomad/i })
  await expect(toggle).toBeVisible()
  if (/^favoritar/i.test((await toggle.getAttribute("aria-label")) ?? "")) await toggle.click()
  await expect(page.getByRole("button", { name: /^remover sage nomad/i })).toBeVisible()

  await page.locator("header").getByRole("link", { name: "Perfil", exact: true }).click()
  await page
    .getByRole("navigation", { name: "Menu do perfil" })
    .getByRole("link", { name: "Lista de interesse" })
    .click()
  await expect(page.getByRole("heading", { name: "Lista de interesse" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Sage Nomad #009/ })).toBeVisible()
})