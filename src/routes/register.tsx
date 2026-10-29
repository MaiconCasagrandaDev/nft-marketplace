import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { AuthField } from "@/features/auth/AuthField"
import { useRegister } from "@/features/auth/useAuth"
import { getApiError } from "@/lib/api"
import { safeRedirect } from "@/lib/guards"

const schema = z
  .object({
    username: z.string().trim().min(3, "Use ao menos 3 caracteres"),
    email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
    password: z.string().min(8, "Use ao menos 8 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  })
type Values = z.infer<typeof schema>

export function RegisterPage() {
  const router = useRouter()
  const search = useSearch({ from: "/register" })
  const registerUser = useRegister()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function onSubmit({ username, email, password }: Values) {
    setFormError(null)
    registerUser.mutate(
      { username, email, password },
      {
        onSuccess: () => router.history.push(safeRedirect(search.redirect)),
        onError: (error) => {
          const apiError = getApiError(error)
          if (apiError.fields) {
            for (const [name, message] of Object.entries(apiError.fields)) {
              setError(name as keyof Values, { message })
            }
          } else {
            setFormError(apiError.message)
          }
        },
      },
    )
  }

  return (
    <section className="mx-auto w-full max-w-md py-12">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="mb-1 text-2xl font-bold">Criar conta</h1>
        <p className="mb-6 text-sm text-text-soft">Comece a colecionar na Kurio.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <AuthField
            id="username"
            label="Nome de usuário"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
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
            id="password"
            label="Senha"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <AuthField
            id="confirm"
            label="Confirmar senha"
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

          <Button type="submit" className="w-full" disabled={registerUser.isPending}>
            {registerUser.isPending ? "Criando…" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-text-soft">
          Já tem conta?{" "}
          <Link to="/login" search={{ redirect: search.redirect }} className="text-brand hover:text-brand-hover">
            Entrar
          </Link>
        </p>
      </div>
    </section>
  )
}