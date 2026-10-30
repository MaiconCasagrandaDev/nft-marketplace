import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AccountShell } from "@/features/account/AccountShell"
import { EnsField, Field, SelectField } from "@/features/account/Field"
import {
  useCreateWallet,
  useDeleteWallet,
  useUpdateProfile,
  useUpdateWallet,
  type WalletInput,
} from "@/features/account/hooks"
import { useSession } from "@/features/auth/useAuth"
import { useWallets } from "@/features/checkout/hooks"
import { getApiError } from "@/lib/api"
import { networkLabels } from "@/lib/labels"
import type { User } from "@/types/auth"
import type { Wallet } from "@/types/checkout"

const EVM = /^0x[0-9a-fA-F]{40}$/
const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

const walletShape = {
  label: z.string().trim().min(2, "Informe um apelido"),
  network: z.string().min(1, "Selecione a rede"),
  address: z.string().trim().min(1, "Informe o endereço"),
}

const profileShape = {
  displayName: z.string().trim().min(3, "Informe ao menos 3 caracteres"),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,}$/, "Use letras, números ou _ (mínimo 3)"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  ensName: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Use letras, números ou hífen"),
}

// só valida o endereço se ele (ou a rede) mudou em relação à carteira original
function addressIssue(v: { network: string; address: string }, original: Wallet | null) {
  if (!v.network || !v.address) return null
  if (original && original.address === v.address && original.network === v.network) return null
  const ok = v.network === "solana" ? SOLANA.test(v.address) : EVM.test(v.address)
  if (ok) return null
  return v.network === "solana" ? "Endereço Solana inválido" : "Endereço inválido (0x + 40 caracteres)"
}

function secondarySchema(original: Wallet | null) {
  return z.object(walletShape).superRefine((v, ctx) => {
    const message = addressIssue(v, original)
    if (message) ctx.addIssue({ code: "custom", path: ["address"], message })
  })
}

function primarySchema(original: Wallet | null) {
  return z.object({ ...profileShape, ...walletShape }).superRefine((v, ctx) => {
    const message = addressIssue(v, original)
    if (message) ctx.addIssue({ code: "custom", path: ["address"], message })
  })
}

type PrimaryValues = z.infer<ReturnType<typeof primarySchema>>
type SecondaryValues = z.infer<ReturnType<typeof secondarySchema>>

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

const saveButton =
  "h-10 min-w-[131px] rounded-[3px] bg-brand px-3 text-[13px] font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"
const linkButton = "text-sm font-bold text-brand hover:text-brand-hover disabled:opacity-60"
const disabledInput =
  "h-10 w-full rounded-[3px] border border-border bg-background px-3 text-sm placeholder:text-text-soft/60 disabled:cursor-not-allowed"

