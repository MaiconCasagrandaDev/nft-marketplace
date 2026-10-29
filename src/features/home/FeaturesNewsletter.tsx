import { useMutation } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { api, getApiError } from "@/lib/api"

const features = [
  { letter: "W", title: "Segurança da carteira", text: "Proteja sua carteira e colecione arte digital verificada com confiança." },
  { letter: "C", title: "Criadores em destaque", text: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede." },
  { letter: "D", title: "Alertas de lançamentos", text: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado." },
]

function Newsletter() {
  const [email, setEmail] = useState("")
  const subscribe = useMutation({
    mutationFn: async (value: string) => {
      await api.post("/newsletter", { email: value })
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    subscribe.mutate(email.trim())
  }

  return (
    <div className="grid content-start gap-3">
      <h3 className="text-base font-bold">Antecipe-se ao próximo lançamento</h3>
      <form onSubmit={onSubmit} noValidate className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          E-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="digite seu e-mail..."
          aria-invalid={subscribe.isError}
          className="min-w-0 flex-1 bg-background/60 px-3 py-2 text-xs outline-none placeholder:text-text-soft focus-visible:ring-1 focus-visible:ring-brand"
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="bg-brand px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-60"
        >
          {subscribe.isPending ? "..." : "Enviar"}
        </button>
      </form>
      {subscribe.isSuccess && (
        <p role="status" className="text-xs text-brand">
          Inscrição confirmada. Obrigado!
        </p>
      )}
      {subscribe.isError && (
        <p role="alert" className="text-xs text-red-400">
          {getApiError(subscribe.error).message}
        </p>
      )}
      <p className="text-xs text-text-soft">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </div>
  )
}

export function FeaturesNewsletter() {
  return (
    <section className="grid gap-8 p-8 lg:grid-cols-4 lg:gap-0">
      {features.map((f) => (
        <div
          key={f.letter}
          className="grid content-start gap-3 lg:border-r lg:border-brand/40 lg:px-6 lg:first:pl-0"
        >
          <span
            aria-hidden="true"
            className="grid size-[72px] place-items-center rounded-full bg-brand text-2xl font-bold text-primary-foreground"
          >
            {f.letter}
          </span>
          <h3 className="text-base font-bold">{f.title}</h3>
          <p className="text-[13px] leading-relaxed text-text-soft">{f.text}</p>
        </div>
      ))}
      <div className="lg:pl-6">
        <Newsletter />
      </div>
    </section>
  )
}