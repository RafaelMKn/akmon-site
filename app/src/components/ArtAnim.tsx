import { useEffect, useRef, useState } from 'react'
import { art, spark } from '../data/akmon'
import { ArtScrollFlight } from './ArtScrollFlight'

export type AnimMode = 'martelada' | 'brasa' | 'cursor' | null

function readAnimParam(): AnimMode {
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search).get('anim')
  if (p === 'martelada' || p === 'brasa' || p === 'cursor') return p
  return null
}

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Pré-calcula os quadros derivados da camada .faisca para a variação martelada
function buildMarteladaFrames(baseSpark: string): string[] {
  const lines = baseSpark.split('\n')
  const numRows = lines.length
  const numCols = Math.max(...lines.map((l) => l.length))

  const particles: { r: number; c: number; char: string }[] = []
  lines.forEach((l, r) => {
    for (let c = 0; c < l.length; c++) {
      if (l[c] !== ' ') {
        particles.push({ r, c, char: l[c] })
      }
    }
  })

  function render(list: { r: number; c: number; char: string }[]) {
    const grid = Array.from({ length: numRows }, () => Array(numCols).fill(' '))
    for (const p of list) {
      const r = Math.round(p.r)
      const c = Math.round(p.c)
      if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
        grid[r][c] = p.char
      }
    }
    return grid.map((row) => row.join('').trimEnd()).join('\n')
  }

  const f0 = baseSpark

  // Quadro 1: Impacto com clarão na lâmina e bigorna (caracteres densos # e *)
  const f1 = render(
    particles.map((p, i) => {
      let ch = p.char
      if (p.r >= 45 && p.r <= 47) ch = i % 2 === 0 ? '#' : '*'
      else if (p.r >= 43) ch = '+'
      return { ...p, char: ch }
    })
  )

  // Quadro 2: Explosão inicial de faíscas voando para fora e subindo
  const f2 = render(
    particles.map((p) => {
      const dir = p.c < 35 ? -1 : 1
      const dist = ((p.c * 17 + p.r * 13) % 4) + 2
      const lift = ((p.c * 7 + p.r * 11) % 3) + 2
      let ch = p.char
      if (ch === '#' || ch === '*') ch = '+'
      else if (ch === '+') ch = '='
      else ch = ':'
      return { r: p.r - lift, c: p.c + dir * dist, char: ch }
    })
  )

  // Quadro 3: Dispersão mais alta e aberta
  const f3 = render(
    particles.map((p, i) => {
      const dir = p.c < 35 ? -1 : 1
      const dist = ((p.c * 17 + p.r * 13) % 6) + 4
      const lift = ((p.c * 7 + p.r * 11) % 5) + 4
      const ch = i % 2 === 0 ? ':' : '.'
      return { r: p.r - lift, c: p.c + dir * dist, char: ch }
    })
  )

  // Quadro 4: Brasas altas dissipando
  const f4 = render(
    particles
      .filter((_, i) => i % 3 === 0)
      .map((p) => {
        const dir = p.c < 35 ? -1 : 1
        const dist = ((p.c * 17 + p.r * 13) % 8) + 6
        const lift = ((p.c * 7 + p.r * 11) % 6) + 6
        return { r: p.r - lift, c: p.c + dir * dist, char: '.' }
      })
  )

  return [f0, f1, f2, f3, f4]
}

const MARTELADA_FRAMES = buildMarteladaFrames(spark)
const BASE_ART_LINES = art.split('\n')
const CHAR_ASPECT = 1.83

