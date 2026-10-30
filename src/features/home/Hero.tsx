import { ArrowRight } from "lucide-react"
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
  const next = slides[(index + 1) % slides.length]

  const dots = (
    <div className="flex gap-1" role="group" aria-label="Destaques">
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
  )

  return (
    <>
      {/* mobile: card do Figma */}
      <section
        aria-label="Boas-vindas"
        className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-card to-[#3a2217] p-4 pb-9 md:hidden"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_132px] items-center gap-3">
          <div className="grid gap-2">
            <p className="text-[11px]">Bem-vindo à Kurio</p>
            <p className="text-xl font-bold leading-tight">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </p>
            <p className="text-[11px] leading-snug text-text-soft">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 text-[11px] font-bold text-brand hover:text-brand-hover"
            >
              EXPLORAR <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
          <div className="relative">
            <img
              src={slide.image}
              alt={slide.alt}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <img
              src={next.image}
              alt=""
              aria-hidden="true"
              className="absolute -bottom-3 -left-5 size-14 rounded-xl border-4 border-[#3a2217] object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-1 flex justify-center">{dots}</div>
      </section>

      {/* desktop */}
      <section
        aria-labelledby="hero-title"
        className="hidden items-center gap-8 md:grid md:py-8 lg:min-h-[527px] lg:grid-cols-[1fr_450px] lg:py-0"
      >
        <div className="relative flex h-full flex-col justify-center gap-6 lg:pl-6">
          <p className="text-xs">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="text-3xl font-bold leading-tight lg:text-[43px] lg:leading-[70px]">
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
          <div className="lg:absolute lg:bottom-10 lg:right-10">{dots}</div>
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
    </>
  )
}