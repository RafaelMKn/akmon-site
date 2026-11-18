import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { comAkmon, linhaSkill, promptDaDemo, rotulosDaDemo, semAkmon, type Execucao } from '../../../data/demoCaptura'
import { TextoFluido } from './base'
import { Comparador } from './Comparador'
import { DESCE, MOLA_SUAVE, useSemMovimento } from './molas'

/**
 * Variação 2 — Conversa: o pedido vira mensagem, as duas execuções respondem em painéis
 * e a cena termina no comparador arrastável das saídas.
 * Regra de movimento: tudo apenas desce e aparece, sem mola, sem quique, sem ida e volta.
 */

// caixas só depois que a mensagem termina (~2,0 s) + pausa curta
const M = { paineis: 2300, roteador: 3100, passos: 3600, passoGap: 450, pronto: 5600, compara: 6300 }
const FIM = 1e9

// deslocamento pequeno: o elemento só "assenta" no lugar
const ENTRA = { opacity: 0, y: -10 }
const FICA = { opacity: 1, y: 0 }

function useMs(ativo: boolean, parado: boolean) {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (parado || !ativo) return
    const inicio = performance.now()
    // decide O QUE entra (10x/s); o movimento é da biblioteca, a 60 fps
    const id = window.setInterval(() => {
      const v = performance.now() - inicio
      setMs(v)
      if (v >= M.compara) window.clearInterval(id)
    }, 100)
    return () => window.clearInterval(id)
  }, [ativo, parado])
  return parado ? FIM : ms
}

function Digitando() {
  return (
    <motion.div className="flex w-fit gap-1.5 rounded-full bg-papel-2 px-3.5 py-2.5"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={DESCE}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="block size-[6px] rounded-full bg-tinta-2"
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }} />
      ))}
    </motion.div>
  )
}

function Painel({ e, ms, parado }: { e: Execucao; ms: number; parado: boolean }) {
  const com = e.id === 'com-akmon'
  const rotulo = rotulosDaDemo[e.id]
  const atraso = com ? 150 : 0
  const passos = e.passos.filter((_, i) => ms >= M.passos + atraso + i * M.passoGap)
  const pronto = ms >= M.pronto + atraso
  const inicial = parado ? false : ENTRA
  return (
    // a caixa entra descendo depois da mensagem; sem animação de layout (ela esticava o título)
    <motion.div className="flex min-w-0 flex-col gap-2.5 rounded-[18px] border border-tinta/80 bg-papel p-4 shadow-[0_18px_40px_-30px_rgba(22,20,15,.55)]"
      initial={inicial} animate={ms >= M.paineis + atraso ? FICA : undefined} transition={DESCE}>
      <span className="font-titulo text-[19px] leading-none font-extrabold tracking-[.03em] uppercase">{rotulo}</span>

      {ms >= M.roteador + atraso && (
        <motion.div layout="position" initial={inicial} animate={FICA} transition={DESCE}>
          {com ? (
            <div className="w-fit rounded-xl border border-brasa bg-papel-2 px-3 py-2 shadow-[0_0_0_3px_rgba(255,90,31,.12)]">
              <span className="mr-2 rounded-md bg-brasa px-1.5 py-0.5 font-marca text-[12px] text-papel">AKMON</span>
              <span className="font-mono text-[12px] text-brasa">{linhaSkill(e) ?? 'selecionada pelo roteador'}</span>
            </div>
          ) : (
            <p className="m-0 font-mono text-[12px] text-aco">sem roteador · segue direto</p>
          )}
        </motion.div>
      )}

      {passos.map((p, i) => (
        <motion.div layout="position" key={`${p.ferramenta}-${i}`} initial={inicial} animate={FICA} transition={DESCE}
          className={`flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1 font-mono text-[12px] ${p.ferramenta === 'skill_view' ? 'border-brasa bg-brasa/10 text-brasa' : 'border-aco-claro bg-papel-2 text-tinta'}`}>
          <span className="font-semibold">{p.ferramenta}</span>
          <span className="min-w-0 truncate text-tinta-2">{p.argumento}</span>
        </motion.div>
      ))}

      <AnimatePresence mode="wait" initial={false}>
        {ms >= M.paineis + atraso + 300 && !pronto && <Digitando key="dig" />}
        {pronto && (
          <motion.p key="ok" layout="position" className="m-0 font-mono text-[12px] text-tinta-2" initial={inicial} animate={FICA} transition={DESCE}>
            ✓ saída gravada em {e.passos.find((p) => p.ferramenta === 'write_file')?.argumento ?? 'arquivo'}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function V2Conversa() {
  const ref = useRef<HTMLDivElement>(null)
  const parado = useSemMovimento()
  const ativo = useInView(ref, { once: true, amount: 0.3 })
  const ms = useMs(ativo, parado)
  return (
    <div ref={ref} className="grid gap-5">
      <motion.div aria-hidden="true" className="ml-auto max-w-[640px] rounded-[18px] rounded-br-md bg-tinta p-4 text-papel shadow-[0_18px_40px_-24px_rgba(22,20,15,.7)]"
        initial={parado ? false : { opacity: 0, y: 30, scale: 0.96 }} animate={ativo || parado ? { opacity: 1, y: 0, scale: 1 } : undefined} transition={MOLA_SUAVE}>
        <TextoFluido texto={promptDaDemo} ativo={ativo} atraso={0.25} className="m-0 text-[15px] leading-[1.5]" />
      </motion.div>

      <div aria-hidden="true" className="grid grid-cols-2 items-start gap-[clamp(12px,2vw,24px)] max-[899px]:grid-cols-1">
        <Painel e={semAkmon} ms={ms} parado={parado} />
        <Painel e={comAkmon} ms={ms} parado={parado} />
      </div>

      <Comparador ativo={ms >= M.compara} parado={parado} entrada={DESCE} />
    </div>
  )
}
