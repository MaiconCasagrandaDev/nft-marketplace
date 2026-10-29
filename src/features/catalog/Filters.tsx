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

function PriceFilter({
  initialMin,
  initialMax,
  onApply,
}: {
  initialMin: string
  initialMax: string
  onApply: (min?: string, max?: string) => void
}) {
  const [min, setMin] = useState(initialMin)
  const [max, setMax] = useState(initialMax)
  const valid = (v: string) => v === "" || /^\d+(\.\d+)?$/.test(v)
  const invalid = !valid(min) || !valid(max)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (invalid) return
        onApply(min || undefined, max || undefined)
      }}
      className="grid gap-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          Mín. (ETH)
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            inputMode="decimal"
            aria-invalid={!valid(min)}
            className="border border-border bg-background px-2 py-1"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Máx. (ETH)
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            inputMode="decimal"
            aria-invalid={!valid(max)}
            className="border border-border bg-background px-2 py-1"
          />
        </label>
      </div>
      {invalid && (
        <p role="alert" className="text-sm text-red-400">
          Use apenas números, por exemplo 1.5
        </p>
      )}
      <button
        type="submit"
        className="w-fit rounded bg-brand px-3 py-1 text-sm font-bold text-primary-foreground hover:bg-brand-hover"
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
      "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:text-brand-hover",
      selected && "font-bold text-brand",
    )

  return (
    <div className="grid gap-6 bg-card p-5">
      <section aria-labelledby="f-colecoes">
        <h2 id="f-colecoes" className="mb-2 font-bold">Coleções</h2>
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
        <h2 id="f-preco" className="mb-2 font-bold">Faixa de preço</h2>
        {facets && (
          <p className="mb-2 text-sm text-text-soft">
            Disponível: {facets.priceRange.min} - {facets.priceRange.max} ETH
          </p>
        )}
        <PriceFilter
          key={`${search.minPrice ?? ""}-${search.maxPrice ?? ""}`}
          initialMin={search.minPrice ?? ""}
          initialMax={search.maxPrice ?? ""}
          onApply={(min, max) => setFilter({ minPrice: min, maxPrice: max })}
        />
      </section>

      <section aria-labelledby="f-rede">
        <h2 id="f-rede" className="mb-2 font-bold">Rede</h2>
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