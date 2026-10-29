import axios from "axios"
import type { ApiError } from "@/types/cart"

export const api = axios.create({ baseURL: "/api" })

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data?.code) {
    return error.response.data as ApiError
  }
  return { code: "NETWORK", message: "Falha de conexão. Tente novamente." }
}