import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { useToken } from "@/features/auth/useAuth";
import { orderKey } from "@/features/checkout/hooks";
import { REALTIME_URL } from "@/lib/config";
import { formatEth } from "@/lib/format";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/types/realtime";
import { clearNotices, pushNotice } from "./notices";

const KEEP = new Set(["session", "orders"]);
const MAX_SEEN = 500;

export function useRealtime() {
  const qc = useQueryClient();
  const token = useToken();

  // reabre a conexão ao entrar, sair ou trocar de usuário
  useEffect(() => {
    clearNotices();
    let cancelled = false;
    let socket: Socket | null = null;

    const seen = new Set<string>();
    const versions = new Map<string, number>();
    let connectedBefore = false;

    const reconcile = () => {
      qc.invalidateQueries({
        predicate: (q) => !KEEP.has(String(q.queryKey[0])),
      });
    };

    // descarta eventos repetidos (mesmo id) e antigos (versão menor ou igual)
    const accept = (e: { id: string; resource: string; version: number }) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      if (seen.size > MAX_SEEN) {
        const oldest = seen.values().next().value;
        if (oldest !== undefined) seen.delete(oldest);
      }
      if ((versions.get(e.resource) ?? -1) >= e.version) return false;
      versions.set(e.resource, e.version);
      return true;
    };

    // importação tardia: o socket.io-client precisa carregar DEPOIS de o MSW
    // interceptar o WebSocket do navegador
    import("socket.io-client").then(({ io }) => {
      if (cancelled) return;

      const client = io(REALTIME_URL, {
        transports: ["websocket"],
        query: token ? { token } : undefined,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,
      });
      socket = client;

      client.on("connect", () => {
        console.info("[realtime] conectado");
        // depois de uma reconexão, o REST é a fonte da verdade
        if (connectedBefore) {
          reconcile();
          qc.invalidateQueries({ queryKey: ["orders"] });
        }
        connectedBefore = true;
      });
      client.on("connect_error", () =>
        console.info("[realtime] falha ao conectar"),
      );
      client.on("disconnect", () => console.info("[realtime] desconectado"));

      client.on("nft.updated", (e: NftUpdatedEvent) => {
        if (!accept(e)) return;
        const { nft, previous } = e.data;
        const parts: string[] = [];
        if (nft.price !== previous.price) {
          parts.push(
            `O preço de ${nft.name} mudou de ${formatEth(previous.price)} para ${formatEth(nft.price)} ETH.`,
          );
        }
        if (nft.available !== previous.available) {
          parts.push(`${nft.name}: restam ${nft.available} unidades.`);
        }
        if (parts.length > 0)
          pushNotice({ id: e.id, nftId: nft.id, text: parts.join(" ") });
        reconcile();
      });

      client.on("order.updated", (e: OrderUpdatedEvent) => {
        if (!accept(e)) return;
        const { order } = e.data;
        qc.setQueryData(orderKey(order.id), order);
        if (order.status !== "pending") reconcile();
      });
    });

    return () => {
      cancelled = true;
      socket?.off();
      socket?.disconnect();
    };
  }, [token, qc]);
}
