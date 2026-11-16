import { useState } from 'react'
import { cats } from '../data/akmon'
import { Secao } from './Secao'

const MAX = Math.max(...cats.map((c) => c.n))

export function Categorias() {
  const [i, setI] = useState(0)
  const c = cats[i]

  function teclado(e: React.KeyboardEvent, idx: number) {
    const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!k) return
    e.preventDefault()
    const j = (idx + k + cats.length) % cats.length
    setI(j)
    document.getElementById(`tab-${cats[j].id}`)?.focus()
  }

  return (
    <Secao id="categorias" num="§ 01" titulo="Seis folhas, seis pastas" tituloId="h-cats"
      texto="Cada categoria é uma pasta numerada do repositório. A barra embaixo de cada aba mostra o volume de SKILL.md na pasta.">
      <div role="tablist" aria-label="Categorias de skills"
        className="mb-7 grid grid-cols-2 gap-px border border-tinta bg-tinta min-[641px]:grid-cols-3 min-[821px]:grid-cols-6">
        {cats.map((t, idx) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-controls="folha"
            aria-label={`${t.id} ${t.nome}`}
            tabIndex={idx === i ? 0 : -1}
            onClick={() => setI(idx)}
            onKeyDown={(e) => teclado(e, idx)}
            className="group relative grid min-h-[150px] cursor-pointer grid-rows-[auto_1fr_auto] gap-2 bg-papel pt-3.5 text-left max-[820px]:min-h-[120px] aria-selected:bg-tinta aria-selected:text-papel focus-visible:-outline-offset-4"
          >
            <span className="px-3 font-marca text-[34px] leading-[.8] font-extrabold text-aco group-hover:text-brasa group-aria-selected:text-brasa-viva">{t.id}</span>
            <span className="px-3 font-titulo text-[15px] leading-[1.05] font-bold tracking-[.03em] uppercase">{t.curto}</span>
            <span
              style={{ height: `calc(6px + ${(t.n / MAX).toFixed(3)} * 46px)` }}
              className="block border-t border-aco bg-papel-2 px-3 pt-1 font-mono text-[11px] text-tinta-2 group-aria-selected:border-brasa-viva group-aria-selected:bg-brasa-viva group-aria-selected:text-tinta"
            >
              {t.n}
            </span>
          </button>
        ))}
      </div>

      <div id="folha" role="tabpanel" aria-labelledby={`tab-${c.id}`} tabIndex={0} key={c.id} className="troca mx-auto max-w-[980px]">
        <div className="mb-5 flex items-start gap-5">
          <p aria-hidden="true" className="m-0 font-marca text-[88px] leading-[.8] font-extrabold text-brasa max-[640px]:text-[60px]">{c.id}</p>
          <div>
            <h3 className="mb-1.5 font-titulo text-[28px] leading-none font-extrabold uppercase">{c.nome}</h3>
            <p className="m-0 font-mono text-[.86em] text-tinta-2">{c.pasta}</p>
            <p className="mt-1 text-sm text-tinta-2"><span className="font-mono text-[.86em]">{c.n}</span> SKILL.md no disco · contagem em revisão</p>
          </div>
        </div>
        <ul className="m-0 list-none border-t border-aco p-0">
          {c.pecas.map((p) => (
            <li key={p.skill} className="grid grid-cols-[minmax(0,15em)_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1.5 border-b border-aco px-1 py-[13px] max-[640px]:grid-cols-1">
              <span className="font-mono text-sm font-semibold text-brasa">{p.skill}</span>
              <span className="text-[15px] text-tinta-2">{p.desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-tinta-2">Algumas peças da pasta, não a lista completa.</p>
      </div>
    </Secao>
  )
}
