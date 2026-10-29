import { Link } from "@tanstack/react-router"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  useApplyCoupon,
  useCart,
  useRemoveCoupon,
  useRemoveItem,
  useUpdateQuantity,
} from "@/features/cart/useCart"
import { getApiError } from "@/lib/api"
import { formatEth } from "@/lib/format"
import { NftCarousel } from "@/features/catalog/NftCarousel"

// mesma grade no cabeçalho e nas linhas para alinhar as colunas
const ROW = "md:grid-cols-[70px_minmax(0,1fr)_100px_110px_100px_32px]"

function Breadcrumb() {
  return (
    <nav aria-label="Navegação" className="pt-8 text-sm font-bold">
      <Link to="/" className="hover:text-brand-hover">Início</Link>
      {" / "}
      <Link to="/" hash="catalogo" className="hover:text-brand-hover">Mercado</Link>
      {" / "}
      <span>Carrinho</span>
    </nav>
  )
}

export function CartPage() {
  const { data: cart, isPending, isError, refetch } = useCart()
  const update = useUpdateQuantity()
  const remove = useRemoveItem()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const run = (mutate: (cb: { onError: (e: unknown) => void }) => void) => {
    setMessage(null)
    mutate({ onError: (e) => setMessage(getApiError(e).message) })
  }

  if (isPending) {
    return (
      <div aria-busy="true">
        <Breadcrumb />
        <div className="grid gap-8 py-6 lg:grid-cols-[1fr_332px]">
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="shimmer h-[70px] bg-card" />)}
          </div>
          <div className="shimmer h-80 bg-card" />
        </div>
      </div>
    )
  }

  if (isError || !cart) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar o carrinho.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded bg-brand px-4 py-2 font-bold text-primary-foreground hover:bg-brand-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div>
        <Breadcrumb />
        <div className="py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h1>
          <Link to="/" className="text-brand hover:text-brand-hover">Continuar explorando</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb />
      <div className="grid gap-10 pb-12 pt-3 lg:grid-cols-[1fr_332px] lg:gap-[86px]">
        <section aria-label="Itens do carrinho">
          <div
            aria-hidden="true"
            className={`hidden border-b border-border px-2 pb-3 text-sm font-bold md:grid md:gap-4 ${ROW}`}
          >
            <span className="col-span-2">NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
            <span />
          </div>

          <ul className="mt-3 grid gap-3">
            {cart.items.map(({ nft, quantity, lineTotal }) => (
              <li
                key={nft.id}
                className={`grid grid-cols-[70px_1fr] items-center gap-x-4 gap-y-3 bg-card p-2 md:gap-y-0 ${ROW}`}
              >
                <img src={nft.image} alt={nft.name} className="size-[70px] rounded object-cover" />
                <div className="min-w-0">
                  <Link to="/nft/$id" params={{ id: nft.id }} className="font-bold hover:text-brand-hover">
                    {nft.name}
                  </Link>
                  <p className="text-sm text-text-soft">ID do token: {nft.tokenId}</p>
                </div>

                <div className="col-span-2 flex items-center justify-between gap-3 md:contents">
                  <span className="text-sm text-brand">{formatEth(nft.price)} ETH</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${nft.name}`}
                      disabled={quantity <= 1 || update.isPending}
                      onClick={() => run((cb) => update.mutate({ nftId: nft.id, quantity: quantity - 1 }, cb))}
                      className="grid size-5 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-4 text-center text-sm">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${nft.name}`}
                      disabled={update.isPending}
                      onClick={() => run((cb) => update.mutate({ nftId: nft.id, quantity: quantity + 1 }, cb))}
                      className="grid size-5 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-brand">{formatEth(lineTotal)} ETH</span>

                  <button
                    type="button"
                    aria-label={`Remover ${nft.name}`}
                    onClick={() => run((cb) => remove.mutate(nft.id, cb))}
                    className="justify-self-end text-text-soft hover:text-brand-hover"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {message && <p role="alert" className="mt-3 text-red-400">{message}</p>}
        </section>

        <aside aria-label="Resumo da carteira" className="grid content-start gap-4">
          <h2 className="border-b border-border pb-3 text-lg font-bold">Resumo da carteira</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!code.trim()) return
              run((cb) => applyCoupon.mutate(code, { ...cb, onSuccess: () => setCode("") }))
            }}
            className="grid gap-2"
          >
            <label htmlFor="coupon" className="text-sm font-bold">Código promocional</label>
            <div className="flex">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código promocional..."
                className="h-10 min-w-0 flex-1 border border-brand bg-background px-3 text-xs"
              />
              <button
                type="submit"
                disabled={applyCoupon.isPending}
                className="bg-brand px-4 text-sm font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </form>

          {cart.coupon && (
            <p className="flex items-center justify-between text-sm">
              <span>Cupom {cart.coupon.code} ({cart.coupon.percent}%)</span>
              <button
                type="button"
                onClick={() => run((cb) => removeCoupon.mutate(undefined, cb))}
                className="text-brand hover:text-brand-hover"
              >
                Remover
              </button>
            </p>
          )}

          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatEth(cart.subtotal)} ETH</dd></div>
            <div className="flex justify-between"><dt>Desconto do lançamento</dt><dd>(-) {formatEth(cart.discount)}</dd></div>
            <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{formatEth(cart.networkFee)} ETH</dd></div>
            <p className="-mt-2 text-right text-xs text-text-soft">Taxa estimada</p>
            <div className="mt-1 flex justify-between pt-3 font-bold">
              <dt>Total</dt>
              <dd className="text-brand">{formatEth(cart.total)} ETH</dd>
            </div>
          </dl>

          <Link
            to="/checkout"
            className="rounded bg-brand py-3 text-center text-sm font-bold text-primary-foreground hover:bg-brand-hover"
          >
            Conectar e finalizar
          </Link>
          <Link to="/" className="text-center text-sm text-brand hover:text-brand-hover">
            Continuar explorando
          </Link>
        </aside>
      </div>
      <NftCarousel title="Colecionadores também viram" />
    </div>
  )
}