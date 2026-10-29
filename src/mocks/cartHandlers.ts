import Decimal from "decimal.js"
import { delay, http, HttpResponse } from "msw"
import type { Cart, CartLine } from "@/types/cart"
import { apiError, resolveCaller } from "./auth"
import { getDb, save } from "./db"

const NETWORK_FEE = "0.016"
const COUPONS: Record<string, { percent: number; expired?: boolean }> = {
  KURIO10: { percent: 10 },
  VELHO20: { percent: 20, expired: true },
}

function ownerOf(request: Request): string | Response {
  const caller = resolveCaller(request)
  if (caller.kind === "error") return caller.response
  return caller.kind === "user" ? `user:${caller.user.id}` : "guest"
}

function cartState(owner: string) {
  const db = getDb()
  db.carts[owner] ??= { items: [], coupon: null }
  return db.carts[owner]
}

export function buildCart(owner: string): Cart {
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

export const cartHandlers = [
  http.get("/api/cart", async ({ request }) => {
    await delay(150)
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    return HttpResponse.json(buildCart(owner))
  }),

  http.post("/api/cart/items", async ({ request }) => {
    await delay(200)
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const { nftId, quantity } = (await request.json()) as { nftId: string; quantity: number }
    const nft = getDb().nfts.find((n) => n.id === nftId)
    if (!nft) return apiError("NOT_FOUND", "NFT não encontrado", 404)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return apiError("VALIDATION", "Quantidade inválida", 422)
    }
    const state = cartState(owner)
    const existing = state.items.find((i) => i.nftId === nftId)
    const next = (existing?.quantity ?? 0) + quantity
    if (next > nft.available) {
      return apiError("INSUFFICIENT_STOCK", "Quantidade acima da disponível", 409, {
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
    if (owner instanceof Response) return owner
    const { quantity } = (await request.json()) as { quantity: number }
    const nft = getDb().nfts.find((n) => n.id === params.nftId)
    const item = cartState(owner).items.find((i) => i.nftId === params.nftId)
    if (!nft || !item) return apiError("NOT_FOUND", "Item não encontrado", 404)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return apiError("VALIDATION", "Quantidade inválida", 422)
    }
    if (quantity > nft.available) {
      return apiError("INSUFFICIENT_STOCK", "Quantidade acima da disponível", 409, {
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
    if (owner instanceof Response) return owner
    const state = cartState(owner)
    state.items = state.items.filter((i) => i.nftId !== params.nftId)
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.post("/api/cart/coupon", async ({ request }) => {
    await delay(200)
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    const { code } = (await request.json()) as { code: string }
    const key = code.trim().toUpperCase()
    const coupon = COUPONS[key]
    if (!coupon) return apiError("COUPON_INVALID", "Código promocional inválido", 422)
    if (coupon.expired) return apiError("COUPON_EXPIRED", "Código promocional expirado", 410)
    cartState(owner).coupon = key
    save()
    return HttpResponse.json(buildCart(owner))
  }),

  http.delete("/api/cart/coupon", async ({ request }) => {
    await delay(150)
    const owner = ownerOf(request)
    if (owner instanceof Response) return owner
    cartState(owner).coupon = null
    save()
    return HttpResponse.json(buildCart(owner))
  }),
]