import { animate, motion, useMotionValue, useTransform, type Transition } from 'motion/react'
import { useEffect, useState } from 'react'
import { comAkmon, semAkmon, urlPublica } from '../../../data/demoCaptura'
import { MOLA_SUAVE } from './molas'

/** Comparador arrastável entre a saída sem Akmon e a com Akmon; abre sozinho e depois responde ao arraste. */
export function Comparador({ ativo, parado, entrada = MOLA_SUAVE }: { ativo: boolean; parado: boolean; entrada?: Transition }) {
  const pos = useMotionValue(parado ? 50 : 100)
  const recorte = useTransform(pos, (v) => `inset(0 ${100 - v}% 0 0)`)
  const esquerda = useTransform(pos, (v) => `${v}%`)
  const [valor, setValor] = useState(parado ? 50 : 100)
  useEffect(() => pos.on('change', (v) => setValor(Math.round(v))), [pos])
  useEffect(() => {
    if (parado || !ativo) return
    const c = animate(pos, [100, 28, 50], { duration: 2.6, ease: [0.65, 0, 0.35, 1], times: [0, 0.55, 1] })
    return () => c.stop()
  }, [ativo, parado, pos])
  return (
    <motion.div initial={parado ? false : { opacity: 0, y: -12 }} animate={ativo || parado ? { opacity: 1, y: 0 } : undefined} transition={entrada}>
      <div className="relative mx-auto max-w-[900px] overflow-hidden rounded-xl border border-tinta bg-papel-2 select-none">
        <picture className="block">
          <source media="(max-width: 899px)" srcSet={urlPublica(comAkmon.screenshotMobile)} />
          <img src={urlPublica(comAkmon.screenshot)} alt="" className="block aspect-[1440/900] w-full object-cover object-top max-[899px]:aspect-[390/700]" />
        </picture>
        <motion.picture className="absolute inset-0 block" style={{ clipPath: recorte }}>
          <source media="(max-width: 899px)" srcSet={urlPublica(semAkmon.screenshotMobile)} />
          <img src={urlPublica(semAkmon.screenshot)} alt="" className="block h-full w-full object-cover object-top" />
        </motion.picture>
        <motion.span className="pointer-events-none absolute inset-y-0 w-[2px] bg-brasa-viva shadow-[0_0_16px_2px_rgba(255,90,31,.6)]" style={{ left: esquerda }}>
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-brasa-viva bg-papel text-brasa shadow-lg">⇆</span>
        </motion.span>
        <span className="absolute top-3 left-3 rounded-full bg-tinta/85 px-3 py-1 font-mono text-[11px] tracking-[.1em] text-papel uppercase">Sem Akmon</span>
        <span className="absolute top-3 right-3 rounded-full bg-brasa px-3 py-1 font-mono text-[11px] tracking-[.1em] text-papel uppercase">Com Akmon</span>
        <input type="range" min={0} max={100} step={0.5} value={valor}
          onChange={(ev) => { pos.stop(); animate(pos, Number(ev.target.value), { type: 'spring', stiffness: 400, damping: 40 }) }}
          aria-label="Comparar a saída sem Akmon com a saída com Akmon" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
    </motion.div>
  )
}

