import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionKey } from "@/features/auth/useAuth"
import { api } from "@/lib/api"
import type { User } from "@/types/auth"
import type { Wallet } from "@/types/checkout"

export interface ProfileInput {
  displayName: string
  username: string
  email: string
  ensName: string
  avatarUrl: string | null
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ProfileInput>) =>
      (await api.patch<User>("/auth/me", input)).data,
    onSuccess: (user) => qc.setQueryData(sessionKey, user),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      await api.post("/auth/password", input)
    },
  })
}

export type WalletInput = Pick<Wallet, "label" | "address" | "network"> & { primary: boolean }

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: WalletInput) => (await api.post<Wallet>("/wallets", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}

export function useUpdateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<WalletInput>) =>
      (await api.patch<Wallet>(`/wallets/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}

export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wallets/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}