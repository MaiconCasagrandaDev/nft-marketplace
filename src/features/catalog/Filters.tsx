import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { api } from "@/lib/api"
import { categoryLabels, networkLabels } from "@/lib/labels"
import type { CatalogSearch } from "@/lib/search"
import { cn } from "@/lib/utils"
import type { Category, Facets, Network } from "@/types/nft"

function useFacets() {
  return useQuery({
    queryKey: ["nfts", "facets"],
    queryFn: async ({ signal }) => (await api.get<Facets>("/nfts/facets", { signal })).data,
  })
}

const thumb =
  "pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 " +
  "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 " +
  "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand"

const fmt = (v: number) => v.toFixed(2).replace(".", ",")

function PriceFilter({
  range,
  initialMin,
  initialMax,
  onApply,
}: {
  range: Facets["priceRange"]
  initialMin: string
  initialMax: string
  onApply: (min?: string, max?: string) => void
}) {
  const lo = Number(range.min)
  const hi = Number(range.max)
  const span = hi - lo || 1
  const [value, setValue] = useState<[number, number]>([
    initialMin ? Number(initialMin) : lo,
    initialMax ? Number(initialMax) : hi,
  ])

  const left = ((value[0] - lo) / span) * 100
  const right = ((value[1] - lo) / span) * 100

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onApply(
          value[0] <= lo ? undefined : value[0].toFixed(2),
          value[1] >= hi ? undefined : value[1].toFixed(2),
        )
      }}
      className="grid gap-3"
    >
      <div className="relative mx-1 mt-2 h-4">
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-brand"
          style={{ left: `${left}%`, width: `${Math.max(right - left, 0)}%` }}
        />
        <input
          type="range"
          aria-label="Preço mínimo (ETH)"
          min={lo}
          max={hi}
          step={0.01}
          value={value[0]}
          onChange={(e) => setValue([Math.min(Number(e.target.value), value[1]), value[1]])}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Preço máximo (ETH)"
          min={lo}
          max={hi}
          step={0.01}
          value={value[1]}
          onChange={(e) => setValue([value[0], Math.max(Number(e.target.value), value[0])])}
          className={thumb}
        />
      </div>
      <p className="text-xs" aria-live="polite">
        Preço: {fmt(value[0])} - {fmt(value[1])} ETH
      </p>
      <button
        type="submit"
        className="w-fit rounded-sm bg-brand px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-brand-hover"
      >
        Aplicar
      </button>
    </form>
  )
}

export function Filters() {
  const search = useSearch({ from: "/" })
  const navigate = useNavigate({ from: "/" })
  const { data: facets } = useFacets()

  const setFilter = (patch: Partial<CatalogSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) })

  const option = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:text-brand-hover",
      selected && "font-bold text-brand",
    )

  return (
    <div className="grid gap-6 bg-card p-5">
      <section aria-labelledby="f-colecoes">
        <h2 id="f-colecoes" className="mb-2 text-sm font-bold">
          Coleções
        </h2>
        <ul>
          {(Object.keys(categoryLabels) as Category[]).map((key) => (
            <li key={key}>
              <button
                type="button"
                aria-pressed={search.category === key}
                onClick={() => setFilter({ category: search.category === key ? undefined : key })}
                className={option(search.category === key)}
              >
                <span>{categoryLabels[key]}</span>
                <span>({facets?.categories[key] ?? 0})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="f-preco">
        <h2 id="f-preco" className="mb-3 text-sm font-bold">
          Faixa de preço
        </h2>
        {facets ? (
          <PriceFilter
            key={`${search.minPrice ?? ""}-${search.maxPrice ?? ""}`}
            range={facets.priceRange}
            initialMin={search.minPrice ?? ""}
            initialMax={search.maxPrice ?? ""}
            onApply={(min, max) => setFilter({ minPrice: min, maxPrice: max })}
          />
        ) : (
          <p className="text-xs text-text-soft">Carregando...</p>
        )}
      </section>

      <section aria-labelledby="f-rede">
        <h2 id="f-rede" className="mb-2 text-sm font-bold">
          Rede
        </h2>
        <ul>
          {(Object.keys(networkLabels) as Network[]).map((key) => (
            <li key={key}>
              <button
                type="button"
                aria-pressed={search.network === key}
                onClick={() => setFilter({ network: search.network === key ? undefined : key })}
                className={option(search.network === key)}
              >
                <span>{networkLabels[key]}</span>
                <span>({facets?.networks[key] ?? 0})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}