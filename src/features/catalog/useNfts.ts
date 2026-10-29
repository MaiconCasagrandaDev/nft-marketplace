import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CatalogSearch } from "@/lib/search"
import type { Nft, Paginated } from "@/types/nft"

export function useNfts(params: CatalogSearch) {
  return useQuery({
    queryKey: ["nfts", params],
    queryFn: async ({ signal }) =>
      (await api.get<Paginated<Nft>>("/nfts", { params, signal })).data,
    placeholderData: keepPreviousData,
  })
}