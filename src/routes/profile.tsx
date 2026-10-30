import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Field } from "@/features/account/Field"
import { useChangePassword, useUpdateProfile } from "@/features/account/hooks"
import { useSession } from "@/features/auth/useAuth"
import { getApiError } from "@/lib/api"
import type { User } from "@/types/auth"

const profileSchema = z.object({
  displayName: z.string().trim().min(3, "Informe ao menos 3 caracteres"),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,}$/, "Use letras, números ou _ (mínimo 3)"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  ensName: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Use letras, números ou hífen"),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(8, "Use ao menos 8 caracteres"),
    confirm: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  })
type PasswordValues = z.infer<typeof passwordSchema>

const card = "grid gap-5 rounded-2xl bg-card p-6 md:rounded-none"
const primaryButton =
  "h-11 rounded bg-brand px-6 text-sm font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"

function Avatar({ user, size = "size-20" }: { user: User; size?: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="Foto de perfil" className={`${size} rounded-full object-cover`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${size} grid place-items-center rounded-full bg-[#3a2217] text-2xl font-bold text-brand`}
    >
      {user.displayName.charAt(0).toUpperCase()}
    </span>
  )
}

function ProfileCard({ user }: { user: User }) {
  const update = useUpdateProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? "",
    },
  })

  function onSubmit(values: ProfileValues) {
    setSaved(false)
    setFormError(null)
    update.mutate(values, {
      onSuccess: () => setSaved(true),
      onError: (error) => {
        const apiError = getApiError(error)
        if (apiError.fields) {
          for (const [name, message] of Object.entries(apiError.fields)) {
            setError(name as keyof ProfileValues, { message })
          }
        } else {
          setFormError(apiError.message)
        }
      },
    })
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
      update.mutate(
        { avatarUrl: String(reader.result) },
        { onError: (error) => setAvatarError(getApiError(error).message) },
      )
    reader.readAsDataURL(file)
  }

  return (
    <section aria-labelledby="p-dados" className={card}>
      <h2 id="p-dados" className="text-base font-bold">
        Dados do colecionador
      </h2>

      <div className="flex items-center gap-4">
        <Avatar user={user} />
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-brand px-4 py-2 text-sm font-bold text-brand hover:text-brand-hover"
            >
              Alterar foto
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={() => update.mutate({ avatarUrl: null })}
                className="px-2 py-2 text-sm text-text-soft hover:text-brand-hover"
              >
                Remover
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onAvatar}
            className="sr-only"
            aria-label="Enviar foto de perfil"
            tabIndex={-1}
          />
          {avatarError && (
            <p role="alert" className="text-sm text-red-400">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 md:grid-cols-2">
        <Field id="displayName" label="Nome de exibição" error={errors.displayName?.message} {...register("displayName")} />
        <Field id="username" label="Nome de usuário" error={errors.username?.message} {...register("username")} />
        <Field id="email" label="E-mail" type="email" error={errors.email?.message} {...register("email")} />
        <Field id="ensName" label="Nome ENS (opcional)" error={errors.ensName?.message} {...register("ensName")} />

        <div className="grid gap-2 md:col-span-2">
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
            <button type="submit" disabled={update.isPending} className={primaryButton}>
              {update.isPending ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

function PasswordCard() {
  const change = useChangePassword()
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  function onSubmit({ currentPassword, newPassword }: PasswordValues) {
    setDone(false)
    setFormError(null)
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setDone(true)
          reset()
        },
        onError: (error) => {
          const apiError = getApiError(error)
          if (apiError.fields) {
            for (const [name, message] of Object.entries(apiError.fields)) {
              setError(name as keyof PasswordValues, { message })
            }
          } else {
            setFormError(apiError.message)
          }
        },
      },
    )
  }

  return (
    <section aria-labelledby="p-senha" className={card}>
      <h2 id="p-senha" className="text-base font-bold">
        Alterar senha
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 md:max-w-sm">
        <Field
          id="currentPassword"
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <Field
          id="newPassword"
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Field
          id="confirmPassword"
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        {formError && (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        )}
        {done && (
          <p role="status" className="text-sm text-brand">
            Senha alterada.
          </p>
        )}
        <div>
          <button type="submit" disabled={change.isPending} className={primaryButton}>
            {change.isPending ? "Salvando…" : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  )
}

export function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useSession()

  return (
    <div className="mx-auto grid max-w-3xl gap-6 pb-12">
      <div className="relative flex items-center justify-center py-4 md:justify-start md:pt-8">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand md:hidden"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold md:text-2xl">Perfil do colecionador</h1>
      </div>

      {isLoading || !user ? (
        <div className="shimmer h-64 bg-card" aria-busy="true" />
      ) : (
        <>
          <ProfileCard user={user} />
          <PasswordCard />
          <p className="text-sm">
            <Link to="/wallets" className="text-brand hover:text-brand-hover">
              Gerenciar carteiras →
            </Link>
          </p>
        </>
      )}
    </div>
  )
}