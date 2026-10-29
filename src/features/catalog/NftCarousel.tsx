import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "@/lib/api"
import { formatEth } from "@/lib/format"
import type { Nft } from "@/types/nft"

const PER_PAGE = 5
const PAGES = 3

// a chave começa com "nfts": os eventos de tempo real atualizam o carrossel junto com o catálogo
function useCarouselNfts() {
  return useQuery({
    queryKey: ["nfts", "carousel"],
    queryFn: async ({ signal }) => {
      const res = await api.get("/nfts", { signal })
      const body = res.data as { items?: Nft[]; data?: Nft[]; results?: Nft[] } | Nft[]
      return Array.isArray(body) ? body : (body.items ?? body.data ?? body.results ?? [])
    },
  })
}

export function NftCarousel({ title, excludeId }: { title: string; excludeId?: string }) {
  const { data } = useCarouselNfts()
  const [page, setPage] = useState(0)

  const all = (data ?? []).filter((n) => n.id !== excludeId).slice(0, PER_PAGE * PAGES)
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE))
  const visible = all.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  if (all.length === 0) return null

  return (
    <section aria-label={title} className="pb-16">
      <h2 className="border-b border-border pb-3 text-lg font-bold text-brand">{title}</h2>

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((nft) => (
          <li key={nft.id}>
            <Link to="/nft/$id" params={{ id: nft.id }} className="group block">
              <div className="bg-card p-1.5">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </div>
              <p className="mt-3 text-sm group-hover:text-brand-hover">{nft.name}</p>
              <p className="text-sm font-bold text-brand">{formatEth(nft.price)} ETH</p>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-8 flex justify-center gap-2" role="group" aria-label="Páginas do carrossel">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para a página ${i + 1}`}
              aria-current={i === page}
              onClick={() => setPage(i)}
              className={`size-3 rounded-full border border-brand ${i === page ? "bg-brand" : ""}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}