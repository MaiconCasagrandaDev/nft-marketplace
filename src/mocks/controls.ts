import { expireSessions, getDb, resetDb, save } from "./db"
import { disconnectClients, emitNftUpdated, emitRaw, replayLast } from "./realtime"
import { scenarios, type ScenarioName, type Scenarios } from "./scenarios"

const DECIMAL = /^\d+(\.\d+)?$/

function findNft(id: string) {
  const nft = getDb().nfts.find((n) => n.id === id)
  if (!nft) throw new Error(`NFT "${id}" não encontrado. Use kurioMock.listNfts()`)
  return nft
}

export const controls = {
  reset: () => {
    resetDb()
    location.reload()
  },
  expireSessions,
  setScenario: <K extends ScenarioName>(name: K, value: Scenarios[K]) => {
    scenarios[name] = value
  },
  listNfts: () => {
    console.table(
      getDb().nfts.map((n) => ({
        id: n.id,
        nome: n.name,
        preco: n.price,
        disponivel: n.available,
        versao: n.version,
      })),
    )
  },
  // muda o preço no servidor falso e avisa os clientes por nft.updated
  setPrice: (id: string, price: string) => {
    if (!DECIMAL.test(price)) throw new Error('Preço inválido. Exemplo: "0.50"')
    const nft = findNft(id)
    const previous = { price: nft.price, available: nft.available }
    nft.previousPrice = nft.price
    nft.price = price
    nft.version += 1
    save()
    emitNftUpdated(nft, previous)
  },
  setStock: (id: string, available: number) => {
    const nft = findNft(id)
    const previous = { price: nft.price, available: nft.available }
    nft.available = Math.max(0, Math.floor(available))
    nft.version += 1
    save()
    emitNftUpdated(nft, previous)
  },
  // reenvia o último evento (duplicado): o app deve ignorar
  replayLastEvent: replayLast,
  // envia um evento com versão antiga e dados falsos: o app deve ignorar
  emitStaleEvent: (id: string) => {
    const nft = findNft(id)
    emitRaw("nft.updated", {
      id: `evt_${crypto.randomUUID()}`,
      type: "nft.updated",
      resource: `nft:${nft.id}`,
      version: nft.version - 1,
      occurredAt: new Date().toISOString(),
      data: {
        nft: { ...nft, price: "9.99" },
        previous: { price: nft.price, available: nft.available },
      },
    })
  },
  // derruba as conexões e recusa novas por alguns segundos
  disconnectSockets: (ms = 3000) => disconnectClients(ms),
}

export type Controls = typeof controls