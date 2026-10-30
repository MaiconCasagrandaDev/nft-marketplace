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

function shortHash(hash: string) {
  return hash.length > 14 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash
}

function shortDate(iso: string) {
  const d = new Date(iso)
  const month = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")
  return `${d.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${d.getFullYear()}`
}

function tokenId(nftId: string) {
  const digits = nftId.replace(/\D/g, "")
  return `#${digits.padStart(4, "0")}`
}

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

  if (order.status === "confirmed") {
    return (
      <div className="mx-auto my-8 w-full max-w-[578px] border border-border bg-card">
        <div className="relative px-6 pt-8 pb-6 text-center">
          <Link
            to="/"
            aria-label="Fechar"
            className="absolute top-4 right-4 text-2xl leading-none text-brand hover:text-brand-hover"
          >
            ×
          </Link>
          <svg
            aria-hidden="true"
            viewBox="0 0 64 64"
            className="mx-auto mb-4 size-16 text-brand"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            <path d="M8 26 32 8l24 18v30H8z" />
            <path d="M8 26l24 18 24-18" />
            <path d="M18 14h28v22H18z" fill="var(--color-card, #241612)" />
            <text
              x="32"
              y="24"
              textAnchor="middle"
              fontSize="7"
              fontWeight="700"
              fill="currentColor"
              stroke="none"
            >
              THANK
            </text>
            <text
              x="32"
              y="32"
              textAnchor="middle"
              fontSize="7"
              fontWeight="700"
              fill="currentColor"
              stroke="none"
            >
              YOU
            </text>
          </svg>
          <h1 className="sr-only">Pedido confirmado</h1>
          <p role="status" className="text-base font-medium text-text-soft">
            Seus NFTs agora estão na sua carteira
          </p>
        </div>

        <h2 className="sr-only">Pedido {order.id}</h2>
        <dl className="grid grid-cols-2 gap-y-4 border-y border-brand px-6 py-4 text-xs sm:flex sm:justify-between sm:gap-0">
          <div className="sm:whitespace-nowrap sm:pr-3">
            <dt className="font-bold">ID da transação</dt>
            <dd className="text-text-soft">{order.tx ? shortHash(order.tx.hash) : "—"}</dd>
          </div>
          <div className="sm:whitespace-nowrap sm:border-l sm:border-brand sm:px-3">
            <dt className="text-text-soft">Data</dt>
            <dd>{shortDate(order.createdAt)}</dd>
          </div>
          <div className="sm:whitespace-nowrap sm:border-l sm:border-brand sm:px-3">
            <dt className="text-text-soft">Total</dt>
            <dd>{formatEth(order.total)} ETH</dd>
          </div>
          <div className="sm:whitespace-nowrap sm:border-l sm:border-brand sm:pl-3">
            <dt className="font-bold">Carteira</dt>
            <dd className="text-text-soft">{order.wallet.label}</dd>
          </div>
        </dl>

        <section aria-labelledby="o-itens" className="px-6 py-6">
          <h2 id="o-itens" className="mb-3 text-sm font-bold">
            Detalhes da transação
          </h2>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-border pb-2 text-sm font-bold">
            <span>NFTs</span>
            <span className="text-right text-text-soft">Edições</span>
            <span className="min-w-20 text-right text-text-soft">Subtotal</span>
          </div>
          <ul>
            {order.items.map((item) => (
              <li
                key={item.nftId}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img src={item.image} alt="" className="size-[70px] shrink-0 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-text-soft">ID do token: {tokenId(item.nftId)}</p>
                  </div>
                </div>
                <span className="text-sm text-text-soft">(x {item.quantity})</span>
                <span className="min-w-20 text-right font-bold text-brand">
                  {formatEth(item.lineTotal)} ETH
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-2 grid gap-2 border-b border-border pb-3 text-sm">
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-text-soft">Desconto</dt>
                <dd>− {formatEth(order.discount)} ETH</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-soft">Taxa de rede</dt>
              <dd>{formatEth(order.networkFee)} ETH</dd>
            </div>
          </dl>
          <div className="flex justify-between pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-brand">{formatEth(order.total)} ETH</span>
          </div>
        </section>

        <p className="px-6 pb-6 text-center text-sm text-text-soft">
          Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para
          sua carteira conectada e registrada na rede.
        </p>

        <div className="flex flex-wrap justify-center gap-3 px-6 pb-8">
          {order.tx && (
            <a
              href={order.tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={button}
            >
              Ver no Etherscan
            </a>
          )}
          <Link to="/" className={ghost}>
            Continuar comprando
          </Link>
        </div>
        <div className="h-2 bg-brand" aria-hidden="true" />
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