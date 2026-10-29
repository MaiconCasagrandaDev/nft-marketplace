import { useNavigate, useParams, Link } from "@tanstack/react-router"
import axios from "axios"
import { Heart, Minus, Plus } from "lucide-react"
import { useState } from "react"
import { useAddToCart } from "@/features/cart/useCart"
import { useNft } from "@/features/catalog/useNft"
import { getApiError } from "@/lib/api"
import { formatEth } from "@/lib/format"
import { categoryLabels, networkLabels } from "@/lib/labels"

export function NftDetailPage() {
  const { id } = useParams({ from: "/nft/$id" })
  const navigate = useNavigate()
  const { data: nft, isPending, error, refetch } = useNft(id)
  const add = useAddToCart()
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="grid gap-8 py-8 md:grid-cols-2" aria-busy="true">
        <div className="shimmer aspect-square bg-card" />
        <div className="grid content-start gap-4">
          <div className="shimmer h-10 w-2/3 bg-card" />
          <div className="shimmer h-6 w-1/4 bg-card" />
          <div className="shimmer h-24 w-full bg-card" />
        </div>
      </div>
    )
  }

  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">NFT não encontrado</h1>
        <Link to="/" className="text-brand hover:text-brand-hover">Voltar ao catálogo</Link>
      </div>
    )
  }

  if (error || !nft) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar este NFT.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded bg-brand px-4 py-2 font-bold text-primary-foreground hover:bg-brand-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const soldOut = nft.available === 0

  const buy = () => {
    setMessage(null)
    add.mutate(
      { nftId: nft.id, quantity: qty },
      {
        onSuccess: () => navigate({ to: "/cart" }),
        onError: (e) => setMessage(getApiError(e).message),
      },
    )
  }

  return (
    <article className="grid gap-8 py-8 md:grid-cols-2">
      <div className="bg-card p-4">
        <img src={nft.image} alt={nft.name} className="aspect-square w-full rounded-xl object-cover" />
      </div>

      <div className="grid content-start gap-4">
        <h1 className="text-3xl font-bold">{nft.name}</h1>
        <p className="text-2xl font-bold text-brand">
          {formatEth(nft.price)} ETH
          {nft.previousPrice && (
            <span className="ml-3 text-base font-normal text-text-soft line-through">
              {formatEth(nft.previousPrice)} ETH
            </span>
          )}
        </p>
        <p className="text-text-soft">{nft.description}</p>

        <p className="text-sm">
          {soldOut ? "Esgotado" : `Disponíveis: ${nft.available}`}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={qty <= 1}
              onClick={() => setQty((q) => q - 1)}
              className="grid size-9 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span aria-live="polite" className="w-6 text-center">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={qty >= nft.available}
              onClick={() => setQty((q) => q + 1)}
              className="grid size-9 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={buy}
            disabled={soldOut || add.isPending}
            className="rounded bg-brand px-6 py-2 font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            {add.isPending ? "Adicionando..." : "COMPRAR"}
          </button>

          <button
            type="button"
            disabled
            title="Entre para favoritar"
            className="flex items-center gap-2 rounded border border-brand px-4 py-2 opacity-60"
          >
            <Heart className="size-4" /> Favoritar
          </button>
        </div>

        {message && (
          <p role="alert" className="text-red-400">{message}</p>
        )}

        <dl className="grid gap-1 text-sm text-text-soft">
          <div><dt className="inline">ID do token: </dt><dd className="inline">{nft.tokenId}</dd></div>
          <div><dt className="inline">Coleção: </dt><dd className="inline">{categoryLabels[nft.category]}</dd></div>
          <div><dt className="inline">Rede: </dt><dd className="inline">{networkLabels[nft.network]}</dd></div>
        </dl>
      </div>
    </article>
  )
}