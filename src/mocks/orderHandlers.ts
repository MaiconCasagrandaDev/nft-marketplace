import { delay, http, HttpResponse } from "msw"
import type { CreateOrderInput, Order } from "@/types/checkout"
import { apiError } from "./auth"
import { buildQuote, settleIfDue } from "./checkout"
import { getDb, save, type StoredOrder } from "./db"
import { requireUser } from "./guard"
import { scenarios } from "./scenarios"
import { walletsOf } from "./walletHandlers"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NETWORKS = ["ethereum", "polygon", "solana"]

function publicOrder(order: StoredOrder): Order {
  const { userId: _userId, ...rest } = order
  return rest
}

export const orderHandlers = [
  http.get("/api/checkout/quote", async ({ request }) => {
    await delay(200)
    const user = requireUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json(buildQuote(`user:${user.id}`))
  }),

  http.post("/api/orders", async ({ request }) => {
    await delay(400)
    const user = requireUser(request)
    if (user instanceof Response) return user

    const key = request.headers.get("idempotency-key")
    if (!key) return apiError("VALIDATION", "Chave de idempotência obrigatória", 422)

    const body = (await request.json()) as Partial<CreateOrderInput>
    const db = getDb()
    const idemKey = `${user.id}:${key}`
    const fingerprint = JSON.stringify([body.quoteId, body.walletId, body.network, body.collector])

    // mesma chave: devolve o mesmo pedido; conteúdo diferente: conflito
    const known = db.idempotency[idemKey]
    if (known) {
      if (known.fingerprint !== fingerprint) {
        return apiError(
          "IDEMPOTENCY_CONFLICT",
          "Esta chave já foi usada com outro conteúdo",
          409,
        )
      }
      const existing = db.orders.find((o) => o.id === known.orderId)
      if (existing) {
        settleIfDue(existing)
        return HttpResponse.json(publicOrder(existing), { status: 200 })
      }
    }

    const fields: Record<string, string> = {}
    const collector = body.collector
    if (!collector?.fullName || collector.fullName.trim().length < 3) {
      fields.fullName = "Informe o nome completo"
    }
    if (!collector?.email || !EMAIL_RE.test(collector.email)) fields.email = "E-mail inválido"
    if (!body.network || !NETWORKS.includes(body.network)) fields.network = "Selecione a rede"
    const wallet = walletsOf(user.id).find((w) => w.id === body.walletId)
    if (!wallet) fields.walletId = "Selecione uma carteira"
    if (Object.keys(fields).length > 0 || !wallet || !collector || !body.network) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    const quote = buildQuote(`user:${user.id}`)
    if (quote.items.length === 0) return apiError("CART_EMPTY", "Seu carrinho está vazio", 409)
    if (quote.issues.length > 0) {
      return apiError("AVAILABILITY_CHANGED", "A disponibilidade mudou", 409, { quote })
    }
    if (quote.quoteId !== body.quoteId) {
      return apiError("QUOTE_CHANGED", "Os valores mudaram. Revise o pedido.", 409, { quote })
    }

    const now = new Date().toISOString()
    const order: StoredOrder = {
      id: `KUR-${String(1000 + db.orders.length + 1)}`,
      userId: user.id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      items: quote.items.map((l) => ({
        nftId: l.nft.id,
        tokenId: l.nft.tokenId,
        name: l.nft.name,
        image: l.nft.image,
        quantity: l.quantity,
        unitPrice: l.nft.price,
        lineTotal: l.lineTotal,
      })),
      coupon: quote.coupon,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      network: body.network,
      wallet: { label: wallet.label, address: wallet.address, network: wallet.network },
      collector: {
        fullName: collector.fullName.trim(),
        email: collector.email.trim(),
        phone: collector.phone ?? "",
      },
      tx: null,
      reason: null,
    }
    db.orders.push(order)
    db.idempotency[idemKey] = { fingerprint, orderId: order.id }
    save()

    // cenário: o pedido é criado, mas a resposta demora mais que o timeout do cliente
    if (scenarios.orderTimeout) await delay(15000)

    return HttpResponse.json(publicOrder(order), { status: 201 })
  }),

  http.get("/api/orders/:id", async ({ request, params }) => {
    await delay(150)
    const user = requireUser(request)
    if (user instanceof Response) return user
    const order = getDb().orders.find((o) => o.id === params.id && o.userId === user.id)
    // pedido de outro usuário aparece como inexistente
    if (!order) return apiError("NOT_FOUND", "Pedido não encontrado", 404)
    settleIfDue(order)
    return HttpResponse.json(publicOrder(order))
  }),

  http.get("/api/orders", async ({ request }) => {
    await delay(150)
    const user = requireUser(request)
    if (user instanceof Response) return user
    const status = new URL(request.url).searchParams.get("status")
    const mine = getDb()
      .orders.filter((o) => o.userId === user.id)
      .filter((o) => !status || o.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    mine.forEach(settleIfDue)
    return HttpResponse.json(mine.map(publicOrder))
  }),
]