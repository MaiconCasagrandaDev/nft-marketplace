import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { AuthField } from "@/features/auth/AuthField"
import { useLogin } from "@/features/auth/useAuth"
import { getApiError } from "@/lib/api"
import { safeRedirect } from "@/lib/guards"

const schema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const router = useRouter()
  const search = useSearch({ from: "/login" })
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function onSubmit(values: Values) {
    setFormError(null)
    login.mutate(values, {
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
    })
  }

  return (
    <section className="mx-auto w-full max-w-md py-12">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="mb-1 text-2xl font-bold">Entrar</h1>
        <p className="mb-6 text-sm text-text-soft">Acesse sua conta Kurio.</p>

        {search.expired && (
          <p role="status" className="mb-4 rounded-md border border-border p-3 text-sm">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-text-soft">
          Não tem conta?{" "}
          <Link to="/register" search={{ redirect: search.redirect }} className="text-brand hover:text-brand-hover">
            Cadastre-se
          </Link>
        </p>
        <p className="mt-4 text-xs text-text-soft">
          Conta de teste: ana@kurio.test / Senha@123
        </p>
      </div>
    </section>
  )
}