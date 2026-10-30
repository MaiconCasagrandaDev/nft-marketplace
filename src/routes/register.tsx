import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { AuthField } from "@/features/auth/AuthField"
import { SocialButtons } from "@/features/auth/SocialButtons"
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
    <section className="mx-auto w-full max-w-md py-12 max-md:px-3 max-md:py-0">
      <p
        aria-hidden="true"
        className="mb-12 mt-14 text-center text-3xl font-bold tracking-[0.2em] md:hidden"
      >
        KURIO
      </p>
      <div className="rounded-xl border border-border bg-card p-8 max-md:border-0 max-md:bg-transparent max-md:p-0">
        <h1 className="mb-1 text-2xl font-bold max-md:mb-6 max-md:text-center max-md:text-lg">
          <span className="md:hidden">Criar perfil de colecionador</span>
          <span className="hidden md:inline">Criar conta</span>
        </h1>
        <p className="mb-6 text-sm text-text-soft max-md:hidden">Comece a colecionar na Kurio.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <AuthField
            id="username"
            label="Nome de usuário"
            autoComplete="username"
            placeholder="Nome de usuário"
            error={errors.username?.message}
            {...register("username")}
          />
          <AuthField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthField
            id="password"
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Senha"
            error={errors.password?.message}
            {...register("password")}
          />
          <AuthField
            id="confirm"
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            error={errors.confirm?.message}
            {...register("confirm")}
          />

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full max-md:mt-4 max-md:h-14 max-md:rounded-xl max-md:text-base max-md:font-bold"
            disabled={registerUser.isPending}
          >
            {registerUser.isPending ? (
              "Criando…"
            ) : (
              <>
                <span className="md:hidden">Criar perfil</span>
                <span className="hidden md:inline">Criar conta</span>
              </>
            )}
          </Button>
        </form>

        <SocialButtons />

        <p className="mt-6 text-sm text-text-soft max-md:text-center">
          Já tem conta?{" "}
          <Link
            to="/login"
            search={{ redirect: search.redirect }}
            className="text-brand hover:text-brand-hover max-md:text-text-soft"
          >
            Entrar
          </Link>
        </p>
      </div>
    </section>
  )
}