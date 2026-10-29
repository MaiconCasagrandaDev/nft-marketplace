import { useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import axios from "axios"
import { useEffect } from "react"
import { useOrder } from "@/features/checkout/hooks"
import { Totals } from "@/features/checkout/Totals"
import { formatEth } from "@/lib/format"
import { networkLabels } from "@/lib/labels"

const button =
  "rounded bg-brand px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-brand-hover"
const ghost = "rounded border border-brand px-5 py-2 text-sm font-bold text-brand hover:text-brand-hover"

export function OrderPage() {
  const { id } = useParams({ from: "/order/$id" })
  const qc = useQueryClient()
  const { data: order, isPending, error, refetch } = useOrder(id)
  const status = order?.status

  // quando a simulação responde, carrinho e catálogo são atualizados
  useEffect(() => {
    if (status === "confirmed" || status === "rejected") {
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] !== "orders" && q.queryKey[0] !== "session",
      })
    }
  }, [status, qc])

  if (isPending) {
    return <div className="shimmer my-8 h-96 bg-card" aria-busy="true" />
  }

  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Pedido não encontrado</h1>
        <Link to="/" className="text-brand hover:text-brand-hover">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar o pedido.</p>
        <button type="button" className={button} onClick={() => refetch()}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 py-8">
      <header className="grid gap-2">
        {order.status === "pending" && (
          <>
            <h1 className="text-2xl font-bold">Aguardando confirmação</h1>
            <p role="status" className="text-text-soft">
              Estamos aguardando a confirmação da transação na carteira. Não feche esta página.
            </p>
          </>
        )}
        {order.status === "confirmed" && (
          <>
            <h1 className="text-2xl font-bold text-brand">Pedido confirmado</h1>
            <p role="status" className="text-text-soft">
              Sua compra foi concluída. Guarde o recibo abaixo.
            </p>
          </>
        )}
        {order.status === "rejected" && (
          <>
            <h1 className="text-2xl font-bold text-red-400">Pedido recusado</h1>
            <p role="alert">{order.reason?.message ?? "Não foi possível concluir o pedido."}</p>
            <p className="text-sm text-text-soft">Os itens continuam no seu carrinho.</p>
          </>
        )}
      </header>

      <section aria-labelledby="o-resumo" className="grid gap-4 bg-card p-6">
        <h2 id="o-resumo" className="text-lg font-bold">
          Pedido {order.id}
        </h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-text-soft">Data</dt>
            <dd>{new Date(order.createdAt).toLocaleString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-text-soft">Colecionador</dt>
            <dd>
              {order.collector.fullName} · {order.collector.email}
            </dd>
          </div>
          <div>
            <dt className="text-text-soft">Carteira</dt>
            <dd className="break-all">
              {order.wallet.label} · {order.wallet.address}
            </dd>
          </div>
          <div>
            <dt className="text-text-soft">Rede</dt>
            <dd>{networkLabels[order.network]}</dd>
          </div>
          {order.tx && (
            <>
              <div>
                <dt className="text-text-soft">Transação (simulada)</dt>
                <dd className="break-all">{order.tx.hash}</dd>
              </div>
              <div>
                <dt className="text-text-soft">Bloco</dt>
                <dd>{order.tx.blockNumber}</dd>
              </div>
              <div>
                <dt className="text-text-soft">Explorador (simulado)</dt>
                <dd className="break-all">{order.tx.explorerUrl}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section aria-labelledby="o-itens" className="grid gap-4 bg-card p-6">
        <h2 id="o-itens" className="text-lg font-bold">
          Itens
        </h2>
        <ul className="grid gap-3">
          {order.items.map((item) => (
            <li key={item.nftId} className="flex items-center gap-3 text-sm">
              <img src={item.image} alt="" className="size-12 rounded object-cover" />
              <span className="flex-1">
                {item.name} × {item.quantity}
              </span>
              <span>{formatEth(item.lineTotal)} ETH</span>
            </li>
          ))}
        </ul>
        <Totals
          subtotal={order.subtotal}
          discount={order.discount}
          networkFee={order.networkFee}
          total={order.total}
          couponCode={order.coupon?.code}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        {order.status === "confirmed" && (
          <Link to="/" className={button}>
            Continuar comprando
          </Link>
        )}
        {order.status === "rejected" && (
          <>
            <Link to="/checkout" className={button}>
              Tentar novamente
            </Link>
            <Link to="/cart" className={ghost}>
              Voltar ao carrinho
            </Link>
          </>
        )}
      </div>
    </div>
  )
}