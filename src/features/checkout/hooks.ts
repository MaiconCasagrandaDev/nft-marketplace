import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useRef } from "react"
import { api } from "@/lib/api"
import type { CreateOrderInput, Order, Quote, Wallet } from "@/types/checkout"
import type { Network } from "@/types/nft"

export const quoteKey = ["checkout", "quote"] as const
export const walletsKey = ["wallets"] as const
export const orderKey = (id: string) => ["orders", id] as const

export function useQuote() {
  return useQuery({
    queryKey: quoteKey,
    queryFn: async ({ signal }) => (await api.get<Quote>("/checkout/quote", { signal })).data,
    staleTime: 0,
  })
}

export function useWallets() {
  return useQuery({
    queryKey: walletsKey,
    queryFn: async ({ signal }) => (await api.get<Wallet[]>("/wallets", { signal })).data,
  })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: async (input: { walletId: string; network: Network }) =>
      (await api.post(`/wallets/${input.walletId}/connect`, { network: input.network })).data,
  })
}

// extrai a cotação nova que a API devolve em conflitos (QUOTE_CHANGED etc.)
export function errorQuote(error: unknown): Quote | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { quote?: Quote } | undefined)?.quote
  }
  return undefined
}

export function useCreateOrder() {
  // a chave de idempotência só muda quando o conteúdo do pedido muda
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null)

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const fingerprint = JSON.stringify(input)
      let current = attempt.current
      if (!current || current.fingerprint !== fingerprint) {
        current = { fingerprint, key: crypto.randomUUID() }
        attempt.current = current
      }
      const { data } = await api.post<Order>("/orders", input, {
        headers: { "Idempotency-Key": current.key },
        timeout: 8000,
      })
      return data
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKey(id),
    queryFn: async ({ signal }) => (await api.get<Order>(`/orders/${id}`, { signal })).data,
    // pedido pendente é consultado até a simulação responder
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 1000 : false),
    retry: (count, error) =>
      !(axios.isAxiosError(error) && error.response?.status === 404) && count < 2,
  })
}