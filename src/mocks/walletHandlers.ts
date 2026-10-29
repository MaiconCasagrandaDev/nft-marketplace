import { delay, http, HttpResponse } from "msw"
import type { Wallet } from "@/types/checkout"
import { apiError } from "./auth"
import { getDb, save } from "./db"
import { requireUser } from "./guard"
import { scenarios } from "./scenarios"

export function walletsOf(userId: string): Wallet[] {
  const db = getDb()
  if (!db.wallets[userId]) {
    // usuário novo recebe uma carteira principal padrão
    db.wallets[userId] = [
      {
        id: `w${crypto.randomUUID().slice(0, 6)}`,
        label: "Carteira principal",
        address: `0x${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
        network: "ethereum",
        primary: true,
      },
    ]
    save()
  }
  return db.wallets[userId]
}

export const walletHandlers = [
  http.get("/api/wallets", async ({ request }) => {
    await delay(150)
    const user = requireUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json(walletsOf(user.id))
  }),

  http.post("/api/wallets/:id/connect", async ({ request, params }) => {
    await delay(900)
    const user = requireUser(request)
    if (user instanceof Response) return user
    const wallet = walletsOf(user.id).find((w) => w.id === params.id)
    if (!wallet) return apiError("NOT_FOUND", "Carteira não encontrada", 404)
    if (scenarios.walletMode === "disconnect") {
      return apiError("WALLET_DISCONNECTED", "Carteira indisponível. Conecte novamente.", 503)
    }
    return HttpResponse.json({ connected: true, walletId: wallet.id, address: wallet.address })
  }),
]