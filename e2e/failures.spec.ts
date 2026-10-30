import { expect, test } from "@playwright/test"
import { connectAndReview, login, mock, toCheckout } from "./helpers"

test("pagamento recusado mostra o motivo e mantém os itens no carrinho", async ({ page }) => {
  test.setTimeout(60_000)
  await login(page)
  await page.goto("/nft/nft-009")
  await mock(page, "setScenario", "walletMode", "reject")

  await toCheckout(page)
  await connectAndReview(page)
  await page.getByRole("button", { name: "Confirmar compra" }).click()

  await expect(page).toHaveURL(/\/order\//)
  await expect(page.getByRole("heading", { name: "Pedido recusado" })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText("Os itens continuam no seu carrinho.")).toBeVisible()

  await page.getByRole("link", { name: "Voltar ao carrinho" }).click()
  await expect(page.getByText("Sage Nomad #009").first()).toBeVisible()
})

test("timeout na confirmação não duplica o pedido ao tentar de novo", async ({ page }) => {
  test.setTimeout(90_000)
  await login(page)
  await page.goto("/nft/nft-009")
  await mock(page, "setScenario", "orderTimeout", true)

  await toCheckout(page)
  await connectAndReview(page)
  await page.getByRole("button", { name: "Confirmar compra" }).click()

  // o envio falha por timeout: o botão passa a oferecer "Tentar novamente"
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible({ timeout: 20_000 })

  // a falha passa: a nova tentativa reaproveita a mesma Idempotency-Key
  await mock(page, "setScenario", "orderTimeout", false)
  await page.getByRole("button", { name: "Tentar novamente" }).click()

  await expect(page).toHaveURL(/\/order\//, { timeout: 20_000 })

  const orders = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio:mock-db:v4") ?? "{}")
    const o = db.orders ?? []
    return Array.isArray(o) ? o.length : Object.keys(o).length
  })
  expect(orders).toBe(1)
})

test("favorito que falha na API volta ao estado anterior (rollback)", async ({ page }) => {
  await login(page)
  await page.goto("/nft/nft-009")
  await mock(page, "setScenario", "failFavorites", true)

  const favorite = page.getByRole("button", { name: /favoritar/i })
  await expect(favorite).toBeVisible()
  await favorite.click()

  // depois do erro o botão volta a oferecer "Favoritar"
  await expect(page.getByRole("button", { name: /^favoritar/i })).toBeVisible()
})