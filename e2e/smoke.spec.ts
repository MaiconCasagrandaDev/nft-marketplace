import { expect, test } from "@playwright/test"

test("o app sobe com a API simulada e mostra um NFT", async ({ page }) => {
  await page.goto("/nft/nft-009")
  await expect(page.getByRole("heading", { name: "Sage Nomad #009" })).toBeVisible()
})