import Decimal from "decimal.js"
import { delay, http, HttpResponse } from "msw"
import type { Cart, CartLine } from "@/types/cart"
import { getDb, save } from "./db"

const NETWORK_FEE = "0.016"
const COUPONS: Record<string, { percent: number; expired?: boolean }> = {
  KURIO10: { percent: 10 },
  VELHO20: { percent: 20, expired: true },
}

// Por enquanto só existe o carrinho de visitante; a autenticação entra depois.
const ownerOf = (_request: Request) => "guest"

function cartState(owner: string) {
  const db = getDb()
  db.carts[owner] ??= { items: [], coupon: null }
  return db.carts[owner]
}

function buildCart(owner: string): Cart {
  const state = cartState(owner)
  const items: CartLine[] = []
  for (const it of state.items) {
    const nft = getDb().nfts.find((n) => n.id === it.nftId)
    if (!nft) continue
    items.push({
      nft,
      quantity: it.quantity,
      lineTotal: new Decimal(nft.price).times(it.quantity).toString(),
    })
  }
  const subtotal = items.reduce((acc, l) => acc.plus(l.lineTotal), new Decimal(0))
  const percent = state.coupon ? COUPONS[state.coupon].percent : 0
  const discount = subtotal.times(percent).div(100)
  const fee = items.length > 0 ? new Decimal(NETWORK_FEE) : new Decimal(0)
  const total = subtotal.minus(discount).plus(fee)
  return {
    items,
    coupon: state.coupon ? { code: state.coupon, percent } : null,
    subtotal: subtotal.toString(),
    discount: discount.toString(),
    networkFee: fee.toString(),
    total: total.toString(),
    itemCount: items.reduce((n, l) => n + l.quantity, 0),
  }
}

const error = (code: string, message: string, status: number, extra = {}) =>
  HttpResponse.json({ code, message, ...extra }, { status })

export const cartHandlers = [
  http.get("/api/cart", async ({ request }) => {
    await delay(150)
    return HttpResponse.json(buildCart(ownerOf(request)))
  }),

  http.post("/api/cart/items", async ({ request }) => {
    await delay(200)
    const owner = ownerOf(request)
    const { nftId, quantity } = (await request.json()) as { nftId: string; quantity: number }
    const nft = getDb().nfts.find((n) => n.id === nftId)
    if (!nft) return error("NOT_FOUND", "NFT não encontrado", 404)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return error("VALIDATION", "Quantidade inválida", 422)
    }
    const state = cartState(owner)
    const existing = state.items.find((i) => i.nftId === nftId)
    const next = (existing?.quantity ?? 0) + quantity
    if (next > nft.available) {
      return error("INSUFFICIENT_STOCK", "Quantidade acima da disponível", 409, {
        available: nft.available,
      })
    }
    if (existing) existing.quantity = next
    else state.items.push({ nftId, quantity })
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.patch("/api/cart/items/:nftId", async ({ request, params }) => {
    await delay(150)
    const owner = ownerOf(request)
    const { quantity } = (await request.json()) as { quantity: number }
    const nft = getDb().nfts.find((n) => n.id === params.nftId)
    const item = cartState(owner).items.find((i) => i.nftId === params.nftId)
    if (!nft || !item) return error("NOT_FOUND", "Item não encontrado", 404)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return error("VALIDATION", "Quantidade inválida", 422)
    }
    if (quantity > nft.available) {
      return error("INSUFFICIENT_STOCK", "Quantidade acima da disponível", 409, {
        available: nft.available,
      })
    }
    item.quantity = quantity
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.delete("/api/cart/items/:nftId", async ({ request, params }) => {
    await delay(150)
    const owner = ownerOf(request)
    const state = cartState(owner)
    state.items = state.items.filter((i) => i.nftId !== params.nftId)
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.post("/api/cart/coupon", async ({ request }) => {
    await delay(200)
    const owner = ownerOf(request)
    const { code } = (await request.json()) as { code: string }
    const key = code.trim().toUpperCase()
    const coupon = COUPONS[key]
    if (!coupon) return error("COUPON_INVALID", "Código promocional inválido", 422)
    if (coupon.expired) return error("COUPON_EXPIRED", "Código promocional expirado", 410)
    cartState(owner).coupon = key
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.delete("/api/cart/coupon", async ({ request }) => {
    await delay(150)
    const owner = ownerOf(request)
    cartState(owner).coupon = null
    save()
    return HttpResponse.json(buildCart(owner))
  }),
]