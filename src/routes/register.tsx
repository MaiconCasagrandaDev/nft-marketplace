import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react"
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
    <section className="mx-auto w-full max-w-md max-md:px-3 md:my-10 md:max-w-[500px]">
      <p
        aria-hidden="true"
        className="mb-12 mt-14 text-center text-3xl font-bold tracking-[0.2em] md:hidden"
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
          <Link
            to="/login"
            search={{ redirect: search.redirect }}
            className="hover:text-brand-hover"
          >
            Entrar
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-brand" />
          <h1 className="text-brand">Criar conta</h1>
        </div>
        <h1 className="mb-6 text-center text-lg font-bold md:hidden">
          Criar perfil de colecionador
        </h1>

        <p className="mt-9 text-center text-[13px] leading-4 text-foreground max-md:hidden md:-mx-[30px]">
          Crie seu perfil de colecionador e conecte uma carteira quando quiser.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 md:mt-6 md:gap-3">
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
            className="w-full max-md:mt-4 max-md:h-14 max-md:rounded-xl max-md:text-base max-md:font-bold md:mt-3 md:h-[45px] md:rounded-sm md:text-base md:font-bold"
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

        <p className="mt-6 text-sm text-text-soft max-md:text-center md:hidden">
          Já tem conta?{" "}
          <Link
            to="/login"
            search={{ redirect: search.redirect }}
            className="max-md:text-text-soft"
          >
            Entrar
          </Link>
        </p>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[10px] bg-brand max-md:hidden" />
      </div>
    </section>
  )
}