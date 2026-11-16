import { catalogo } from '../data/catalogo'
import { Simbolo } from './Icon'

const data = new Date(catalogo.geradoEm)
const atualizadoEm = Number.isNaN(data.getTime())
  ? null
  : data.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export function Footer() {
  return (
    <footer className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 bg-tinta px-[clamp(16px,3vw,32px)] pt-7 pb-[22px] text-sm text-papel">
      <div className="grid gap-3">
        <div className="flex items-center gap-2.5">
          <Simbolo lamina="#FF5A1F" />
          <span className="font-marca text-[22px] leading-none font-extrabold tracking-[.04em] uppercase">Akmon</span>
        </div>
        <p className="m-0">Do grego <b>ákmōn</b>, “bigorna”. Biblioteca curada de Agent Skills, forjada em operação real.</p>
      </div>
      <div className="grid content-start gap-2.5">
        <p className="m-0"><a className="text-brasa-viva" href="https://github.com/RafaelMKn/skills-library">Repositório no GitHub</a></p>
        {atualizadoEm && (
          <p className="m-0 text-xs text-aco-claro">Atualizado em <time dateTime={catalogo.geradoEm}>{atualizadoEm}</time></p>
        )}
      </div>
      <p className="col-span-full m-0 border-t border-tinta-2 pt-3.5 text-xs text-aco-claro">
        Tipografia: Big Shoulders Display, Big Shoulders Stencil Display, Barlow e JetBrains Mono, todas sob a SIL Open Font License 1.1.
      </p>
    </footer>
  )
}
