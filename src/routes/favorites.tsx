import { Link, useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { AccountShell } from "@/features/account/AccountShell"
import { NftCard, NftCardSkeleton } from "@/features/catalog/NftCard"
import { useNft } from "@/features/catalog/useNft"
import { useFavorites } from "@/features/favorites/useFavorites"

function FavoriteItem({ id }: { id: string }) {
  const { data: nft, isPending } = useNft(id)
  if (isPending) return <NftCardSkeleton />
  if (!nft) return null
  return <NftCard nft={nft} />
}

export function FavoritesPage() {
  const router = useRouter()
  const favorites = useFavorites()
  const ids = favorites.data ?? []

  return (
    <AccountShell active="favorites">
      <div>
        <div className="relative flex items-center justify-center py-2 md:justify-start md:py-0">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.history.back()}
            className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand md:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-lg font-bold md:text-base">Lista de interesse</h1>
        </div>

        <div className="mt-4 md:mt-[18px]">
          {favorites.isError ? (
            <div role="alert" className="py-8 text-center">
              <p className="mb-4">Não foi possível carregar seus favoritos.</p>
              <button
                type="button"
                onClick={() => favorites.refetch()}
                className="h-10 rounded-[3px] bg-brand px-5 text-sm font-bold text-primary-foreground hover:bg-brand-hover"
              >
                Tentar novamente
              </button>
            </div>
          ) : favorites.isPending ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <NftCardSkeleton key={i} />
              ))}
            </div>
          ) : ids.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-soft">
              <p className="mb-3">Você ainda não favoritou nenhum NFT.</p>
              <Link to="/" className="font-bold text-brand hover:text-brand-hover">
                Explorar o catálogo
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
              {ids.map((id) => (
                <li key={id}>
                  <FavoriteItem id={id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AccountShell>
  )
}