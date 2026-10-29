import type { Nft } from "@/types/nft"
import type { Order, Wallet } from "@/types/checkout"
import { nftsFixture } from "./data/nfts"

const KEY = "kurio:mock-db:v4"

export interface StoredUser {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  avatarUrl: string | null
  passwordHash: string
}

export type StoredOrder = Order & { userId: string }

interface StoredCart {
  items: { nftId: string; quantity: number }[]
  coupon: string | null
}

interface Session {
  userId: string
  expiresAt: number
}

interface Db {
  nfts: Nft[]
  carts: Record<string, StoredCart>
  users: StoredUser[]
  sessions: Record<string, Session>
  favorites: Record<string, string[]>
  wallets: Record<string, Wallet[]>
  orders: StoredOrder[]
  idempotency: Record<string, { fingerprint: string; orderId: string }>
}

// Senhas de teste (apenas o hash SHA-256 de "kurio:" + senha é guardado):
//   ana@kurio.test   -> Senha@123
//   bruno@kurio.test -> Senha@456
const seedUsers: StoredUser[] = [
  {
    id: "u1",
    username: "ana",
    email: "ana@kurio.test",
    displayName: "Ana Souza",
    ensName: "ana",
    avatarUrl: null,
    passwordHash: "e4f3920e8bfa128140400b690ae0766eb1839007c92bae8962f0113914039cf5",
  },
  {
    id: "u2",
    username: "bruno",
    email: "bruno@kurio.test",
    displayName: "Bruno Lima",
    ensName: "bruno",
    avatarUrl: null,
    passwordHash: "5fa3bf1239a3032e1f055664dfcafadd819e5aef8902abe9bc9a8b2f06d967a3",
  },
]

const seedWallets: Record<string, Wallet[]> = {
  u1: [
    {
      id: "w1",
      label: "Carteira principal",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      network: "ethereum",
      primary: true,
    },
    {
      id: "w2",
      label: "Carteira secundária",
      address: "0x9a1D3e5F7b2C4d6E8f0A1b3C5d7E9f1A2b4C6d8E",
      network: "polygon",
      primary: false,
    },
  ],
  u2: [
    {
      id: "w3",
      label: "Carteira principal",
      address: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
      network: "ethereum",
      primary: true,
    },
  ],
}

function seed(): Db {
  return {
    nfts: structuredClone(nftsFixture),
    carts: {},
    users: structuredClone(seedUsers),
    sessions: {},
    favorites: {},
    wallets: structuredClone(seedWallets),
    orders: [],
    idempotency: {},
  }
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

export function expireSessions() {
  for (const s of Object.values(db.sessions)) s.expiresAt = 0
  save()
}