import type { Category, Network, Nft } from "@/types/nft"

const categories: Category[] = [
  "arte-digital", "fotografia", "musica", "arte-3d", "colecionaveis",
  "generativa", "jogos", "assinaturas", "utilidade",
]
const networks: Network[] = ["ethereum", "polygon", "solana"]

// Os 9 NFTs do design (Figma)
const featured = [
  { name: "Emerald Ape", token: 42, image: "green-ape.png", price: "1.19", rare: true },
  { name: "Sage Nomad", token: 9, image: "black-ape.png", price: "1.69", rare: false },
  { name: "Neon Vessel", token: 552, image: "green-ape.png", price: "1.99", previous: "2.29", rare: true },
  { name: "Cosmic Bloom", token: 118, image: "purple-ape.png", price: "1.29", rare: false },
  { name: "Violet Nomad", token: 314, image: "purple-ape.png", price: "1.39", rare: false },
  { name: "Ivory Baron", token: 88, image: "black-ape.png", price: "1.79", rare: false },
  { name: "Golden Beat", token: 207, image: "green-ape.png", price: "0.99", rare: false },
  { name: "Golden Frequency", token: 71, image: "orange-ape.png", price: "0.59", rare: false },
  { name: "Golden Signal", token: 160, image: "orange-ape.png", price: "0.39", rare: false },
]

const prefixes = ["Amber", "Onyx", "Jade", "Cobalt", "Sienna", "Opal", "Ember", "Mirage", "Atlas"]

const pad = (n: number, size: number) => String(n).padStart(size, "0")

function build(
  index: number,
  data: { name: string; token: number; image: string; price: string; previous?: string; rare: boolean },
): Nft {
  return {
    id: `nft-${pad(data.token, 3)}`,
    tokenId: `#${pad(data.token, 4)}`,
    name: `${data.name} #${pad(data.token, 3)}`,
    price: data.price,
    previousPrice: data.previous,
    category: categories[index % categories.length],
    network: networks[index % networks.length],
    rare: data.rare,
    image: `/nfts/${data.image}`,
    description:
      "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na rede, com arte desbloqueável e acesso para colecionadores.",
    available: index >= 9 && index % 7 === 0 ? 0 : ((index * 3) % 9) + 2,
    version: 1,
    createdAt: new Date(Date.UTC(2026, 6, 28 - index)).toISOString(),
  }
}

const extra = Array.from({ length: 27 }, (_, i) => {
  const src = featured[i % featured.length]
  const token = 100 + i * 13
  const price = (0.2 + ((i * 37) % 120) / 10).toFixed(2)
  return {
    name: `${prefixes[i % prefixes.length]} ${src.name.split(" ")[1]}`,
    token,
    image: src.image,
    price,
    rare: i % 5 === 0,
  }
})

export const nftsFixture: Nft[] = [...featured, ...extra].map((d, i) => build(i, d))