import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Cart } from "@/types/cart"

const KEY = ["cart"]

export function useCart() {
  return useQuery({
    queryKey: KEY,
    queryFn: async ({ signal }) => (await api.get<Cart>("/cart", { signal })).data,
  })
}

function useCartMutation<V>(fn: (v: V) => Promise<Cart>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => qc.setQueryData(KEY, cart),
  })
}

export const useAddToCart = () =>
  useCartMutation(
    async (v: { nftId: string; quantity: number }) => (await api.post<Cart>("/cart/items", v)).data,
  )

export const useUpdateQuantity = () =>
  useCartMutation(
    async (v: { nftId: string; quantity: number }) =>
      (await api.patch<Cart>(`/cart/items/${v.nftId}`, { quantity: v.quantity })).data,
  )

export const useRemoveItem = () =>
  useCartMutation(async (nftId: string) => (await api.delete<Cart>(`/cart/items/${nftId}`)).data)

export const useApplyCoupon = () =>
  useCartMutation(async (code: string) => (await api.post<Cart>("/cart/coupon", { code })).data)

export const useRemoveCoupon = () =>
  useCartMutation(async (_: void) => (await api.delete<Cart>("/cart/coupon")).data)