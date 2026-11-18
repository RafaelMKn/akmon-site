import { Simbolo } from './Icon'

export function Footer() {
  return (
    <footer className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 bg-tinta px-[clamp(16px,3vw,32px)] pt-7 pb-[22px] text-sm text-papel">
      <div className="flex items-center gap-2.5">
        <Simbolo lamina="#FF5A1F" />
        <span className="font-marca text-[22px] leading-none font-extrabold tracking-[.04em] uppercase">Akmon</span>
      </div>
      <p className="m-0"><a className="text-brasa-viva" href="https://github.com/RafaelMKn/skills-library">Repositório no GitHub</a></p>
    </footer>
  )
}
