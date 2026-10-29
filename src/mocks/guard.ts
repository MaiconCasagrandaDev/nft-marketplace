import { apiError, resolveCaller } from "./auth"
import type { StoredUser } from "./db"

export function requireUser(request: Request): StoredUser | Response {
  const caller = resolveCaller(request)
  if (caller.kind === "error") return caller.response
  if (caller.kind === "guest") return apiError("UNAUTHORIZED", "Não autenticado", 401)
  return caller.user
}