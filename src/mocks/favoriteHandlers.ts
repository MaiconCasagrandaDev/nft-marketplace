import { delay, http, HttpResponse } from "msw"
import { apiError, resolveCaller } from "./auth"
import { getDb, save, type StoredUser } from "./db"
import { scenarios } from "./scenarios"

function requireUser(request: Request): StoredUser | Response {
  const caller = resolveCaller(request)
  if (caller.kind === "error") return caller.response
  if (caller.kind === "guest") return apiError("UNAUTHORIZED", "Não autenticado", 401)
  return caller.user
}

function listOf(userId: string) {
  const db = getDb()
  db.favorites[userId] ??= []
  return db.favorites[userId]
}

export const favoriteHandlers = [
  http.get("/api/favorites", async ({ request }) => {
    await delay(150)
    const user = requireUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json({ ids: listOf(user.id) })
  }),

  http.put("/api/favorites/:nftId", async ({ request, params }) => {
    await delay(400)
    const user = requireUser(request)
    if (user instanceof Response) return user
    if (scenarios.failFavorites) return apiError("SERVER_ERROR", "Falha ao salvar favorito", 500)
    const nftId = String(params.nftId)
    if (!getDb().nfts.some((n) => n.id === nftId)) {
      return apiError("NOT_FOUND", "NFT não encontrado", 404)
    }
    const list = listOf(user.id)
    if (!list.includes(nftId)) list.push(nftId)
    save()
    return HttpResponse.json({ ids: list })
  }),

  http.delete("/api/favorites/:nftId", async ({ request, params }) => {
    await delay(400)
    const user = requireUser(request)
    if (user instanceof Response) return user
    if (scenarios.failFavorites) return apiError("SERVER_ERROR", "Falha ao salvar favorito", 500)
    const db = getDb()
    db.favorites[user.id] = listOf(user.id).filter((id) => id !== String(params.nftId))
    save()
    return HttpResponse.json({ ids: db.favorites[user.id] })
  }),
]