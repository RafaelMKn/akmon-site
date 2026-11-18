import { useReducedMotion, type Transition } from 'motion/react'

/** Molas usadas em todas as variações. */
export const MOLA: Transition = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 }
export const MOLA_SUAVE: Transition = { type: 'spring', stiffness: 90, damping: 20 }
export const MOLA_ELASTICA: Transition = { type: 'spring', stiffness: 260, damping: 16 }
/** Descida suave, sem passar do ponto (sem mola, sem quique). */
export const DESCE: Transition = { duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }
export const SAIDA: Transition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] }

/** true = sem animação. ?movimento=forcar liga a animação mesmo com reduzir-movimento no sistema. */
export function useSemMovimento() {
  const reduz = useReducedMotion()
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('movimento') === 'forcar') return false
  return !!reduz
}

