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