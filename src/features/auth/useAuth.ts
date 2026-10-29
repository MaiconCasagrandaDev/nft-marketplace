import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useSyncExternalStore } from "react"
import { api } from "@/lib/api"
import { clearToken, getToken, setToken, subscribeToken } from "@/lib/auth-store"
import type { AuthResponse, User } from "@/types/auth"

export const sessionKey = ["session"] as const

export function useToken() {
  return useSyncExternalStore(subscribeToken, getToken, () => null)
}

export function useSession() {
  const token = useToken()
  const query = useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }) => (await api.get<User>("/auth/me", { signal })).data,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  return {
    user: token ? (query.data ?? null) : null,
    isLoading: !!token && query.isPending,
  }
}

function finishAuth(qc: QueryClient, data: AuthResponse) {
  setToken(data.token)
  qc.setQueryData(sessionKey, data.user)
  // o carrinho do visitante foi mesclado no servidor: busca de novo
  qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== sessionKey[0] })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) =>
      (await api.post<AuthResponse>("/auth/login", input)).data,
    onSuccess: (data) => finishAuth(qc, data),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { username: string; email: string; password: string }) =>
      (await api.post<AuthResponse>("/auth/register", input)).data,
    onSuccess: (data) => finishAuth(qc, data),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout")
      } catch {
        /* encerra localmente mesmo se o servidor falhar */
      }
    },
    onSettled: () => {
      clearToken()
      qc.clear() // nada do usuário anterior fica no cache
      router.navigate({ to: "/" })
    },
  })
}