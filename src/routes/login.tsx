import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { AuthField } from "@/features/auth/AuthField"
import { SocialButtons } from "@/features/auth/SocialButtons"
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
    <section className="mx-auto w-full max-w-md max-md:px-3 md:my-10 md:max-w-[500px]">
      <p
        aria-hidden="true"
        className="mb-16 mt-14 text-center text-3xl font-bold tracking-[0.2em] md:hidden"
      >
        KURIO
      </p>

      <div className="relative md:overflow-hidden md:bg-card md:px-20 md:pb-[72px] md:pt-[45px]">
        <Link
          to="/"
          aria-label="Fechar"
          className="absolute right-3.5 top-3 grid size-8 place-items-center text-brand hover:text-brand-hover max-md:hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </Link>

        <div className="flex items-center justify-center gap-2.5 text-xl font-bold max-md:hidden">
          <h1 className="text-brand">Entrar</h1>
          <span aria-hidden="true" className="h-5 w-px bg-brand" />
          <Link
            to="/register"
            search={{ redirect: search.redirect }}
            className="hover:text-brand-hover"
          >
            Criar conta
          </Link>
        </div>
        <h1 className="mb-6 text-center text-lg font-bold md:hidden">Entrar</h1>

        <p className="mt-9 text-center text-[13px] leading-4 text-foreground max-md:hidden md:-mx-[30px]">
          Entre para gerenciar sua carteira, coleção e perfil de criador.
        </p>

        {search.expired && (
          <p role="status" className="mb-4 rounded-md border border-border p-3 text-sm md:mt-4">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 md:mt-6 md:gap-3">
          <AuthField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthField
            id="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            error={errors.password?.message}
            {...register("password")}
          />

          <p className="text-right">
            <button
              type="button"
              disabled
              title="Em breve"
              className="text-sm text-brand opacity-80"
            >
              Esqueceu a senha?
            </button>
          </p>

          {formError && (
            <p role="alert" className="text-sm text-red-400">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full max-md:mt-4 max-md:h-14 max-md:rounded-xl max-md:text-base max-md:font-bold md:mt-2 md:h-[45px] md:rounded-sm md:text-base md:font-bold"
            disabled={login.isPending}
          >
            {login.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <SocialButtons />

        <p className="mt-6 text-sm text-text-soft max-md:text-center md:hidden">
          Novo na Kurio?{" "}
          <Link
            to="/register"
            search={{ redirect: search.redirect }}
            className="max-md:text-text-soft"
          >
            Crie uma conta
          </Link>
        </p>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[10px] bg-brand max-md:hidden" />
      </div>

      <p className="mt-4 text-center text-xs text-text-soft">
        Conta de teste: ana@kurio.test / Senha@123
      </p>
    </section>
  )
}