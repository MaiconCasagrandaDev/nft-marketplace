import { expect, test } from "@playwright/test"
import { login } from "./helpers"

test("rotas privadas redirecionam visitante para o login", async ({ page }) => {
  await page.goto("/checkout")
  await expect(page).toHaveURL(/\/login/)
})

test("compra completa: detalhe → carrinho → pagamento → pedido confirmado", async ({ page }) => {
  await login(page)

  await page.goto("/nft/nft-009")
  await page.getByRole("button", { name: "COMPRAR" }).click()
  await expect(page).toHaveURL(/\/cart/)

  await page.getByRole("link", { name: /conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/checkout/)

  await page.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(page.getByRole("button", { name: "Carteira conectada" })).toBeVisible()

  await page.getByRole("button", { name: "Revisar pedido" }).click()
  await page.getByRole("button", { name: "Confirmar compra" }).click()

  await expect(page).toHaveURL(/\/order\//)
  await expect(page.getByText(/confirmad/i).first()).toBeVisible({ timeout: 15_000 })
})

test("preço muda na revisão e exige confirmar os novos valores", async ({ page }) => {
  await login(page)
  await page.goto("/nft/nft-009")
  await page.getByRole("button", { name: "COMPRAR" }).click()
  await page.getByRole("link", { name: /conectar e finalizar/i }).click()

  await page.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(page.getByRole("button", { name: "Carteira conectada" })).toBeVisible()
  await page.getByRole("button", { name: "Revisar pedido" }).click()
  await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeVisible()

  await page.evaluate(() => {
    ;(window as unknown as { kurioMock: { setPrice: (id: string, p: string) => void } }).kurioMock.setPrice(
      "nft-009",
      "0.70",
    )
  })

  await expect(page.getByText(/Os valores do pedido mudaram/).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Confirmar novos valores" })).toBeVisible()
})