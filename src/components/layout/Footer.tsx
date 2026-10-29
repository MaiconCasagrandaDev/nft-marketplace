import { FeaturesNewsletter } from "@/features/home/FeaturesNewsletter"

const columns = [
  {
    title: "Meu perfil",
    items: ["Meu perfil", "Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesse"],
  },
  {
    title: "Central de ajuda",
    items: ["Central de ajuda", "Como comprar NFTs", "Carteira e segurança", "Política do mercado", "Denunciar item"],
  },
  {
    title: "Coleções",
    items: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
  },
]

const socials = ["f", "ig", "x", "in", "yt"]

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1200px] px-4 pb-6 xl:px-0">
      <div className="bg-card">
        <FeaturesNewsletter />

        <div className="grid gap-4 bg-[#3b2414] px-8 py-5 text-xs md:grid-cols-4 md:items-center">
          <p className="font-bold tracking-wider">KURIO</p>
          <p>Feito para colecionadores, criadores e cultura</p>
          <p>contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>

        <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title}>
              <h2 className="mb-4 text-sm font-bold">{c.title}</h2>
              <ul className="grid gap-2 text-xs text-text-soft">
                {c.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="mb-4 text-sm font-bold">Redes sociais</h2>
            <ul className="mb-8 flex gap-2" aria-label="Redes sociais">
              {socials.map((s) => (
                <li
                  key={s}
                  className="grid size-6 place-items-center rounded-sm border border-brand text-[10px] font-bold text-brand"
                >
                  {s}
                </li>
              ))}
            </ul>
            <h2 className="mb-3 text-sm font-bold">Carteiras compatíveis</h2>
            <p className="inline-block bg-[#3b2414] px-2 py-1 text-[9px] tracking-wider text-brand">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-text-soft">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}