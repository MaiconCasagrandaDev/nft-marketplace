import { toSocketIo } from "@mswjs/socket.io-binding"
import { ws } from "msw"
import { REALTIME_URL } from "@/lib/config"
import type { Order } from "@/types/checkout"
import type { Nft } from "@/types/nft"
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/realtime"
import { getDb } from "./db"

const link = ws.link(`${REALTIME_URL}/*`)

interface MockClient {
  userId: string | null
  emit: (event: string, payload: unknown) => void
  close: () => void
}

const clients = new Set<MockClient>()
let blockedUntil = 0
let last: { event: string; payload: unknown; userId: string | null } | null = null

function userFromToken(token: string | null) {
  if (!token) return null
  const session = getDb().sessions[token]
  return session && session.expiresAt > Date.now() ? session.userId : null
}

export const realtimeHandlers = [
  link.addEventListener("connection", (connection) => {
    // cenário de queda: recusa conexões por um tempo
    if (Date.now() < blockedUntil) {
      connection.client.close()
      return
    }
    const io = toSocketIo(connection)
    const token = new URL(String(connection.client.url)).searchParams.get("token")
    const client: MockClient = {
      userId: userFromToken(token),
      emit: (event, payload) => io.client.emit(event, payload),
      close: () => connection.client.close(),
    }
    clients.add(client)

    // keep-alive do Engine.IO: sem o ping ("2") o cliente dá "ping timeout" e reconecta
    const heartbeat = setInterval(() => {
      try {
        connection.client.send("2")
      } catch {
        clearInterval(heartbeat)
      }
    }, 5000)

    connection.client.addEventListener("close", () => {
      clearInterval(heartbeat)
      clients.delete(client)
    })
  }),
]

// userId null = todos os clientes; caso contrário, só os do usuário
function deliver(event: string, payload: unknown, userId: string | null) {
  last = { event, payload, userId }
  for (const client of clients) {
    if (userId === null || client.userId === userId) client.emit(event, payload)
  }
}

const newId = () => `evt_${crypto.randomUUID()}`

export function emitNftUpdated(
  nft: Nft,
  previous: { price: string; available: number },
  version = nft.version,
) {
  const payload: NftUpdatedEvent = {
    id: newId(),
    type: "nft.updated",
    resource: `nft:${nft.id}`,
    version,
    occurredAt: new Date().toISOString(),
    data: { nft: structuredClone(nft), previous },
  }
  deliver("nft.updated", payload, null)
}

export function emitOrderUpdated(userId: string, order: Order) {
  const payload: OrderUpdatedEvent = {
    id: newId(),
    type: "order.updated",
    resource: `order:${order.id}`,
    version: order.status === "pending" ? 1 : 2,
    occurredAt: new Date().toISOString(),
    data: { order },
  }
  deliver("order.updated", payload, userId)
}

export function emitRaw(event: string, payload: unknown) {
  deliver(event, payload, null)
}

export function replayLast() {
  if (last) deliver(last.event, last.payload, last.userId)
}

export function disconnectClients(ms: number) {
  blockedUntil = Date.now() + ms
  for (const client of [...clients]) client.close()
  clients.clear()
}