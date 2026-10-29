import { useParams } from "@tanstack/react-router"

export function NftDetailPage() {
  const { id } = useParams({ from: "/nft/$id" })
  return <p className="py-8">Detalhe do NFT {id}</p>
}