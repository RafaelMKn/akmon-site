import { useState } from 'react'
import { catalogo } from '../data/catalogo'
import type { CatalogoSkill } from '../data/catalogo-types'
import { Secao } from './Secao'

const cats = catalogo.categorias
const MAX = Math.max(1, ...cats.map((c) => c.total))
const NUM_FEM = ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez']

function tituloDaSecao(n: number) {
  const w = n >= 1 && n < NUM_FEM.length ? NUM_FEM[n] : String(n)
  const cap = w.charAt(0).toUpperCase() + w.slice(1)
  return n === 1 ? `${cap} folha, ${w} pasta` : `${cap} folhas, ${w} pastas`
}

// Destaques primeiro; dentro de cada grupo mantém a ordem do array (o gerador já ordena).
function destaquesPrimeiro(skills: CatalogoSkill[]) {
  return [...skills.filter((s) => s.destaque), ...skills.filter((s) => !s.destaque)]
}

export function Categorias() {
  const [i, setI] = useState(0)

  if (cats.length === 0) {
    return (
      <Secao id="categorias" num="§ 01" titulo="Categorias" tituloId="h-cats" texto="O catálogo de skills ainda não foi gerado.">
        <></>
      </Secao>
    )
  }

  const c = cats[i]
  const lista = destaquesPrimeiro(c.skills)
  const nDestaques = c.skills.filter((s) => s.destaque).length

  // `pasta` é única; `id` (prefixo numérico) pode repetir entre categorias.
  function teclado(e: React.KeyboardEvent, idx: number) {
    let j: number
    if (e.key === 'ArrowRight') j = (idx + 1) % cats.length
    else if (e.key === 'ArrowLeft') j = (idx - 1 + cats.length) % cats.length
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = cats.length - 1
    else return
    e.preventDefault()
    setI(j)
    document.getElementById(`tab-${cats[j].pasta}`)?.focus()
  }

  return (
    <Secao id="categorias" num="§ 01" titulo={tituloDaSecao(cats.length)} tituloId="h-cats"
      texto="Cada categoria é uma pasta numerada do repositório. A barra embaixo de cada aba mostra quantas skills a pasta tem.">
      <div role="tablist" aria-label="Categorias de skills"
        className="mb-7 flex flex-wrap gap-px border border-tinta bg-tinta">
        {cats.map((t, idx) => (
          <button
            key={t.pasta}
            id={`tab-${t.pasta}`}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-controls="folha"
            aria-label={`${t.id} ${t.curto}, ${t.total} skills`}
            tabIndex={idx === i ? 0 : -1}
            onClick={() => setI(idx)}
            onKeyDown={(e) => teclado(e, idx)}
            className="group relative grid min-h-[150px] min-w-0 grow basis-[calc(50%-1px)] cursor-pointer grid-rows-[auto_1fr_auto] gap-2 bg-papel pt-3.5 text-left max-[820px]:min-h-[120px] min-[641px]:basis-[calc(33.333%-1px)] min-[821px]:basis-[calc(16.666%-1px)] aria-selected:bg-tinta aria-selected:text-papel focus-visible:-outline-offset-4"
          >
            <span className="px-3 font-marca text-[34px] leading-[.8] font-extrabold text-aco group-hover:text-brasa group-aria-selected:text-brasa-viva">{t.id}</span>
            <span className="px-3 font-titulo text-[15px] leading-[1.05] font-bold tracking-[.03em] uppercase">{t.curto}</span>
            <span
              style={{ height: `calc(6px + ${(t.total / MAX).toFixed(3)} * 46px)` }}
              className="block border-t border-aco bg-papel-2 px-3 pt-1 font-mono text-[11px] text-tinta-2 group-aria-selected:border-brasa-viva group-aria-selected:bg-brasa-viva group-aria-selected:text-tinta"
            >
              {t.total}
            </span>
          </button>
        ))}
      </div>

      <div id="folha" role="tabpanel" aria-labelledby={`tab-${c.pasta}`} tabIndex={0} key={c.pasta} className="troca mx-auto max-w-[980px]">
        <div className="mb-5 flex items-start gap-5">
          <p aria-hidden="true" className="m-0 font-marca text-[88px] leading-[.8] font-extrabold text-brasa max-[640px]:text-[60px]">{c.id}</p>
          <div className="min-w-0">
            <h3 className="mb-1.5 font-titulo text-[28px] leading-none font-extrabold uppercase">{c.nome}</h3>
            <p className="m-0 font-mono text-[.86em] text-tinta-2 [overflow-wrap:anywhere]">{c.pasta}</p>
            <p className="mt-1 text-sm text-tinta-2">
              <span className="font-mono text-[.86em]">{c.total}</span> {c.total === 1 ? 'skill' : 'skills'}
              {nDestaques > 0 && <> · <span className="font-mono text-[.86em]">{nDestaques}</span> {nDestaques === 1 ? 'destaque' : 'destaques'}</>}
            </p>
          </div>
        </div>
        <ul className="m-0 list-none border-t border-aco p-0">
          {lista.map((s) => (
            <li key={s.slug} className="border-b border-aco">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`grid grid-cols-[minmax(0,15em)_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1.5 border-l-4 px-2 py-[13px] text-inherit no-underline hover:bg-papel-2 max-[640px]:grid-cols-1 ${s.destaque ? 'border-brasa-viva bg-papel-2/60' : 'border-transparent'}`}
              >
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-sm font-semibold text-brasa [overflow-wrap:anywhere]">{s.slug}</span>
                  {s.destaque && (
                    <span className="shrink-0 bg-brasa-viva px-1.5 py-px font-mono text-[10px] leading-4 font-semibold tracking-[.1em] text-tinta uppercase">Destaque</span>
                  )}
                </span>
                <span className="text-[15px] text-tinta-2">
                  {s.resumo}
                  <span className="sr-only"> (abre no GitHub, em nova aba)</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Secao>
  )
}
