import { delay, http, HttpResponse } from "msw"
import type { Wallet } from "@/types/checkout"
import { apiError, hashPassword, toUser } from "./auth"
import { getDb, save } from "./db"
import { requireUser } from "./guard"
import { walletsOf } from "./walletHandlers"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NETWORKS = ["ethereum", "polygon", "solana"]
const EVM = /^0x[0-9a-fA-F]{40}$/
const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const MAX_AVATAR = 300_000

function validAddress(network: string, address: string) {
  return network === "solana" ? SOLANA.test(address) : EVM.test(address)
}

export const accountHandlers = [
  http.patch("/api/auth/me", async ({ request }) => {
    await delay(250)
    const caller = requireUser(request)
    if (caller instanceof Response) return caller
    const db = getDb()
    const user = db.users.find((u) => u.id === caller.id)
    if (!user) return apiError("UNAUTHORIZED", "Sessão inválida", 401)

    const body = (await request.json()) as {
      displayName?: string
      username?: string
      email?: string
      ensName?: string
      avatarUrl?: string | null
    }
    const fields: Record<string, string> = {}

    if (body.displayName !== undefined && body.displayName.trim().length < 3) {
      fields.displayName = "Informe ao menos 3 caracteres"
    }
    if (body.username !== undefined) {
      const username = body.username.trim()
      if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        fields.username = "Use letras, números ou _ (mínimo 3)"
      } else if (
        db.users.some((u) => u.id !== user.id && u.username.toLowerCase() === username.toLowerCase())
      ) {
        fields.username = "Nome de usuário já em uso"
      }
    }
    if (body.email !== undefined) {
      const email = body.email.trim()
      if (!EMAIL_RE.test(email)) fields.email = "E-mail inválido"
      else if (db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase())) {
        fields.email = "E-mail já cadastrado"
      }
    }
    if (body.ensName !== undefined && !/^[a-zA-Z0-9-]*$/.test(body.ensName.trim())) {
      fields.ensName = "Use letras, números ou hífen"
    }
    if (body.avatarUrl) {
      const ok = body.avatarUrl.startsWith("data:image/") && body.avatarUrl.length <= MAX_AVATAR
      if (!ok) fields.avatarUrl = "Imagem inválida ou muito grande"
    }
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    if (body.displayName !== undefined) user.displayName = body.displayName.trim()
    if (body.username !== undefined) user.username = body.username.trim()
    if (body.email !== undefined) user.email = body.email.trim()
    if (body.ensName !== undefined) user.ensName = body.ensName.trim()
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl
    save()
    return HttpResponse.json(toUser(user))
  }),

  http.post("/api/auth/password", async ({ request }) => {
    await delay(300)
    const caller = requireUser(request)
    if (caller instanceof Response) return caller
    const user = getDb().users.find((u) => u.id === caller.id)
    if (!user) return apiError("UNAUTHORIZED", "Sessão inválida", 401)

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
    const fields: Record<string, string> = {}
    if (!body.currentPassword || (await hashPassword(body.currentPassword)) !== user.passwordHash) {
      fields.currentPassword = "Senha atual incorreta"
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      fields.newPassword = "Use ao menos 8 caracteres"
    }
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }
    user.passwordHash = await hashPassword(body.newPassword as string)
    save()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post("/api/wallets", async ({ request }) => {
    await delay(250)
    const caller = requireUser(request)
    if (caller instanceof Response) return caller
    const list = walletsOf(caller.id)
    const body = (await request.json()) as Partial<Wallet>

    const fields: Record<string, string> = {}
    if (!body.label || body.label.trim().length < 2) fields.label = "Informe um nome"
    if (!body.network || !NETWORKS.includes(body.network)) fields.network = "Selecione a rede"
    const address = (body.address ?? "").trim()
    if (!body.network || !validAddress(body.network, address)) fields.address = "Endereço inválido"
    else if (list.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
      fields.address = "Esta carteira já foi cadastrada"
    }
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    const makePrimary = body.primary === true || list.length === 0
    if (makePrimary) for (const w of list) w.primary = false
    const wallet: Wallet = {
      id: `w${crypto.randomUUID().slice(0, 6)}`,
      label: (body.label as string).trim(),
      address,
      network: body.network as Wallet["network"],
      primary: makePrimary,
    }
    list.push(wallet)
    save()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch("/api/wallets/:id", async ({ request, params }) => {
    await delay(250)
    const caller = requireUser(request)
    if (caller instanceof Response) return caller
    const list = walletsOf(caller.id)
    const wallet = list.find((w) => w.id === params.id)
    if (!wallet) return apiError("NOT_FOUND", "Carteira não encontrada", 404)
    const body = (await request.json()) as Partial<Wallet>

    const network = body.network ?? wallet.network
    const address = (body.address ?? wallet.address).trim()
    const fields: Record<string, string> = {}
    if (body.label !== undefined && body.label.trim().length < 2) fields.label = "Informe um nome"
    if (!NETWORKS.includes(network)) fields.network = "Selecione a rede"
    if (!validAddress(network, address)) fields.address = "Endereço inválido"
    else if (list.some((w) => w.id !== wallet.id && w.address.toLowerCase() === address.toLowerCase())) {
      fields.address = "Esta carteira já foi cadastrada"
    }
    if (Object.keys(fields).length > 0) {
      return apiError("VALIDATION", "Dados inválidos", 422, { fields })
    }

    if (body.label !== undefined) wallet.label = body.label.trim()
    wallet.network = network
    wallet.address = address
    if (body.primary === true) {
      for (const w of list) w.primary = w.id === wallet.id
    }
    save()
    return HttpResponse.json(wallet)
  }),

  http.delete("/api/wallets/:id", async ({ request, params }) => {
    await delay(250)
    const caller = requireUser(request)
    if (caller instanceof Response) return caller
    const db = getDb()
    const list = walletsOf(caller.id)
    const index = list.findIndex((w) => w.id === params.id)
    if (index === -1) return apiError("NOT_FOUND", "Carteira não encontrada", 404)
    if (list.length === 1) {
      return apiError("LAST_WALLET", "Mantenha ao menos uma carteira na conta", 409)
    }
    const [removed] = list.splice(index, 1)
    if (removed.primary && list[0]) list[0].primary = true
    db.wallets[caller.id] = list
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]