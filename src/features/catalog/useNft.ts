import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { api } from "@/lib/api"
import type { Nft } from "@/types/nft"

export function useNft(id: string) {
  return useQuery({
    queryKey: ["nft", id],
    queryFn: async ({ signal }) => (await api.get<Nft>(`/nfts/${id}`, { signal })).data,
    retry: (count, error) =>
      !(axios.isAxiosError(error) && error.response?.status === 404) && count < 2,
  })
}