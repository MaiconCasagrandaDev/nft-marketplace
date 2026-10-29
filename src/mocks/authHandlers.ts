import { delay, http, HttpResponse } from "msw"
import type { AuthResponse } from "@/types/auth"
import { apiError, createSession, hashPassword, resolveCaller, toUser } from "./auth"
import { getDb, save, type StoredUser } from "./db"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mergeGuestCart(userId: string) {
  const db = getDb()
  const guest = db.carts.guest
  if (!guest || (guest.items.length === 0 && !guest.coupon)) return
  const key = `user:${userId}`
  db.carts[key] ??= { items: [], coupon: null }
  const target = db.carts[key]
  for (const it of guest.items) {
    const nft = db.nfts.find((n) => n.id === it.nftId)
    if (!nft) continue
    const existing = target.items.find((i) => i.nftId === it.nftId)
    const qty = Math.min((existing?.quantity ?? 0) + it.quantity, nft.available)
    if (qty < 1) continue
    if (existing) existing.quantity = qty
    else target.items.push({ nftId: it.nftId, quantity: qty })
  }
  if (!target.coupon && guest.coupon) target.coupon = guest.coupon
  db.carts.guest = { items: [], coupon: null }
}

function authResponse(user: StoredUser, status = 200) {
  const token = createSession(user.id)
  mergeGuestCart(user.id)
  save()
  const body: AuthResponse = { user: toUser(user), token }
  return HttpResponse.json(body, { status })
}

export const authHandlers = [
  http.post("/api/auth/register", async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as {
      username?: string
      email?: string
      password?: string
    }
    const username = (body.username ?? "").trim()
    const email = (body.email ?? "").trim().toLowerCase()
    const password = body.password ?? ""

    const fields: Record<string, string> = {}
    if (username.length < 3) fields.username = "Use ao menos 3 caracteres"
    if (!EMAIL_RE.test(email)) fields.email = "E-mail inválido"
    if (password.length < 8) fields.password = "Use ao menos 8 caracteres"
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    const db = getDb()
    if (db.users.some((u) => u.email === email)) {
      return apiError("EMAIL_TAKEN", "Este e-mail já está cadastrado", 409, {
        fields: { email: "Este e-mail já está cadastrado" },
      })
    }
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return apiError("USERNAME_TAKEN", "Este nome de usuário já existe", 409, {
        fields: { username: "Este nome de usuário já existe" },
      })
    }

    const user: StoredUser = {
      id: `u${crypto.randomUUID().slice(0, 8)}`,
      username,
      email,
      displayName: username,
      ensName: "",
      avatarUrl: null,
      passwordHash: await hashPassword(password),
    }
    db.users.push(user)
    return authResponse(user, 201)
  }),

  http.post("/api/auth/login", async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { email?: string; password?: string }
    const email = (body.email ?? "").trim().toLowerCase()
    const password = body.password ?? ""

    const fields: Record<string, string> = {}
    if (!EMAIL_RE.test(email)) fields.email = "E-mail inválido"
    if (!password) fields.password = "Informe a senha"
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    const user = getDb().users.find((u) => u.email === email)
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      return apiError("INVALID_CREDENTIALS", "E-mail ou senha incorretos", 401)
    }
    return authResponse(user)
  }),

  http.get("/api/auth/me", async ({ request }) => {
    await delay(100)
    const caller = resolveCaller(request)
    if (caller.kind === "error") return caller.response
    if (caller.kind === "guest") return apiError("UNAUTHORIZED", "Não autenticado", 401)
    return HttpResponse.json(toUser(caller.user))
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await delay(100)
    const caller = resolveCaller(request)
    if (caller.kind === "user") {
      delete getDb().sessions[caller.token]
      save()
    }
    return HttpResponse.json({ ok: true })
  }),
]