import { useRouter } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import type { MouseEvent } from "react"
import { useToken } from "@/features/auth/useAuth"
import { cn } from "@/lib/utils"
import { useFavorites, useToggleFavorite } from "./useFavorites"

interface Props {
  nftId: string
  nftName: string
  showLabel?: boolean
  className?: string
}

export function FavoriteButton({ nftId, nftName, showLabel = false, className }: Props) {
  const router = useRouter()
  const token = useToken()
  const { data: ids = [] } = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = ids.includes(nftId)

  function onClick(event: MouseEvent) {
    // o botão pode ficar dentro de um card clicável
    event.preventDefault()
    event.stopPropagation()
    if (!token) {
      router.navigate({
        to: "/login",
        search: { redirect: router.state.location.href },
      })
      return
    }
    toggle.mutate({ nftId, favorite: !isFavorite })
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remover ${nftName} dos favoritos` : `Favoritar ${nftName}`}
        className={cn(
          showLabel
            ? "flex items-center gap-2 rounded border border-brand px-4 py-2 hover:text-brand-hover"
            : "grid size-9 place-items-center rounded-full bg-background/70 hover:text-brand-hover",
          className,
        )}
      >
        <Heart className={cn(showLabel ? "size-4" : "size-5", isFavorite && "fill-brand text-brand")} />
        {showLabel && (isFavorite ? "Favoritado" : "Favoritar")}
      </button>
      {toggle.isError && (
        <span
          role="alert"
          className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-card px-2 py-1 text-xs text-red-400"
        >
          Não foi possível salvar. Tente de novo.
        </span>
      )}
    </span>
  )
}