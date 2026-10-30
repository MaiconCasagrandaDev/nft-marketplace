import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Field } from "@/features/account/Field"
import {
  useCreateWallet,
  useDeleteWallet,
  useUpdateWallet,
  type WalletInput,
} from "@/features/account/hooks"
import { useWallets } from "@/features/checkout/hooks"
import { getApiError } from "@/lib/api"
import { networkLabels } from "@/lib/labels"
import type { Wallet } from "@/types/checkout"
import type { Network } from "@/types/nft"
import { AccountShell } from "@/features/account/AccountShell"

const networks = Object.keys(networkLabels) as [Network, ...Network[]]
const EVM = /^0x[0-9a-fA-F]{40}$/
const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

const schema = z
  .object({
    label: z.string().trim().min(2, "Informe um nome"),
    network: z.enum(networks),
    address: z.string().trim().min(1, "Informe o endereço"),
    primary: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const ok = v.network === "solana" ? SOLANA.test(v.address) : EVM.test(v.address)
    if (!ok && v.address) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message:
          v.network === "solana" ? "Endereço Solana inválido" : "Endereço inválido (0x + 40 caracteres)",
      })
    }
  })
type Values = z.infer<typeof schema>

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
const primaryButton =
  "h-10 rounded bg-brand px-5 text-sm font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"
const ghostButton =
  "h-10 rounded border border-brand px-4 text-sm font-bold text-brand hover:text-brand-hover disabled:opacity-60"

function WalletForm({
  wallet,
  onDone,
}: {
  wallet: Wallet | null
  onDone: () => void
}) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: wallet?.label ?? "",
      network: wallet?.network ?? "ethereum",
      address: wallet?.address ?? "",
      primary: wallet?.primary ?? false,
    },
  })

  function onSubmit(values: Values) {
    setFormError(null)
    const input: WalletInput = values
    const options = {
      onSuccess: onDone,
      onError: (error: unknown) => {
        const apiError = getApiError(error)
        if (apiError.fields) {
          for (const [name, message] of Object.entries(apiError.fields)) {
            setError(name as keyof Values, { message })
          }
        } else {
          setFormError(apiError.message)
        }
      },
    }
    if (wallet) update.mutate({ id: wallet.id, ...input }, options)
    else create.mutate(input, options)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={wallet ? "Editar carteira" : "Nova carteira"}
      className="grid gap-4 rounded-2xl bg-card p-6 md:rounded-none"
    >
      <h2 className="text-base font-bold">{wallet ? "Editar carteira" : "Nova carteira"}</h2>
      <Field id="w-label" label="Nome da carteira" error={errors.label?.message} {...register("label")} />
      <div className="grid content-start gap-1.5">
        <label htmlFor="w-network" className="text-sm">
          Rede
        </label>
        <select
          id="w-network"
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
          {...register("network")}
        >
          {networks.map((n) => (
            <option key={n} value={n}>
              {networkLabels[n]}
            </option>
          ))}
        </select>
      </div>
      <Field id="w-address" label="Endereço" error={errors.address?.message} {...register("address")} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[#D28A4C]" {...register("primary")} />
        Definir como carteira principal
      </label>
      {formError && (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Salvando…" : "Salvar carteira"}
        </button>
        <button type="button" onClick={onDone} disabled={pending} className={ghostButton}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function WalletsPage() {
  const router = useRouter()
  const wallets = useWallets()
  const update = useUpdateWallet()
  const remove = useDeleteWallet()
  const [editing, setEditing] = useState<Wallet | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const fail = (error: unknown) => setMessage(getApiError(error).message)

  return (
    <AccountShell active="wallets">
    <div className="grid gap-6">
      <div className="relative flex items-center justify-center py-4 md:justify-start md:pt-8">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand md:hidden"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold md:text-2xl">Carteiras</h1>
      </div>

      {wallets.isPending && <div className="shimmer h-40 bg-card" aria-busy="true" />}

      {wallets.isError && (
        <div role="alert" className="py-8 text-center">
          <p className="mb-4">Não foi possível carregar as carteiras.</p>
          <button type="button" className={primaryButton} onClick={() => wallets.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      {wallets.data && (
        <ul className="grid gap-4">
          {wallets.data.map((w) => (
            <li key={w.id} className="grid gap-3 rounded-2xl bg-card p-5 md:rounded-none">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    {w.label}
                    {w.primary && (
                      <span className="rounded-full border border-brand px-2 py-0.5 text-[11px] font-normal text-brand">
                        Principal
                      </span>
                    )}
                  </p>
                  <p className="break-all text-xs text-text-soft">{shortAddress(w.address)}</p>
                  <p className="text-xs text-text-soft">Rede {networkLabels[w.network]}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!w.primary && (
                  <button
                    type="button"
                    disabled={update.isPending}
                    onClick={() => {
                      setMessage(null)
                      update.mutate({ id: w.id, primary: true }, { onError: fail })
                    }}
                    className={ghostButton}
                  >
                    Tornar principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null)
                    setEditing(w)
                  }}
                  className={ghostButton}
                >
                  Editar
                </button>
                {confirmId === w.id ? (
                  <>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => {
                        setMessage(null)
                        remove.mutate(w.id, {
                          onSuccess: () => setConfirmId(null),
                          onError: (error) => {
                            setConfirmId(null)
                            fail(error)
                          },
                        })
                      }}
                      className="h-10 rounded bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-60"
                    >
                      Confirmar exclusão
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className={ghostButton}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(w.id)}
                    className="h-10 px-3 text-sm text-text-soft hover:text-red-400"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <WalletForm
          key={editing === "new" ? "new" : editing.id}
          wallet={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              setEditing("new")
            }}
            className={primaryButton}
          >
            Adicionar carteira
          </button>
        </div>
      )}

      <p className="text-sm">
        <Link to="/profile" className="text-brand hover:text-brand-hover">
          ← Perfil do colecionador
        </Link>
      </p>
    </div>
    </AccountShell>
  )
}