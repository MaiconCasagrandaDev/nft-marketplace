import axios from "axios"
import type { ApiError } from "@/types/cart"
import { getToken } from "./auth-store"

export const api = axios.create({ baseURL: "/api" })

type UnauthorizedHandler = (code: string) => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function onUnauthorized(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
    const code = (error.response.data as { code?: string } | undefined)?.code
    if (code === "SESSION_EXPIRED" || code === "UNAUTHORIZED") {
      unauthorizedHandler?.(code)
    }
  }
  return Promise.reject(error)
})

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiError> | undefined
    if (data && typeof data.code === "string") return data as ApiError
  }
  return { code: "NETWORK", message: "Não foi possível conectar. Tente novamente." }
}