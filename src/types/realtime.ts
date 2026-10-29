import type { Order } from "./checkout"
import type { Nft } from "./nft"

export interface EventEnvelope<T extends string, D> {
  id: string
  type: T
  resource: string
  version: number
  occurredAt: string
  data: D
}

export type NftUpdatedEvent = EventEnvelope<
  "nft.updated",
  { nft: Nft; previous: { price: string; available: number } }
>

export type OrderUpdatedEvent = EventEnvelope<"order.updated", { order: Order }>