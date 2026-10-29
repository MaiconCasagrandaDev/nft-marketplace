export type Network = "ethereum" | "polygon" | "solana"

export type Category =
  | "arte-digital"
  | "fotografia"
  | "musica"
  | "arte-3d"
  | "colecionaveis"
  | "generativa"
  | "jogos"
  | "assinaturas"
  | "utilidade"

export interface Nft {
  id: string
  tokenId: string
  name: string
  price: string // ETH como string decimal, ex.: "1.19"
  previousPrice?: string // preço riscado, ex.: "2.29"
  category: Category
  network: Network
  rare: boolean
  image: string
  description: string
  available: number // unidades disponíveis
  version: number // sobe a cada alteração (usado no tempo real)
  createdAt: string
}

export interface NftListParams {
  q?: string
  category?: Category
  network?: Network
  minPrice?: string
  maxPrice?: string
  sort?: "recent" | "price-asc" | "price-desc"
  page?: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}