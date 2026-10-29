import type { Nft } from "@/types/nft"
import { nftsFixture } from "./data/nfts"

const KEY = "kurio:mock-db:v2"

export interface StoredUser {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  avatarUrl: string | null
  passwordHash: string
}

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

function seed(): Db {
  return {
    nfts: structuredClone(nftsFixture),
    carts: {},
    users: structuredClone(seedUsers),
    sessions: {},
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