import { useState } from "react"
import { images } from "@/lib/images"
import { cn } from "@/lib/utils"

const slides = [
  { image: images.greenApe, alt: "Macaco de óculos escuros e jaqueta verde" },
  { image: images.blackApe, alt: "Macaco preto de gola alta verde e blazer claro" },
  { image: images.orangeApe, alt: "Macaco laranja com fones de ouvido" },
]

export function Hero() {
  const [index, setIndex] = useState(0)
  const slide = slides[index]

  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-8 py-8 lg:min-h-[527px] lg:grid-cols-[1fr_450px] lg:py-0"
    >
      <div className="relative flex h-full flex-col justify-center gap-6 lg:pl-6">
        <p className="text-xs">Bem-vindo à Kurio</p>
        <h1
          id="hero-title"
          className="text-3xl font-bold leading-tight lg:text-[43px] lg:leading-[70px]"
        >
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p className="max-w-[430px] text-xs leading-relaxed text-text-soft">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <div>
          <a
            href="#catalogo"
            className="inline-block rounded-sm bg-brand px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-brand-hover"
          >
            EXPLORAR
          </a>
        </div>

        <div className="flex gap-1 lg:absolute lg:bottom-10 lg:right-10" role="group" aria-label="Destaques">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Mostrar destaque ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="grid size-6 place-items-center"
            >
              <span className={cn("size-2 rounded-full bg-brand", i !== index && "opacity-40")} />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-0">
        <img
          src={slide.image}
          alt={slide.alt}
          width={450}
          height={450}
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>
    </section>
  )
}