function NetworkOptions() {
  return (
    <>
      <option value="" disabled>
        Selecione uma rede
      </option>
      {Object.entries(networkLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  )
}

function PrimaryForm({
  user,
  wallet,
  onSaved,
  onCancel,
}: {
  user: User
  wallet: Wallet | null
  onSaved: (message: string) => void
  onCancel?: () => void
}) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const updateProfile = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = createWallet.isPending || updateWallet.isPending || updateProfile.isPending
  const schema = useMemo(() => primarySchema(wallet), [wallet])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PrimaryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? "",
      label: wallet?.label ?? "",
      network: wallet?.network ?? "",
      address: wallet?.address ?? "",
    },
  })

  async function onSubmit(values: PrimaryValues) {
    setFormError(null)
    const input: WalletInput = {
      label: values.label,
      network: values.network as Wallet["network"],
      address: values.address,
      primary: true,
    }
    try {
      await updateProfile.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
      })
      if (wallet) await updateWallet.mutateAsync({ id: wallet.id, ...input })
      else await createWallet.mutateAsync(input)
      onSaved(wallet ? "Carteira salva." : "Carteira adicionada.")
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError.fields) {
        for (const [name, message] of Object.entries(apiError.fields)) {
          setError(name as keyof PrimaryValues, { message })
        }
      } else {
        setFormError(apiError.message)
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={wallet ? "Carteira principal" : "Nova carteira principal"}
      className="grid gap-x-7 gap-y-[21px] md:grid-cols-2"
    >
      <Field id="displayName" label="Nome de exibição" required error={errors.displayName?.message} {...register("displayName")} />
      <Field id="w-label" label="Apelido da carteira" required error={errors.label?.message} {...register("label")} />
      <SelectField id="w-network" label="Rede" required error={errors.network?.message} {...register("network")}>
        <NetworkOptions />
      </SelectField>
      <Field id="username" label="Nome do perfil" required error={errors.username?.message} {...register("username")} />
      <Field
        id="w-address"
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="max-md:hidden md:pt-7">
        <input
          disabled
          title="Em breve"
          aria-label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          className={disabledInput}
        />
      </div>
      <div className="max-md:hidden">
        <SelectField id="w-type" label="Tipo de carteira" disabled title="Em breve" defaultValue="">
          <option value="">Selecione uma carteira</option>
        </SelectField>
      </div>
      <div className="max-md:hidden">
        <Field id="w-referral" label="Código de indicação" disabled title="Em breve" className="disabled:cursor-not-allowed" />
      </div>
      <Field id="email" label="E-mail" type="email" required error={errors.email?.message} {...register("email")} />
      <EnsField error={errors.ensName?.message} {...register("ensName")} />

      <div className="grid gap-3 md:col-span-2 md:mt-[11px]">
        {formError && (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        )}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className={saveButton}>
            {pending ? "Salvando…" : "Salvar carteira"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-sm text-text-soft hover:text-brand-hover">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

function SecondaryForm({
  wallet,
  onDone,
}: {
  wallet: Wallet | null
  onDone: (message?: string) => void
}) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const pending = createWallet.isPending || updateWallet.isPending
  const schema = useMemo(() => secondarySchema(wallet), [wallet])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SecondaryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: wallet?.label ?? "",
      network: wallet?.network ?? "",
      address: wallet?.address ?? "",
    },
  })

  function onSubmit(values: SecondaryValues) {
    setFormError(null)
    const input: WalletInput = {
      label: values.label,
      network: values.network as Wallet["network"],
      address: values.address,
      primary: false,
    }
    const options = {
      onSuccess: () => onDone(wallet ? "Carteira salva." : "Carteira secundária adicionada."),
      onError: (error: unknown) => {
        const apiError = getApiError(error)
        if (apiError.fields) {
          for (const [name, message] of Object.entries(apiError.fields)) {
            setError(name as keyof SecondaryValues, { message })
          }
        } else {
          setFormError(apiError.message)
        }
      },
    }
    if (wallet) {
      const { primary: _ignored, ...rest } = input
      void _ignored
      updateWallet.mutate({ id: wallet.id, ...rest }, options)
    } else {
      createWallet.mutate(input, options)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={wallet ? "Editar carteira secundária" : "Nova carteira secundária"}
      className="mt-5 grid gap-x-7 gap-y-[21px] md:grid-cols-2"
    >
      <Field id="s-label" label="Apelido da carteira" required error={errors.label?.message} {...register("label")} />
      <SelectField id="s-network" label="Rede" required error={errors.network?.message} {...register("network")}>
        <NetworkOptions />
      </SelectField>
      <Field
        id="s-address"
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="grid gap-3 md:col-span-2">
        {formError && (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        )}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className={saveButton}>
            {pending ? "Salvando…" : "Salvar carteira"}
          </button>
          <button
            type="button"
            onClick={() => onDone()}
            disabled={pending}
            className="text-sm text-text-soft hover:text-brand-hover"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}

export function WalletsPage() {
  const router = useRouter()
  const { user } = useSession()
  const wallets = useWallets()
  const update = useUpdateWallet()
  const remove = useDeleteWallet()
  const [mode, setMode] = useState<"edit" | "new">("edit")
  const [secondary, setSecondary] = useState<Wallet | "new" | null>(null)
  const [same, setSame] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const primary = wallets.data?.find((w) => w.primary) ?? wallets.data?.[0]
  const others = wallets.data?.filter((w) => w.id !== primary?.id) ?? []
  const fail = (error: unknown) => setMessage(getApiError(error).message)

  function resetFeedback() {
    setMessage(null)
    setNotice(null)
  }

  return (
    <AccountShell active="wallets">
      <div>
        <div className="relative flex items-center justify-center py-2 md:block md:py-0">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.history.back()}
            className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand md:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-lg font-bold md:sr-only">Carteiras</h1>
        </div>

        {wallets.isError ? (
          <div role="alert" className="py-8 text-center">
            <p className="mb-4">Não foi possível carregar as carteiras.</p>
            <button type="button" className={saveButton} onClick={() => wallets.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : wallets.isPending || !user ? (
          <div className="shimmer mt-4 h-64 bg-card" aria-busy="true" />
        ) : (
          <>
            <section aria-labelledby="w-principal-title" className="mt-4 md:mt-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="w-principal-title" className="text-base font-bold">
                    Carteira principal
                  </h2>
                  <p className="mt-1 text-[13px] text-text-soft">
                    Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Adicionar carteira principal"
                  onClick={() => {
                    resetFeedback()
                    setMode("new")
                  }}
                  className="text-[15px] font-bold text-brand hover:text-brand-hover"
                >
                  Adicionar
                </button>
              </div>

              <div className="mt-[30px]">
                <PrimaryForm
                  key={mode === "new" ? "new" : primary?.id}
                  user={user}
                  wallet={mode === "new" ? null : (primary ?? null)}
                  onSaved={(text) => {
                    setNotice(text)
                    setMode("edit")
                  }}
                  onCancel={mode === "new" ? () => setMode("edit") : undefined}
                />
              </div>
            </section>

            {notice && (
              <p role="status" className="mt-3 text-sm text-brand">
                {notice}
              </p>
            )}
            {message && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {message}
              </p>
            )}

            <section aria-labelledby="w-secondary-title" className="mt-[41px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="w-secondary-title" className="text-base font-bold">
                  Carteira secundária
                </h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={same}
                      onChange={(event) => setSame(event.target.checked)}
                      className="size-[18px] appearance-none rounded-full border border-brand checked:bg-brand checked:shadow-[inset_0_0_0_3px_#140D0A] focus-visible:outline-2 focus-visible:outline-brand"
                    />
                    Igual à carteira principal
                  </label>
                  <button
                    type="button"
                    aria-label="Adicionar carteira secundária"
                    disabled={same || secondary !== null}
                    onClick={() => {
                      resetFeedback()
                      setSecondary("new")
                    }}
                    className="text-[15px] font-bold text-brand hover:text-brand-hover disabled:opacity-60"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {others.length === 0 && secondary === null && (
                <p className="mt-1 text-[13px] text-text-soft">
                  {same
                    ? "A carteira secundária é a mesma carteira principal."
                    : "Você ainda não adicionou uma carteira secundária."}
                </p>
              )}

              {others.length > 0 && (
                <ul aria-label="Carteiras secundárias" className="mt-3 grid gap-3">
                  {others.map((w) => (
                    <li
                      key={w.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3"
                    >
                      <div className="grid gap-0.5">
                        <p className="text-sm font-bold">{w.label}</p>
                        <p className="text-xs text-text-soft">
                          {shortAddress(w.address)} · Rede {networkLabels[w.network]}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          disabled={update.isPending}
                          onClick={() => {
                            resetFeedback()
                            update.mutate(
                              { id: w.id, primary: true },
                              {
                                onSuccess: () => {
                                  setMode("edit")
                                  setNotice("Carteira principal atualizada.")
                                },
                                onError: fail,
                              },
                            )
                          }}
                          className={linkButton}
                        >
                          Tornar principal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetFeedback()
                            setSecondary(w)
                          }}
                          className={linkButton}
                        >
                          Editar
                        </button>
                        {confirmId === w.id ? (
                          <>
                            <button
                              type="button"
                              disabled={remove.isPending}
                              onClick={() => {
                                resetFeedback()
                                remove.mutate(w.id, {
                                  onSuccess: () => setConfirmId(null),
                                  onError: (error) => {
                                    setConfirmId(null)
                                    fail(error)
                                  },
                                })
                              }}
                              className="h-8 rounded-[3px] bg-red-500 px-3 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-60"
                            >
                              Confirmar exclusão
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="text-sm text-text-soft hover:text-brand-hover"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(w.id)}
                            className="text-sm text-text-soft hover:text-red-400"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {secondary !== null && (
                <SecondaryForm
                  key={secondary === "new" ? "new" : secondary.id}
                  wallet={secondary === "new" ? null : secondary}
                  onDone={(text) => {
                    setSecondary(null)
                    if (text) setNotice(text)
                  }}
                />
              )}
            </section>
          </>
        )}
      </div>
    </AccountShell>
  )
}