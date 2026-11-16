import type { ReactNode } from 'react'

type Props = { id: string; num: string; titulo: string; tituloId: string; texto: string; children: ReactNode }

export function Secao({ id, num, titulo, tituloId, texto, children }: Props) {
  return (
    <section id={id} aria-labelledby={tituloId} className="cantos relative border-b border-aco px-[clamp(18px,4vw,56px)] py-16">
      <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-aco bg-papel px-3 py-1 font-mono text-[11px] leading-none font-semibold tracking-[.14em] text-tinta-2">{num}</span>
      <h2 id={tituloId} className="mx-auto mb-3 text-center font-titulo text-[clamp(34px,4.4vw,56px)] leading-[.92] font-extrabold tracking-[-.005em] uppercase">{titulo}</h2>
      <p className="mx-auto mb-7 max-w-[62ch] text-center text-tinta-2">{texto}</p>
      {children}
    </section>
  )
}
