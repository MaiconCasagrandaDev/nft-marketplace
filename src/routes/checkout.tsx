import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AuthField } from "@/features/auth/AuthField"
import { useSession } from "@/features/auth/useAuth"
import {
  errorQuote,
  quoteKey,
  useConnectWallet,
  useCreateOrder,
  useQuote,
  useWallets,
} from "@/features/checkout/hooks"
import { Totals } from "@/features/checkout/Totals"
import { getApiError } from "@/lib/api"
import { formatEth } from "@/lib/format"
import { networkLabels } from "@/lib/labels"
import type { Network } from "@/types/nft"

const networks = Object.keys(networkLabels) as [Network, ...Network[]]

const schema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  phone: z
    .string()
    .refine((v) => v === "" || /^[+\d][\d\s()-]{7,}$/.test(v), "Telefone inválido"),
  walletId: z.string().min(1, "Selecione uma carteira"),
  network: z.enum(networks),
})
type Values = z.infer<typeof schema>

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
const button =
  "rounded bg-brand px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"
const ghost = "rounded border border-brand px-5 py-2 text-sm font-bold text-brand hover:text-brand-hover"

export function CheckoutPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useSession()
  const quote = useQuote()
  const wallets = useWallets()
  const connect = useConnectWallet()
  const createOrder = useCreateOrder()

  const [step, setStep] = useState<"form" | "review">("form")
  const [connectedKey, setConnectedKey] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "", walletId: "", network: "ethereum" },
  })

  const values = watch()
  const currentKey = `${values.walletId}:${values.network}`
  const connected = connectedKey === currentKey

  useEffect(() => {
    if (!user) return
    if (!getValues("fullName")) setValue("fullName", user.displayName)
    if (!getValues("email")) setValue("email", user.email)
  }, [user, getValues, setValue])

  useEffect(() => {
    if (!wallets.data || getValues("walletId")) return
    const main = wallets.data.find((w) => w.primary) ?? wallets.data[0]
    if (main) {
      setValue("walletId", main.id)
      setValue("network", main.network)
    }
  }, [wallets.data, getValues, setValue])

  if (quote.isPending || wallets.isPending) {
    return (
      <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <div className="shimmer h-96 bg-card" />
        <div className="shimmer h-64 bg-card" />
      </div>
    )
  }

  if (quote.isError || wallets.isError) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar o pagamento.</p>
        <button
          type="button"
          className={button}
          onClick={() => {
            quote.refetch()
            wallets.refetch()
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const q = quote.data
  if (q.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/" className="text-brand hover:text-brand-hover">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const selectedWallet = wallets.data.find((w) => w.id === values.walletId)

  function onConnect() {
    setConnectError(null)
    connect.mutate(
      { walletId: values.walletId, network: values.network },
      {
        onSuccess: () => setConnectedKey(currentKey),
        onError: (error) => {
          setConnectedKey(null)
          setConnectError(getApiError(error).message)
        },
      },
    )
  }

  async function onReview() {
    setNotice(null)
    setSubmitError(null)
    if (!connected) {
      setConnectError("Conecte a carteira antes de revisar o pedido.")
      return
    }
    // revalida preço, disponibilidade, cupom e taxas antes da revisão
    const fresh = (await quote.refetch()).data
    if (!fresh || fresh.items.length === 0) {
      setNotice("Seu carrinho está vazio.")
      return
    }
    if (fresh.issues.length > 0) {
      setNotice("A disponibilidade de algum item mudou. Ajuste o carrinho antes de continuar.")
    }
    setStep("review")
  }

  function onConfirm() {
    setNotice(null)
    setSubmitError(null)
    const v = getValues()
    createOrder.mutate(
      {
        quoteId: q.quoteId,
        walletId: v.walletId,
        network: v.network,
        collector: { fullName: v.fullName.trim(), email: v.email.trim(), phone: v.phone },
      },
      {
        onSuccess: (order) => router.navigate({ to: "/order/$id", params: { id: order.id } }),
        onError: (error) => {
          const apiError = getApiError(error)
          const fresh = errorQuote(error)
          if (fresh) qc.setQueryData(quoteKey, fresh)

          switch (apiError.code) {
            case "QUOTE_CHANGED":
              setNotice("Os valores do pedido mudaram. Revise o novo total e confirme novamente.")
              break
            case "AVAILABILITY_CHANGED":
              setNotice("A disponibilidade de algum item mudou. Ajuste o carrinho antes de continuar.")
              break
            case "VALIDATION":
              if (apiError.fields) {
                for (const [name, message] of Object.entries(apiError.fields)) {
                  setError(name as keyof Values, { message })
                }
              }
              setStep("form")
              break
            case "NETWORK":
              setSubmitError(
                "Não recebemos resposta do servidor. Tente de novo: o pedido não será duplicado.",
              )
              break
            default:
              setSubmitError(apiError.message)
          }
        },
      },
    )
  }

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
      <div className="grid content-start gap-6">
        <h1 className="text-2xl font-bold">Pagamento</h1>

        {notice && (
          <p role="alert" className="border border-brand p-3 text-sm">
            {notice}
          </p>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit(onReview)} noValidate className="grid gap-6">
            <section aria-labelledby="c-dados" className="grid gap-4 bg-card p-6">
              <h2 id="c-dados" className="text-lg font-bold">
                Dados do colecionador
              </h2>
              <AuthField
                id="fullName"
                label="Nome completo"
                autoComplete="name"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <AuthField
                id="email"
                label="E-mail"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <AuthField
                id="phone"
                label="Telefone (opcional)"
                type="tel"
                autoComplete="tel"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </section>

            <section aria-labelledby="c-carteira" className="grid gap-4 bg-card p-6">
              <h2 id="c-carteira" className="text-lg font-bold">
                Carteira e rede
              </h2>

              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium">Carteira</legend>
                {wallets.data.map((w) => (
                  <label
                    key={w.id}
                    className="flex cursor-pointer items-center gap-3 border border-border p-3 has-[:checked]:border-brand"
                  >
                    <input
                      type="radio"
                      value={w.id}
                      {...register("walletId", {
                        onChange: (e: { target: { value: string } }) => {
                          const picked = wallets.data.find((x) => x.id === e.target.value)
                          if (picked) setValue("network", picked.network)
                          setConnectError(null)
                        },
                      })}
                    />
                    <span>
                      <span className="block text-sm font-bold">
                        {w.label}
                        {w.primary && " (principal)"}
                      </span>
                      <span className="block text-xs text-text-soft">
                        {shortAddress(w.address)} · {networkLabels[w.network]}
                      </span>
                    </span>
                  </label>
                ))}
                {errors.walletId && (
                  <p role="alert" className="text-sm text-red-400">
                    {errors.walletId.message}
                  </p>
                )}
              </fieldset>

              <div className="grid gap-1.5">
                <label htmlFor="network" className="text-sm font-medium">
                  Rede
                </label>
                <select
                  id="network"
                  className="bg-background px-3 py-2 text-sm"
                  {...register("network", { onChange: () => setConnectError(null) })}
                >
                  {networks.map((n) => (
                    <option key={n} value={n}>
                      {networkLabels[n]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={!values.walletId || connect.isPending || connected}
                  className={ghost}
                >
                  {connect.isPending ? "Conectando..." : connected ? "Carteira conectada" : "Conectar carteira"}
                </button>
                {connected && selectedWallet && (
                  <span role="status" className="text-sm text-brand">
                    {shortAddress(selectedWallet.address)} conectada
                  </span>
                )}
              </div>
              {connectError && (
                <p role="alert" className="text-sm text-red-400">
                  {connectError}
                </p>
              )}
            </section>

            <div>
              <button type="submit" className={button}>
                Revisar pedido
              </button>
            </div>
          </form>
        )}

        {step === "review" && (
          <section aria-labelledby="c-revisao" className="grid gap-4 bg-card p-6">
            <h2 id="c-revisao" className="text-lg font-bold">
              Revisão do pedido
            </h2>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-text-soft">Colecionador</dt>
                <dd>
                  {values.fullName} · {values.email}
                  {values.phone && ` · ${values.phone}`}
                </dd>
              </div>
              <div>
                <dt className="text-text-soft">Carteira</dt>
                <dd>
                  {selectedWallet?.label} ({selectedWallet && shortAddress(selectedWallet.address)})
                </dd>
              </div>
              <div>
                <dt className="text-text-soft">Rede</dt>
                <dd>{networkLabels[values.network]}</dd>
              </div>
            </dl>

            {submitError && (
              <p role="alert" className="text-sm text-red-400">
                {submitError}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onConfirm}
                disabled={createOrder.isPending || q.issues.length > 0}
                className={button}
              >
                {createOrder.isPending
                  ? "Enviando pedido..."
                  : submitError
                    ? "Tentar novamente"
                    : "Confirmar pedido"}
              </button>
              <button
                type="button"
                className={ghost}
                disabled={createOrder.isPending}
                onClick={() => {
                  setStep("form")
                  setNotice(null)
                  setSubmitError(null)
                }}
              >
                Editar dados
              </button>
              {q.issues.length > 0 && (
                <Link to="/cart" className={ghost}>
                  Ajustar carrinho
                </Link>
              )}
            </div>
          </section>
        )}
      </div>

      <aside aria-label="Resumo do pedido" className="grid content-start gap-4 bg-card p-6">
        <h2 className="text-lg font-bold">Resumo</h2>
        <ul className="grid gap-3">
          {q.items.map((l) => {
            const issue = q.issues.find((i) => i.nftId === l.nft.id)
            return (
              <li key={l.nft.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {l.nft.name} × {l.quantity}
                  {issue && (
                    <span role="alert" className="block text-xs text-red-400">
                      {issue.code === "UNAVAILABLE"
                        ? "Indisponível"
                        : `Restam apenas ${issue.available}`}
                    </span>
                  )}
                </span>
                <span>{formatEth(l.lineTotal)} ETH</span>
              </li>
            )
          })}
        </ul>
        <Totals
          subtotal={q.subtotal}
          discount={q.discount}
          networkFee={q.networkFee}
          total={q.total}
          couponCode={q.coupon?.code}
        />
      </aside>
    </div>
  )
}