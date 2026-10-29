import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useToken } from "@/features/auth/useAuth"

export const favoritesKey = ["favorites"] as const
const mutationKey = ["favorite"] as const

export function useFavorites() {
  const token = useToken()
  return useQuery({
    queryKey: favoritesKey,
    queryFn: async ({ signal }) =>
      (await api.get<{ ids: string[] }>("/favorites", { signal })).data.ids,
    enabled: !!token,
    staleTime: 60_000,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey,
    mutationFn: async ({ nftId, favorite }: { nftId: string; favorite: boolean }) => {
      if (favorite) await api.put(`/favorites/${nftId}`)
      else await api.delete(`/favorites/${nftId}`)
    },
    onMutate: async ({ nftId, favorite }) => {
      await qc.cancelQueries({ queryKey: favoritesKey })
      const previous = qc.getQueryData<string[]>(favoritesKey) ?? []
      qc.setQueryData<string[]>(
        favoritesKey,
        favorite ? [...new Set([...previous, nftId])] : previous.filter((id) => id !== nftId),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context) qc.setQueryData(favoritesKey, context.previous)
    },
    onSettled: () => {
      // só reconcilia com o servidor quando for a última mutação em andamento
      if (qc.isMutating({ mutationKey }) <= 1) {
        qc.invalidateQueries({ queryKey: favoritesKey })
      }
    },
  })
}