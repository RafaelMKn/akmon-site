import type { ReactNode } from 'react'

type Props = { id: string; titulo: string; tituloId: string; texto?: string; children: ReactNode }

export function Secao({ id, titulo, tituloId, texto, children }: Props) {
  return (
    <section id={id} aria-labelledby={tituloId} className="cantos relative border-b border-aco px-[clamp(18px,4vw,56px)] py-16">
      <h2 id={tituloId} className={`mx-auto text-center font-titulo text-[clamp(34px,4.4vw,56px)] leading-[.92] font-extrabold tracking-[-.005em] uppercase ${texto ? 'mb-3' : 'mb-7'}`}>{titulo}</h2>
      {texto && <p className="mx-auto mb-7 max-w-[62ch] text-center text-tinta-2">{texto}</p>}
      {children}
    </section>
  )
}
