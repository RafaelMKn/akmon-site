import { motion } from 'motion/react'
import { SAIDA, useSemMovimento } from './molas'

/** Texto que entra palavra por palavra, com desfoque saindo — substitui a digitação de terminal. */
export function TextoFluido({ texto, ativo, atraso = 0, className = '' }: { texto: string; ativo: boolean; atraso?: number; className?: string }) {
  const parado = useSemMovimento()
  const palavras = texto.split(' ')
  const passo = Math.min(0.035, 1.6 / palavras.length)
  return (
    <p className={className}>
      {palavras.map((p, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={parado ? false : { opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={ativo || parado ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ ...SAIDA, duration: 0.55, delay: atraso + i * passo }}
        >
          {p}{i < palavras.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </p>
  )
}
