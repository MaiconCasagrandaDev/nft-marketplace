import type { Category, Network } from "@/types/nft"

export const categoryLabels: Record<Category, string> = {
  "arte-digital": "Arte digital",
  fotografia: "Fotografia",
  musica: "Música",
  "arte-3d": "Arte 3D",
  colecionaveis: "Colecionáveis",
  generativa: "Generativa",
  jogos: "Jogos",
  assinaturas: "Assinaturas",
  utilidade: "Utilidade",
}

export const networkLabels: Record<Network, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  solana: "Solana",
}