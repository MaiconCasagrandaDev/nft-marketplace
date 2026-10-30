import { Link } from "@tanstack/react-router"
import { FavoriteButton } from "@/features/favorites/FavoriteButton"
import type { Nft } from "@/types/nft"

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <article className="relative">
      <div className="absolute right-4 top-4 z-10 md:hidden">
        <FavoriteButton nftId={nft.id} nftName={nft.name} />
      </div>
      <Link to="/nft/$id" params={{ id: nft.id }} className="group block">
        <div className="relative rounded-2xl bg-card p-2 md:rounded-none md:p-4">
          {nft.rare && (
            <span className="absolute left-0 top-4 z-10 bg-brand px-2 py-1 text-xs font-bold text-primary-foreground">
              RARO
            </span>
          )}
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="aspect-square w-full rounded-xl object-cover"
          />
        </div>
        <h3 className="mt-3 text-sm group-hover:text-brand-hover md:text-base">{nft.name}</h3>
        <p className="text-sm font-bold text-brand md:text-base">
          {nft.price} ETH
          {nft.previousPrice && (
            <span className="ml-2 font-normal text-text-soft line-through">
              {nft.previousPrice} ETH
            </span>
          )}
        </p>
        {nft.available === 0 && <p className="text-sm text-text-soft">Esgotado</p>}
      </Link>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="shimmer aspect-square w-full bg-card" />
      <div className="shimmer mt-3 h-5 w-2/3 bg-card" />
      <div className="shimmer mt-2 h-5 w-1/3 bg-card" />
    </div>
  )
}