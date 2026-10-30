import { expect, type Page } from "@playwright/test"

// abre a página e espera o socket de tempo real conectar
export async function gotoWithSocket(page: Page, url: string) {
  const connected = page.waitForEvent("console", {
    predicate: (m) => m.text().includes("[realtime] conectado"),
  })
  await page.goto(url)
  await connected
}

// chama um controle do servidor simulado (window.kurioMock)
export async function mock(page: Page, method: string, ...args: unknown[]) {
  await page.waitForFunction(() => "kurioMock" in window)
  await page.evaluate(
    ([m, a]) => {
      const k = (window as unknown as { kurioMock: Record<string, (...x: unknown[]) => unknown> })
        .kurioMock
      return k[m as string](...(a as unknown[]))
    },
    [method, args] as const,
  )
}

export async function login(page: Page, email = "ana@kurio.test", password = "Senha@123") {
  await page.goto("/login")
  await page.locator("#email").fill(email)
  await page.getByLabel(/senha/i).fill(password)
  await page.getByRole("button", { name: /^entrar$/i }).click()
  await expect(page.getByText("@ana")).toBeVisible()
}

// do detalhe do NFT até a tela de pagamento (só cliques, sem recarregar a página)
export async function toCheckout(page: Page) {
  await page.getByRole("button", { name: "COMPRAR" }).click()
  await expect(page).toHaveURL(/\/cart/)
  await page.getByRole("link", { name: /conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/checkout/)
}

export async function connectAndReview(page: Page) {
  await page.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(page.getByRole("button", { name: "Carteira conectada" })).toBeVisible()
  await page.getByRole("button", { name: "Revisar pedido" }).click()
  await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeVisible()
}