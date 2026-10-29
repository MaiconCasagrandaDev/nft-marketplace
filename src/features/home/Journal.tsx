import { images } from "@/lib/images"

const posts = [
  {
    image: images.blackApe,
    alt: "Macaco preto de gola alta verde",
    date: "12 de setembro",
    read: "Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    text: "Aprenda a colecionar, negociar e verificar artes digitais.",
  },
  {
    image: images.greenApe,
    alt: "Macaco de óculos escuros",
    date: "13 de setembro",
    read: "Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    text: "Conheça criadores que moldam a cultura digital.",
  },
  {
    image: images.purpleApe,
    alt: "Macaco de chapéu e moletom roxo",
    date: "15 de setembro",
    read: "Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    text: "Entenda raridade, procedência, direitos autorais e utilidade.",
  },
  {
    image: images.orangeApe,
    alt: "Macaco laranja com fones de ouvido",
    date: "15 de setembro",
    read: "Leitura de 2 min",
    title: "Como proteger sua carteira",
    text: "Proteja sua carteira, seus ativos e sua identidade.",
  },
]

export function Journal() {
  return (
    <section aria-labelledby="journal-title">
      <div className="mb-8 text-center">
        <h2 id="journal-title" className="text-2xl font-bold">
          Diário da Cunhagem
        </h2>
        <p className="mt-2 text-xs text-text-soft">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <article key={p.title} className="bg-card">
            <img
              src={p.image}
              alt={p.alt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover object-center"
            />
            <div className="grid gap-3 p-4">
              <p className="text-[11px] text-text-soft">
                {p.date} <span aria-hidden="true">|</span> {p.read}
              </p>
              <h3 className="text-base font-bold leading-snug">{p.title}</h3>
              <p className="text-xs text-text-soft">{p.text}</p>
              <p className="text-[11px] font-bold text-brand">Ler mais →</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}