function perturbArt(centerCol: number, centerRow: number, radius = 7): string {
  const minR = Math.max(0, Math.floor(centerRow - radius / CHAR_ASPECT))
  const maxR = Math.min(BASE_ART_LINES.length - 1, Math.ceil(centerRow + radius / CHAR_ASPECT))

  const lines = [...BASE_ART_LINES]
  for (let r = minR; r <= maxR; r++) {
    const line = BASE_ART_LINES[r]
    const dy = (r - centerRow) * CHAR_ASPECT
    let rowChars: string[] | null = null

    const minC = Math.max(0, Math.floor(centerCol - radius))
    const maxC = Math.min(line.length - 1, Math.ceil(centerCol + radius))

    for (let c = minC; c <= maxC; c++) {
      const dx = c - centerCol
      const dist = Math.hypot(dx, dy)
      if (dist <= radius && line[c] !== ' ') {
        if (!rowChars) rowChars = line.split('')
        const rampPool = dist <= 3 ? '@%#*' : dist <= 5 ? '#*+=' : '+=-:. '
        rowChars[c] = rampPool[Math.floor(Math.random() * rampPool.length)]
      }
    }
    if (rowChars) {
      lines[r] = rowChars.join('')
    }
  }
  return lines.join('\n')
}

export function ArtAnim() {
  const [animMode, setAnimMode] = useState<AnimMode>(() => readAnimParam())
  const corpoRef = useRef<HTMLPreElement>(null)
  const brasaRef = useRef<HTMLPreElement>(null)
  const faiscaRef = useRef<HTMLPreElement>(null)

  // Flags e IDs para animações ativas
  const isHovering = useRef(false)
  const pointerPos = useRef({ clientX: 0, clientY: 0 })
  const rafId = useRef<number | null>(null)
  const marteladaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runId = useRef(0)
  const figureRef = useRef<HTMLElement>(null)
  const enterRef = useRef<(e: PointerEvent) => void>(() => {})
  const leaveRef = useRef<(e: PointerEvent) => void>(() => {})

  // Escuta popstate caso a URL mude
  useEffect(() => {
    const handlePopState = () => {
      setAnimMode(readAnimParam())
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Limpeza geral ao desmontar
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      if (marteladaTimer.current) clearTimeout(marteladaTimer.current)
      if (touchTimer.current) clearTimeout(touchTimer.current)
    }
  }, [])

  // Rotinas da Martelada
  const stopMartelada = () => {
    runId.current += 1
    if (marteladaTimer.current) {
      clearTimeout(marteladaTimer.current)
      marteladaTimer.current = null
    }
    if (faiscaRef.current) {
      faiscaRef.current.textContent = MARTELADA_FRAMES[0]
      faiscaRef.current.classList.remove('impacto')
    }
  }

  const runMarteladaCycle = (step: number, isOneShot: boolean, id: number) => {
    if (!faiscaRef.current || id !== runId.current) return
    if (!isOneShot && !isHovering.current) {
      stopMartelada()
      return
    }

    if (step === 0) {
      // Quadro 1: Impacto com clarão
      faiscaRef.current.textContent = MARTELADA_FRAMES[1]
      faiscaRef.current.classList.add('impacto')
      marteladaTimer.current = setTimeout(() => runMarteladaCycle(1, isOneShot, id), 100)
    } else if (step === 1) {
      // Quadro 2: Explosão de faíscas
      faiscaRef.current.textContent = MARTELADA_FRAMES[2]
      faiscaRef.current.classList.remove('impacto')
      marteladaTimer.current = setTimeout(() => runMarteladaCycle(2, isOneShot, id), 120)
    } else if (step === 2) {
      // Quadro 3: Dispersão
      faiscaRef.current.textContent = MARTELADA_FRAMES[3]
      faiscaRef.current.classList.remove('impacto')
      marteladaTimer.current = setTimeout(() => runMarteladaCycle(3, isOneShot, id), 130)
    } else if (step === 3) {
      // Quadro 4: Fading das brasas
      faiscaRef.current.textContent = MARTELADA_FRAMES[4]
      faiscaRef.current.classList.remove('impacto')
      marteladaTimer.current = setTimeout(() => runMarteladaCycle(4, isOneShot, id), 150)
    } else {
      // Quadro 0: Repouso antes do próximo golpe
      faiscaRef.current.textContent = MARTELADA_FRAMES[0]
      faiscaRef.current.classList.remove('impacto')
      if (isOneShot) {
        // Terminou a execução única do toque
        stopMartelada()
      } else if (isHovering.current) {
        // Em hover contínuo, pausa 200ms e dispara próxima martelada
        marteladaTimer.current = setTimeout(() => runMarteladaCycle(0, false, id), 200)
      } else {
        stopMartelada()
      }
    }
  }

  // Rotinas do Cursor
  const stopCursor = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    if (corpoRef.current) {
      corpoRef.current.textContent = art
    }
  }

  const tickCursor = () => {
    if (!isHovering.current || !corpoRef.current) {
      stopCursor()
      return
    }
    const rect = corpoRef.current.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const colW = rect.width / 93
      const rowH = rect.height / 70
      const centerCol = (pointerPos.current.clientX - rect.left) / colW
      const centerRow = (pointerPos.current.clientY - rect.top) / rowH
      corpoRef.current.textContent = perturbArt(centerCol, centerRow, 7)
    }
    rafId.current = requestAnimationFrame(tickCursor)
  }

  // Handlers de interação
  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return // Trata touch apenas em pointerdown
    if (!animMode || isReducedMotion()) return

    isHovering.current = true
    pointerPos.current = { clientX: e.clientX, clientY: e.clientY }

    if (animMode === 'martelada') {
      stopMartelada()
      runMarteladaCycle(0, false, runId.current)
    } else if (animMode === 'brasa') {
      brasaRef.current?.classList.add('ativa')
    } else if (animMode === 'cursor') {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(tickCursor)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return
    pointerPos.current = { clientX: e.clientX, clientY: e.clientY }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return
    isHovering.current = false

    if (animMode === 'martelada') {
      stopMartelada()
    } else if (animMode === 'brasa') {
      brasaRef.current?.classList.remove('ativa')
    } else if (animMode === 'cursor') {
      stopCursor()
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'touch') return
    if (!animMode || isReducedMotion()) return

    pointerPos.current = { clientX: e.clientX, clientY: e.clientY }

    if (animMode === 'martelada') {
      stopMartelada()
      runMarteladaCycle(0, true, runId.current)
    } else if (animMode === 'brasa') {
      if (touchTimer.current) clearTimeout(touchTimer.current)
      brasaRef.current?.classList.add('ativa')
      touchTimer.current = setTimeout(() => {
        brasaRef.current?.classList.remove('ativa')
        touchTimer.current = null
      }, 1200)
    } else if (animMode === 'cursor') {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      const startTime = performance.now()
      const duration = 800
      const touchTick = (now: number) => {
        if (!corpoRef.current) return
        const elapsed = now - startTime
        if (elapsed >= duration) {
          corpoRef.current.textContent = art
          rafId.current = null
          return
        }
        const rect = corpoRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          const colW = rect.width / 93
          const rowH = rect.height / 70
          const centerCol = (pointerPos.current.clientX - rect.left) / colW
          const centerRow = (pointerPos.current.clientY - rect.top) / rowH
          const rad = 7 * (1 - elapsed / duration)
          corpoRef.current.textContent = perturbArt(centerCol, centerRow, rad)
        }
        rafId.current = requestAnimationFrame(touchTick)
      }
      rafId.current = requestAnimationFrame(touchTick)
    }
  }

  // pointerenter/leave nativos: os sintéticos do React perdem o leave quando o mouse sai rápido
  useEffect(() => {
    enterRef.current = handlePointerEnter as unknown as (e: PointerEvent) => void
    leaveRef.current = handlePointerLeave as unknown as (e: PointerEvent) => void
  })
  useEffect(() => {
    const el = figureRef.current
    if (!el) return
    const onEnter = (e: PointerEvent) => enterRef.current(e)
    const onLeave = (e: PointerEvent) => leaveRef.current(e)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <figure
      className="art"
      role="img"
      aria-label="Gravura em ASCII de Hefesto, o ferreiro, com o martelo erguido sobre uma lâmina em brasa apoiada na bigorna"
      ref={figureRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <pre ref={corpoRef} className="corpo">{art}</pre>
      {animMode === 'brasa' && (
        <pre ref={brasaRef} className="brasa" aria-hidden="true">{art}</pre>
      )}
      <pre ref={faiscaRef} className="faisca">{spark}</pre>
      {!animMode && <ArtScrollFlight bodyRef={corpoRef} sparksRef={faiscaRef} />}
    </figure>
  )
}
