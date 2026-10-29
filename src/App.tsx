import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Nft, Paginated } from "@/types/nft"

export default function App() {
  const { data, isPending, error } = useQuery({
    queryKey: ["nfts"],
    queryFn: async ({ signal }) =>
      (await api.get<Paginated<Nft>>("/nfts", { signal })).data,
  })

  if (isPending) return <p className="p-8">Carregando...</p>
  if (error) return <p className="p-8">Erro ao carregar</p>

  return (
    <main className="p-8">
      <p className="mb-4">{data.total} NFTs</p>
      <ul>
        {data.items.map((n) => (
          <li key={n.id}>
            {n.name} · {n.price} ETH · {n.category}
          </li>
        ))}
      </ul>
    </main>
  )
}