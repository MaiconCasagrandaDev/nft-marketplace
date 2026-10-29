import { useNavigate, useSearch } from "@tanstack/react-router"
import { NftCard, NftCardSkeleton } from "@/features/catalog/NftCard"
import { useNfts } from "@/features/catalog/useNfts"
import { cn } from "@/lib/utils"

export function HomePage() {
  const search = useSearch({ from: "/" })
  const navigate = useNavigate({ from: "/" })
  const { data, isPending, isError, isFetching, refetch } = useNfts(search)

  const sort = search.sort ?? "recent"
  const page = search.page ?? 1
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  const goToPage = (p: number) =>
    navigate({ search: (prev) => ({ ...prev, page: p === 1 ? undefined : p }) })

  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <p role="status" className="text-text-soft">
          {data ? `${data.total} NFTs` : "Carregando..."}
        </p>
        <label className="flex items-center gap-2 text-sm">
          Ordenar por:
          <select
            value={sort}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  sort: e.target.value as "recent" | "price-asc" | "price-desc",
                  page: undefined,
                }),
              })
            }
            className="border border-border bg-card px-2 py-1"
          >
            <option value="recent">Listados recentemente</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
      </div>

      {isPending && (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <NftCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="py-12 text-center">
          <p className="mb-4">Não foi possível carregar os NFTs.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded bg-brand px-4 py-2 font-bold text-primary-foreground hover:bg-brand-hover"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="py-12 text-center text-text-soft">Nenhum NFT encontrado.</p>
      )}

      {data && data.items.length > 0 && (
        <div
          aria-busy={isFetching}
          className={cn(
            "grid grid-cols-2 gap-6 md:grid-cols-3",
            isFetching && "opacity-60",
          )}
        >
          {data.items.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-8 flex justify-end gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "size-8 border border-border",
                p === page && "bg-brand text-primary-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </section>
  )
}