import { useEffect, useRef, type RefObject } from 'react'
import { art, spark } from '../data/akmon'

function readGlyphs(lines: string[]) {
  const columns = Math.max(...lines.map((line) => line.length))
  return lines.flatMap((line, row) =>
    Array.from(line).flatMap((char, col) => {
      if (char === ' ') return []
      // Varia por célula e se mantém estável ao inverter a rolagem.
      const cell = Math.imul(col + 1, 374761393) + Math.imul(row + 1, 668265263)
      const mixed = Math.imul(cell ^ (cell >>> 13), 1274126177)
      const noise = ((mixed ^ (mixed >>> 16)) >>> 0) / 2 ** 32
      const x = col / (columns - 1) - 0.51
      const y = row / (lines.length - 1) - 0.63
      return [{
        char,
        row,
        col,
        noise,
        delay: Math.abs(x) * 0.4 + Math.abs(y) * 0.3 + noise * 0.23,
        rise: 0.18 + noise * 0.42,
        drift: x * 0.58 + (noise - 0.5) * 0.14,
      }]
    }),
  )
}

type RowPosition = { left: number; baseline: number; advance: number }

function measureRows(source: HTMLPreElement, lines: string[], bounds: DOMRect, ascent: number): RowPosition[] {
  const node = source.firstChild
  if (!node) return []

  const range = document.createRange()
  let offset = 0
  return lines.map((line) => {
    range.setStart(node, offset)
    range.setEnd(node, offset + line.length)
    offset += line.length + 1
    const row = range.getBoundingClientRect()

    return {
      left: row.left - bounds.left,
      baseline: row.top - bounds.top + ascent,
      advance: line.length ? row.width / line.length : 0,
    }
  })
}
const clamp = (value: number) => Math.min(1, Math.max(0, value))

type Props = {
  bodyRef: RefObject<HTMLPreElement | null>
  sparksRef: RefObject<HTMLPreElement | null>
}

export function ArtScrollFlight({ bodyRef, sparksRef }: Props) {
  const bodyCanvasRef = useRef<HTMLCanvasElement>(null)
  const sparksCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const body = bodyRef.current
    const sparks = sparksRef.current
    const bodyCanvas = bodyCanvasRef.current
    const sparksCanvas = sparksCanvasRef.current
    const figure = body?.parentElement
    const bodyContext = bodyCanvas?.getContext('2d')
    const sparksContext = sparksCanvas?.getContext('2d')
    if (!body || !sparks || !bodyCanvas || !sparksCanvas || !figure || !bodyContext || !sparksContext) return

    const layers = [
      { canvas: bodyCanvas, context: bodyContext, source: body, text: art },
      { canvas: sparksCanvas, context: sparksContext, source: sparks, text: spark },
    ].map((layer) => {
      const lines = layer.text.split('\n')
      const glyphs = readGlyphs(lines)
      const firstRelease = Math.min(...glyphs.map((glyph) => glyph.delay)) + 0.024

      return {
        ...layer,
        lines,
        rows: [] as RowPosition[],
        stationary: layer.text,
        glyphs: glyphs.map((glyph) => ({ ...glyph, delay: Math.max(0, glyph.delay - firstRelease) })),
      }
    })

    function restoreArt() {
      for (const layer of layers) {
        if (layer.stationary === layer.text) continue
        layer.source.textContent = layer.text
        layer.stationary = layer.text
      }
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let fontsReady = false
    let needsMeasure = true
    let disposed = false
    let previousProgress = -1
    let width = 0
    let height = 0
    let artWidth = 0
    let artHeight = 0
    let lineHeight = 0

    function draw() {
      frame = 0
      if (!figure || !body || !bodyCanvas) return
      const end = Math.min(figure.offsetHeight * 0.62, window.innerHeight * 0.62)
      const progress = end > 1 ? clamp((window.scrollY - 1) / (end - 1)) : 0
      if (!fontsReady || reducedMotion.matches || progress === 0) {
        restoreArt()
        figure.removeAttribute('data-scroll-flight')
        previousProgress = 0
        return
      }
      if (progress === 1) {
        figure.dataset.scrollFlight = 'finished'
        previousProgress = 1
        return
      }
      if (progress === previousProgress && !needsMeasure) return
      previousProgress = progress

      if (needsMeasure) {
        const figureRect = figure.getBoundingClientRect()
        const canvasRect = bodyCanvas.getBoundingClientRect()
        width = canvasRect.width
        height = canvasRect.height
        artWidth = figureRect.width
        artHeight = figureRect.height
        const scale = Math.min(window.devicePixelRatio || 1, 2)
        const style = getComputedStyle(body)
        const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        lineHeight = parseFloat(style.lineHeight)

        // Reaproveita os pontos que o navegador calculou para as linhas centralizadas.
        restoreArt()
        for (const layer of layers) {
          const { canvas, context, source, lines } = layer
          canvas.width = Math.max(1, Math.round(width * scale))
          canvas.height = Math.max(1, Math.round(height * scale))
          context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
          context.font = font
          context.fillStyle = getComputedStyle(source).color
          const ascent = context.measureText('M').fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8
          layer.rows = measureRows(source, lines, canvasRect, ascent)
        }
        needsMeasure = false
      }

      for (const layer of layers) {
        const { context, glyphs, lines, rows } = layer
        const stationaryRows = lines.map((line) => Array.from(line))
        context.clearRect(0, 0, width, height)

        for (const glyph of glyphs) {
          const flight = clamp((progress - glyph.delay) / (0.98 - glyph.delay))
          if (flight === 0) continue
          stationaryRows[glyph.row][glyph.col] = ' '
          if (flight === 1) continue

          const row = rows[glyph.row]
          const rise = flight * (0.42 + 0.58 * flight)
          const lateralProgress = flight ** 1.45
          const x = row.left + glyph.col * row.advance + glyph.drift * lateralProgress * artWidth
          const y = row.baseline - glyph.rise * rise * artHeight
          if (x < -row.advance || x > width || y < -lineHeight || y > height + lineHeight) continue

          context.globalAlpha = 1 - clamp((flight - 0.22) / 0.78) ** 1.5
          const char = flight > 0.55 ? (glyph.noise < 0.5 ? '+' : '.') : glyph.char
          context.fillText(char, x, y)
        }

        // Espaços preservam a largura de cada linha enquanto os caracteres se soltam.
        const stationary = stationaryRows.map((line) => line.join('')).join('\n')
        if (stationary !== layer.stationary) {
          layer.source.textContent = stationary
          layer.stationary = stationary
        }
      }

      figure.dataset.scrollFlight = 'flying'
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw)
    }

    function measure() {
      needsMeasure = true
      schedule()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(figure)
    document.fonts.ready.then(() => {
      if (disposed) return
      fontsReady = true
      measure()
    })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    reducedMotion.addEventListener('change', measure)

    return () => {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(frame)
      restoreArt()
      figure.removeAttribute('data-scroll-flight')
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      reducedMotion.removeEventListener('change', measure)
    }
  }, [bodyRef, sparksRef])

  return (
    <>
      <canvas ref={bodyCanvasRef} className="voo-ascii voo-ascii-corpo" aria-hidden="true" />
      <canvas ref={sparksCanvasRef} className="voo-ascii" aria-hidden="true" />
    </>
  )
}
