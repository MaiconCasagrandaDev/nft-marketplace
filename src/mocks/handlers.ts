import Decimal from "decimal.js"
import { delay, http, HttpResponse } from "msw"
import type { Category, Facets, Network, Nft, Paginated } from "@/types/nft"
import { getDb } from "./db"
const PAGE_SIZE = 9

export const handlers = [
  http.get("/api/nfts", async ({ request }) => {
    await delay(300)
    const p = new URL(request.url).searchParams
    const q = (p.get("q") ?? "").toLowerCase()
    const category = p.get("category")
    const network = p.get("network")
    const minPrice = p.get("minPrice")
    const maxPrice = p.get("maxPrice")
    const sort = p.get("sort") ?? "recent"
    const page = Math.max(1, Number(p.get("page") ?? 1))

    let items = getDb().nfts.filter((n) => {
      if (q && !n.name.toLowerCase().includes(q)) return false
      if (category && n.category !== category) return false
      if (network && n.network !== network) return false
      if (minPrice && new Decimal(n.price).lt(minPrice)) return false
      if (maxPrice && new Decimal(n.price).gt(maxPrice)) return false
      return true
    })

    items = [...items].sort((a, b) => {
      if (sort === "price-asc") return new Decimal(a.price).comparedTo(b.price)
      if (sort === "price-desc") return new Decimal(b.price).comparedTo(a.price)
      return b.createdAt.localeCompare(a.createdAt)
    })

    const body: Paginated<Nft> = {
      items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: items.length,
    }
    return HttpResponse.json(body)
  }),

  http.get("/api/nfts/facets", async () => {
    await delay(150)
    const categories = {} as Record<Category, number>
    const networks = {} as Record<Network, number>
    for (const n of getDb().nfts) {
      categories[n.category] = (categories[n.category] ?? 0) + 1
      networks[n.network] = (networks[n.network] ?? 0) + 1
    }
    const prices = getDb().nfts.map((n) => new Decimal(n.price))
    const body: Facets = {
      categories,
      networks,
      priceRange: {
        min: Decimal.min(...prices).toString(),
        max: Decimal.max(...prices).toString(),
      },
    }
    return HttpResponse.json(body)
  }),

  http.get("/api/nfts/:id", async ({ params }) => {
    await delay(300)
    const nft = getDb().nfts.find((n) => n.id === params.id)
    if (!nft) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "NFT não encontrado" },
        { status: 404 },
      )
    }
    return HttpResponse.json(nft)
  }),
]