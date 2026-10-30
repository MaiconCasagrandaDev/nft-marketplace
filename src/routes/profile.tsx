import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "@tanstack/react-router"
import { ChevronLeft, Image as ImageIcon } from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AccountShell } from "@/features/account/AccountShell"
import { EnsField, Field, PasswordField } from "@/features/account/Field"
import {
  useChangePassword,
  useUpdateProfile,
  useUpdateWallet,
} from "@/features/account/hooks"
import { useSession } from "@/features/auth/useAuth"
import { useWallets } from "@/features/checkout/hooks"
import { getApiError } from "@/lib/api"
import type { User } from "@/types/auth"
import type { Wallet } from "@/types/checkout"

const schema = z
  .object({
    displayName: z.string().trim().min(3, "Informe ao menos 3 caracteres"),
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_]{3,}$/, "Use letras, números ou _ (mínimo 3)"),
    email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
    ensName: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Use letras, números ou hífen"),
    walletLabel: z.string().trim().min(2, "Informe um apelido"),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirm: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.currentPassword && !v.newPassword && !v.confirm) return
    if (!v.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["currentPassword"], message: "Informe a senha atual" })
    }
    if (v.newPassword.length < 8) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Use ao menos 8 caracteres" })
    }
    if (v.newPassword !== v.confirm) {
      ctx.addIssue({ code: "custom", path: ["confirm"], message: "As senhas não coincidem" })
    }
  })
type Values = z.infer<typeof schema>

function ProfileForm({ user, primary }: { user: User; primary?: Wallet }) {
  const updateProfile = useUpdateProfile()
  const updateWallet = useUpdateWallet()
  const changePassword = useChangePassword()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const pending = updateProfile.isPending || updateWallet.isPending || changePassword.isPending

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? "",
      walletLabel: primary?.label ?? "",
      currentPassword: "",
      newPassword: "",
      confirm: "",
    },
  })

  async function onSubmit(values: Values) {
    setSaved(false)
    setFormError(null)
    try {
      await updateProfile.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
      })
      if (primary && primary.label !== values.walletLabel) {
        await updateWallet.mutateAsync({ id: primary.id, label: values.walletLabel })
      }
      if (values.newPassword) {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
        setValue("currentPassword", "")
        setValue("newPassword", "")
        setValue("confirm", "")
      }
      setSaved(true)
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError.fields) {
        for (const [name, message] of Object.entries(apiError.fields)) {
          setError((name === "label" ? "walletLabel" : name) as keyof Values, { message })
        }
      } else {
        setFormError(apiError.message)
      }
    }
  }

  function onAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    setAvatarError(null)
    if (!file) return
    if (!file.type.startsWith("image/")) return setAvatarError("Escolha um arquivo de imagem.")
    if (file.size > 150 * 1024) return setAvatarError("Imagem muito grande (máximo 150 KB).")
    const reader = new FileReader()
    reader.onload = () =>
      updateProfile.mutate(
        { avatarUrl: String(reader.result) },
        { onError: (error) => setAvatarError(getApiError(error).message) },
      )
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-x-7 gap-y-[35px] md:grid-cols-2">
      <Field id="displayName" label="Nome de exibição" required error={errors.displayName?.message} {...register("displayName")} />
      <Field id="username" label="Nome de usuário" required error={errors.username?.message} {...register("username")} />
      <Field id="email" label="E-mail" type="email" required error={errors.email?.message} {...register("email")} />
      <EnsField error={errors.ensName?.message} {...register("ensName")} />
      <Field id="walletLabel" label="Apelido da carteira" required error={errors.walletLabel?.message} {...register("walletLabel")} />

      <div className="grid content-start gap-2">
        <span className="text-sm leading-5">Avatar</span>
        <div className="flex items-center gap-5">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Foto de perfil" className="size-[50px] rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-[50px] place-items-center rounded-full border border-[#3a2217] bg-card text-brand"
            >
              <ImageIcon className="size-5" />
            </span>
          )}
          <button
            type="button"
            aria-label="Alterar foto"
            onClick={() => fileRef.current?.click()}
            className="h-10 rounded-[3px] bg-brand px-6 text-[13px] font-bold text-primary-foreground hover:bg-brand-hover"
          >
            Alterar
          </button>
          <button
            type="button"
            disabled={!user.avatarUrl || updateProfile.isPending}
            onClick={() => updateProfile.mutate({ avatarUrl: null })}
            className="text-sm hover:text-brand-hover disabled:opacity-60"
          >
            Remover
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onAvatar}
            className="sr-only"
            aria-label="Enviar foto de perfil"
            tabIndex={-1}
          />
        </div>
        {avatarError && (
          <p role="alert" className="text-sm text-red-400">
            {avatarError}
          </p>
        )}
      </div>

      <div className="grid gap-5 md:col-span-2">
        <h2 className="text-base font-bold">Alterar senha</h2>
        <div className="grid gap-6 md:w-[calc(50%-14px)]">
          <PasswordField id="currentPassword" label="Senha atual" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
          <PasswordField id="newPassword" label="Nova senha" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
          <PasswordField id="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
        </div>
      </div>

      <div className="grid gap-3 md:col-span-2">
        {formError && (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-brand">
            Perfil atualizado.
          </p>
        )}
        <div>
          <button
            type="submit"
            disabled={pending}
            className="h-10 w-[131px] rounded-[3px] bg-brand text-[13px] font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  )
}

export function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useSession()
  const wallets = useWallets()
  const primary = wallets.data?.find((w) => w.primary) ?? wallets.data?.[0]

  return (
    <AccountShell active="profile">
      <div className="relative flex items-center justify-center py-2 md:justify-start md:py-0">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand md:hidden"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold md:text-base">Perfil do colecionador</h1>
      </div>

      <div className="md:mt-[18px]">
        {wallets.isError ? (
          <div role="alert" className="py-8 text-center">
            <p className="mb-4">Não foi possível carregar o perfil.</p>
            <button
              type="button"
              className="h-10 rounded-[3px] bg-brand px-5 text-sm font-bold text-primary-foreground"
              onClick={() => wallets.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading || !user || !wallets.data ? (
          <div className="shimmer h-64 bg-card" aria-busy="true" />
        ) : (
          <ProfileForm user={user} primary={primary} />
        )}
      </div>
    </AccountShell>
  )
}