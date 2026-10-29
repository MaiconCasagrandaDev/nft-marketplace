import { images } from "@/lib/images"

const banners = [
  {
    image: images.greenApe,
    alt: "Macaco de óculos escuros e jaqueta verde",
    title: "Lançamentos gênesis de edição limitada",
    text: "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
  },
  {
    image: images.blackApe,
    alt: "Macaco preto de gola alta verde e blazer claro",
    title: "Arte digital selecionada e muito mais",
    text: "Explore novos artistas, coleções verificadas e obras digitais que definem a nova cultura.",
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Destaques" className="grid gap-8 md:grid-cols-2">
      {banners.map((b) => (
        <article key={b.title} className="grid grid-cols-[45%_1fr] overflow-hidden bg-card">
          <img src={b.image} alt={b.alt} loading="lazy" className="h-full min-h-[220px] w-full object-cover" />
          <div className="flex flex-col items-end justify-center gap-3 p-4 text-right">
            <h2 className="text-sm font-bold">{b.title}</h2>
            <p className="text-xs text-text-soft">{b.text}</p>
            <a
              href="#catalogo"
              className="rounded-sm bg-brand px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-brand-hover"
            >
              Explorar →
            </a>
          </div>
        </article>
      ))}
    </section>
  )
}