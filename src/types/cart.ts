import type { Nft } from "./nft"

export interface CartLine {
  nft: Nft
  quantity: number
  lineTotal: string
}

export interface Cart {
  items: CartLine[]
  coupon: { code: string; percent: number } | null
  subtotal: string
  discount: string
  networkFee: string
  total: string
  itemCount: number
}

export interface ApiError {
  code: string
  message: string
  available?: number
  fields?: Record<string, string>
}