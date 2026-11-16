// Leitor mínimo de frontmatter YAML de SKILL.md. Só stdlib, sem dependências.
// Suporta (no nível raiz): escalares planos (inclusive multilinha), 'aspas simples', "aspas duplas"
// (com escapes e multilinha) e blocos `>`/`|` com indicadores de chomping (`-`, `+`) e de recuo.
// Valores estruturados (listas, mapas, ex.: `metadata:`) viram string vazia: não interessam ao catálogo.

export type ResultadoFrontmatter =
  | { ok: true; campos: Record<string, string> }
  | { ok: false; motivo: 'ausente' | 'sem-fechamento' }

const TRACO = /^---[ \t]*$/
const FIM = /^(---|\.\.\.)[ \t]*$/

export function lerFrontmatter(texto: string): ResultadoFrontmatter {
  const linhas = texto.replace(/^﻿/, '').split(/\r\n|\r|\n/)
  if (!TRACO.test(linhas[0] ?? '')) return { ok: false, motivo: 'ausente' }
  const fim = linhas.findIndex((l, i) => i > 0 && FIM.test(l))
  if (fim === -1) return { ok: false, motivo: 'sem-fechamento' }
  return { ok: true, campos: lerMapa(linhas.slice(1, fim)) }
}

const CHAVE = /^([A-Za-z0-9_.-]+)[ \t]*:(?:[ \t]+(.*))?$/
const recuada = (l: string) => /^[ \t]/.test(l)
const vazia = (l: string) => l.trim() === ''

function lerMapa(linhas: string[]): Record<string, string> {
  const campos: Record<string, string> = {}
  let i = 0
  while (i < linhas.length) {
    const m = CHAVE.exec(linhas[i])
    i++
    if (!m) continue // comentário, linha em branco ou lixo: ignorado
    const filhas: string[] = []
    while (i < linhas.length && (recuada(linhas[i]) || vazia(linhas[i]))) filhas.push(linhas[i++])
    while (filhas.length && vazia(filhas[filhas.length - 1])) filhas.pop()
    campos[m[1]] = valor((m[2] ?? '').trim(), filhas)
  }
  return campos
}

function valor(resto: string, filhas: string[]): string {
  const bloco = /^([>|])([1-9]?[+-]?|[+-][1-9]?)[ \t]*(?:#.*)?$/.exec(resto)
  if (bloco) return blocoEscalar(bloco[1] === '>', bloco[2], filhas)
  if (resto.startsWith('"') || resto.startsWith("'")) return citado(resto, filhas)
  if (resto === '' || resto.startsWith('#')) {
    // `chave:` seguido de recuo: lista/mapa (ignorado) ou escalar plano multilinha.
    const corpo = filhas.filter((l) => !vazia(l))
    if (corpo.length === 0 || /^\s*(-(\s|$)|[A-Za-z0-9_.-]+[ \t]*:(\s|$))/.test(corpo[0])) return ''
    return dobrar(corpo)
  }
  const plano = resto.replace(/\s+#.*$/, '')
  return dobrar([plano, ...filhas.filter((l) => !vazia(l))])
}

const dobrar = (ls: string[]) => ls.map((l) => l.trim()).join(' ')

function blocoEscalar(dobrado: boolean, indicador: string, filhas: string[]): string {
  const recuoExplicito = /[1-9]/.exec(indicador)?.[0]
  const primeira = filhas.find((l) => !vazia(l))
  if (primeira === undefined) return ''
  const recuo = recuoExplicito ? Number(recuoExplicito) : /^[ \t]*/.exec(primeira)![0].length
  const corpo = filhas.map((l) => (vazia(l) ? '' : l.slice(Math.min(recuo, /^[ \t]*/.exec(l)![0].length))))
  let texto: string
  if (!dobrado) texto = corpo.join('\n')
  else {
    // `>`: linhas consecutivas viram espaço; linha em branco vira \n.
    texto = ''
    let paragrafoAberto = false
    for (const l of corpo) {
      if (l === '') { texto += '\n'; paragrafoAberto = false; continue }
      texto += (paragrafoAberto ? ' ' : '') + l
      paragrafoAberto = true
    }
  }
  // chomping: `-` remove o \n final; padrão (clip) e `+` mantêm um (os \n finais extras já foram descartados).
  return indicador.includes('-') ? texto : `${texto}\n`
}

function citado(resto: string, filhas: string[]): string {
  const aspa = resto[0]
  let fonte = resto.slice(1)
  let extra = filhas.map((l) => l.trim())
  for (;;) {
    const r = procurarFechamento(fonte, aspa)
    if (r !== -1) return aspa === '"' ? desescapar(fonte.slice(0, r)) : fonte.slice(0, r).replace(/''/g, "'")
    const prox = extra.shift()
    if (prox === undefined) return aspa === '"' ? desescapar(fonte) : fonte.replace(/''/g, "'") // sem fechamento: melhor esforço
    fonte += prox === '' ? '\n' : (fonte.endsWith('\n') || fonte === '' ? '' : ' ') + prox
  }
}

function procurarFechamento(s: string, aspa: string): number {
  for (let i = 0; i < s.length; i++) {
    if (aspa === '"' && s[i] === '\\') { i++; continue }
    if (s[i] === aspa) {
      if (aspa === "'" && s[i + 1] === "'") { i++; continue }
      return i
    }
  }
  return -1
}

const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', '0': '\0', '"': '"', '\\': '\\', '/': '/', ' ': ' ', b: '\b', f: '\f', e: '\x1b', a: '\x07', v: '\v' }
function desescapar(s: string): string {
  return s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/gs, (_t, c: string) => {
    if (c.length > 1) return String.fromCodePoint(parseInt(c.slice(1), 16))
    return ESCAPES[c] ?? c
  })
}
