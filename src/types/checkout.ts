import type { Cart } from "./cart"
import type { Network } from "./nft"

export interface Wallet {
  id: string
  label: string
  address: string
  network: Network
  primary: boolean
}

export interface Collector {
  fullName: string
  email: string
  phone: string
}

export interface QuoteIssue {
  nftId: string
  code: "INSUFFICIENT_STOCK" | "UNAVAILABLE"
  available: number
}

export interface Quote extends Cart {
  quoteId: string
  issues: QuoteIssue[]
}

export type OrderStatus = "pending" | "confirmed" | "rejected"

export interface OrderItem {
  nftId: string
  tokenId: string
  name: string
  image: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export interface Order {
  id: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  coupon: { code: string; percent: number } | null
  subtotal: string
  discount: string
  networkFee: string
  total: string
  network: Network
  wallet: { label: string; address: string; network: Network }
  collector: Collector
  tx: { hash: string; blockNumber: number; explorerUrl: string } | null
  reason: { code: string; message: string } | null
}

export interface CreateOrderInput {
  quoteId: string
  walletId: string
  network: Network
  collector: Collector
}