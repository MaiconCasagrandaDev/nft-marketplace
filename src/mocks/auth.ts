import { HttpResponse } from "msw"
import type { User } from "@/types/auth"
import { getDb, save, type StoredUser } from "./db"

export const SESSION_TTL_MS = 60 * 60 * 1000

export function apiError(code: string, message: string, status: number, extra = {}) {
  return HttpResponse.json({ code, message, ...extra }, { status })
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`kurio:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const toUser = (u: StoredUser): User => ({
  id: u.id,
  username: u.username,
  email: u.email,
  displayName: u.displayName,
  ensName: u.ensName,
  avatarUrl: u.avatarUrl,
})

export function createSession(userId: string) {
  const token = `tok_${crypto.randomUUID()}`
  getDb().sessions[token] = { userId, expiresAt: Date.now() + SESSION_TTL_MS }
  save()
  return token
}

export type Caller =
  | { kind: "guest" }
  | { kind: "user"; user: StoredUser; token: string }
  | { kind: "error"; response: Response }

export function resolveCaller(request: Request): Caller {
  const header = request.headers.get("authorization")
  if (!header) return { kind: "guest" }

  const token = header.replace(/^Bearer\s+/i, "")
  const db = getDb()
  const session = db.sessions[token]
  if (!session) {
    return { kind: "error", response: apiError("UNAUTHORIZED", "Sessão inválida", 401) }
  }
  if (session.expiresAt < Date.now()) {
    delete db.sessions[token]
    save()
    return { kind: "error", response: apiError("SESSION_EXPIRED", "Sua sessão expirou", 401) }
  }
  const user = db.users.find((u) => u.id === session.userId)
  if (!user) {
    return { kind: "error", response: apiError("UNAUTHORIZED", "Sessão inválida", 401) }
  }
  return { kind: "user", user, token }
}