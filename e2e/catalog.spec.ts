import { expect, test } from "@playwright/test"

test("a busca vem da URL e sobrevive ao recarregar", async ({ page }) => {
  await page.goto("/?q=Sage%20Nomad")

  await expect(page.getByText("Sage Nomad #009").first()).toBeVisible()
  await expect(page.getByText("Emerald Ape #042")).toHaveCount(0)

  await page.reload()

  await expect(page).toHaveURL(/q=Sage/)
  await expect(page.getByText("Sage Nomad #009").first()).toBeVisible()
  await expect(page.getByText("Emerald Ape #042")).toHaveCount(0)
})

test("ordenação e página ficam na URL", async ({ page }) => {
  await page.goto("/?sort=price-asc&page=2")
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page).toHaveURL(/page=2/)
})