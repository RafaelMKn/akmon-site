import { ArtAnim } from './ArtAnim'
import { Icon } from './Icon'
import { Montagem } from './Montagem'

const HARNESSES = ['Claude Code', 'Codex', 'Google Antigravity', 'OpenClaw', 'Hermes']
const WM = 'text-[clamp(112px,21vw,300px)] leading-[.8] font-extrabold tracking-[.01em]'

export function Hero() {
  return (
    <section className="cantos relative border-b border-aco px-6 pt-10 text-center max-[640px]:pt-6" aria-labelledby="h1">
      <ul aria-label="Harnesses compatíveis" className="m-0 mb-[26px] flex list-none flex-wrap justify-center gap-1.5 p-0 max-[640px]:mb-[18px]">
        {HARNESSES.map((h) => (
          <li key={h} className="border border-aco bg-papel-2 px-2.5 py-[7px] font-mono text-[11px] leading-none font-semibold tracking-[.1em] text-tinta-2 uppercase">
            {h}
          </li>
        ))}
      </ul>

      <div className="relative">
        <p aria-hidden="true" className="absolute inset-x-0 top-[clamp(26px,4.2vw,64px)] m-0 grid justify-items-center leading-[.8] uppercase select-none">
          <span className={`font-marca text-tinta ${WM}`}>Akmon</span>
          <span className={`mt-[.04em] font-titulo text-transparent [-webkit-text-stroke:2px_var(--color-tinta)] max-[640px]:[-webkit-text-stroke:1.2px_var(--color-tinta)] ${WM}`}>Skills</span>
        </p>
        <ArtAnim />
      </div>

      <div className="relative mx-auto max-w-[820px] pb-14 max-[640px]:pb-10">
        <div aria-hidden="true" className="-mx-10 h-2.5 bg-tinta max-[640px]:-mx-3" />
        <div className="border border-t-0 border-tinta bg-papel px-[clamp(18px,4vw,44px)] pt-8 pb-[34px]">
          <h1 id="h1" className="mb-4 font-titulo text-[clamp(40px,5.6vw,72px)] leading-[.9] font-extrabold tracking-[-.005em] uppercase">
            Skills para agentes, catalogadas como <em className="text-brasa not-italic">ferramentas</em>.
          </h1>
          <p className="mx-auto mb-7 max-w-[56ch] text-tinta-2">
            Akmon é uma biblioteca curada de <b>Agent Skills</b>: pastas com SKILL.md que funcionam em Claude Code, Codex, Google Antigravity, OpenClaw e Hermes. Cada peça veio de operação real e tem pasta, código e instrução de montagem.
          </p>
          <Montagem />
          <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
            <a
              href="#categorias"
              className="inline-flex items-center gap-2 border-2 border-tinta bg-transparent px-[18px] py-[13px] font-titulo text-[15px] leading-none font-bold tracking-[.08em] text-tinta uppercase no-underline hover:border-brasa hover:bg-brasa hover:text-papel"
            >
              Ver as seis pastas<Icon name="down" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
