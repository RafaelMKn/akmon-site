import { Icon, Simbolo } from './Icon'

export function Header() {
  return (
    <header className="flex items-center gap-6 border-b border-aco bg-papel px-[clamp(16px,3vw,32px)] py-3.5">
      <a href="#" aria-label="Akmon, início" className="flex items-center gap-2.5 no-underline">
        <Simbolo />
        <span className="font-marca text-[22px] leading-none font-extrabold tracking-[.04em] uppercase">Akmon</span>
      </a>
      <nav aria-label="Principal" className="ml-auto flex gap-[22px] font-titulo text-sm leading-none font-bold tracking-[.06em] uppercase">
        <a className="inline-flex items-center gap-1 no-underline hover:text-brasa max-[640px]:hidden" href="#categorias">Categorias</a>
        <a className="inline-flex items-center gap-1 no-underline hover:text-brasa max-[640px]:hidden" href="#montagem">Instalar</a>
        <a className="inline-flex items-center gap-1 no-underline hover:text-brasa" href="https://github.com/RafaelMKn/skills-library">
          GitHub<Icon name="out" />
        </a>
      </nav>
    </header>
  )
}
