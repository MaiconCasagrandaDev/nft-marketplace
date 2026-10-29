import { Link } from "@tanstack/react-router"
import { useNfts } from "@/features/catalog/useNfts"

export function FeaturedNft() {
  const { data } = useNfts({ q: "Cosmic Bloom" })
  const nft = data?.items[0]
  if (!nft) return null

  return (
    <Link to="/nft/$id" params={{ id: nft.id }} className="block overflow-hidden bg-card">
      <div className="px-4 pt-5">
        <p className="text-lg font-bold text-brand">NFT EM DESTAQUE</p>
        <p className="mb-3 pl-2 text-sm font-bold">OFERTA LIMITADA</p>
      </div>
      <img src={nft.image} alt={nft.name} loading="lazy" className="w-full rounded-2xl object-cover" />
    </Link>
  )
}