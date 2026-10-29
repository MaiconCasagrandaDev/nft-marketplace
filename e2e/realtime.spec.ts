import { expect, test } from "@playwright/test"
import { gotoWithSocket, mock } from "./helpers"

test("preço muda ao vivo no detalhe, sem recarregar", async ({ page }) => {
  await gotoWithSocket(page, "/nft/nft-009")
  await expect(page.getByText("1.69 ETH").first()).toBeVisible()

  await mock(page, "setPrice", "nft-009", "0.50")

  await expect(page.getByText("0.50 ETH").first()).toBeVisible()
  await expect(page.getByText(/O preço de Sage Nomad #009 mudou/)).toBeVisible()
})

test("evento duplicado e evento atrasado são ignorados", async ({ page }) => {
  await gotoWithSocket(page, "/nft/nft-009")
  await mock(page, "setPrice", "nft-009", "0.50")
  const notice = page.getByText(/O preço de Sage Nomad #009 mudou/)
  await expect(notice).toHaveCount(1)

  await mock(page, "replayLastEvent")
  await mock(page, "emitStaleEvent", "nft-009")
  await page.waitForTimeout(500)

  await expect(notice).toHaveCount(1)
  await expect(page.getByText("0.50 ETH").first()).toBeVisible()
})

test("após a queda do socket a tela reconcilia com a API", async ({ page }) => {
  test.setTimeout(60_000)
  await gotoWithSocket(page, "/nft/nft-009")

  // prepara a espera pela queda antes de derrubar o socket
  const dropped = page.waitForEvent("console", {
    predicate: (m) => m.text().includes("[realtime] desconectado"),
    timeout: 10_000,
  })

  // derruba o socket e muda o preço enquanto ele está fora (o evento se perde)
  await mock(page, "disconnectSockets", 2000)
  await mock(page, "setPrice", "nft-009", "0.30")
  await dropped

  // espera a reconexão de verdade
  await page.waitForEvent("console", {
    predicate: (m) => m.text().includes("[realtime] conectado"),
    timeout: 25_000,
  })

  // na reconexão o cliente busca o estado atual na API
  await expect(page.getByText("0.30 ETH").first()).toBeVisible({ timeout: 10_000 })
})