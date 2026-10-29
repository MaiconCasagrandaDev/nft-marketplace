import type { Nft } from "@/types/nft"
import { nftsFixture } from "./data/nfts"

const KEY = "kurio:mock-db:v1"

interface StoredCart {
  items: { nftId: string; quantity: number }[]
  coupon: string | null
}

interface Db {
  nfts: Nft[]
  carts: Record<string, StoredCart>
}

function seed(): Db {
  return { nfts: structuredClone(nftsFixture), carts: {} }
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* sem storage: usa o seed */
  }
  return seed()
}

let db = load()

export const getDb = () => db

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignora */
  }
}

export function resetDb() {
  db = seed()
  save()
}