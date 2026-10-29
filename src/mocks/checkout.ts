import type { Order, Quote } from "@/types/checkout"
import { buildCart } from "./cartHandlers"
import { getDb, save, type StoredOrder } from "./db"
import { emitNftUpdated, emitOrderUpdated } from "./realtime"
import { scenarios } from "./scenarios"

export const SETTLE_MS = 2500

function hash(input: string) {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, "0")
}

export function buildQuote(owner: string): Quote {
  const cart = buildCart(owner)
  const issues = cart.items
    .filter((l) => l.quantity > l.nft.available)
    .map((l) => ({
      nftId: l.nft.id,
      code: (l.nft.available === 0 ? "UNAVAILABLE" : "INSUFFICIENT_STOCK") as
        | "UNAVAILABLE"
        | "INSUFFICIENT_STOCK",
      available: l.nft.available,
    }))
  // a assinatura muda se preço, quantidade, cupom ou taxa mudarem
  const signature = JSON.stringify([
    cart.items.map((l) => [l.nft.id, l.quantity, l.nft.price]),
    cart.coupon?.code ?? null,
    cart.networkFee,
    cart.total,
  ])
  return { ...cart, quoteId: `q_${hash(signature)}`, issues }
}

export function txHashFor(orderId: string) {
  return "0x" + Array.from({ length: 8 }, (_, i) => hash(`${orderId}:${i}`)).join("")
}

function toPublic(order: StoredOrder): Order {
  const { userId: _userId, ...rest } = order
  return rest
}

function reject(order: StoredOrder, code: string, message: string) {
  order.status = "rejected"
  order.reason = { code, message }
  order.updatedAt = new Date().toISOString()
  save()
  emitOrderUpdated(order.userId, toPublic(order))
}

export function settle(order: StoredOrder) {
  if (order.status !== "pending") return
  const db = getDb()

  if (scenarios.walletMode === "reject") {
    return reject(order, "WALLET_REJECTED", "A transação foi recusada na carteira.")
  }
  if (scenarios.walletMode === "disconnect") {
    return reject(order, "WALLET_DISCONNECTED", "A carteira foi desconectada durante a transação.")
  }

  const short = order.items.find(
    (i) => (db.nfts.find((n) => n.id === i.nftId)?.available ?? 0) < i.quantity,
  )
  if (short) {
    return reject(order, "OUT_OF_STOCK", `${short.name} não tem mais unidades suficientes.`)
  }

  const changed: { nft: (typeof db.nfts)[number]; previous: { price: string; available: number } }[] = []
  for (const item of order.items) {
    const nft = db.nfts.find((n) => n.id === item.nftId)
    if (!nft) continue
    const previous = { price: nft.price, available: nft.available }
    nft.available -= item.quantity
    nft.version += 1
    changed.push({ nft, previous })
  }

  // remove do carrinho apenas o que foi comprado
  const cart = db.carts[`user:${order.userId}`]
  if (cart) {
    for (const item of order.items) {
      const line = cart.items.find((i) => i.nftId === item.nftId)
      if (line) line.quantity -= item.quantity
    }
    cart.items = cart.items.filter((i) => i.quantity > 0)
    if (cart.items.length === 0) cart.coupon = null
  }

  const hashValue = txHashFor(order.id)
  order.status = "confirmed"
  order.tx = {
    hash: hashValue,
    blockNumber: 19_000_000 + (parseInt(hashValue.slice(2, 8), 16) % 100_000),
    explorerUrl: `https://explorer.kurio.test/tx/${hashValue}`,
  }
  order.updatedAt = new Date().toISOString()
  save()

  for (const { nft, previous } of changed) emitNftUpdated(nft, previous)
  emitOrderUpdated(order.userId, toPublic(order))
}

// Liquidação preguiçosa: sobrevive a refresh, pois depende só de timestamps salvos
export function settleIfDue(order: StoredOrder) {
  if (order.status !== "pending") return
  if (Date.now() - Date.parse(order.createdAt) < SETTLE_MS) return
  settle(order)
}