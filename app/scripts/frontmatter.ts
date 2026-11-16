// Leitor de frontmatter de SKILL.md: extrai o bloco entre `---` e valida como YAML 1.2 com a lib `yaml`.
// YAML que a lib rejeita vira motivo de rejeição (Q10); nada é "consertado" por heurística.
import { parseDocument } from 'yaml'

/** Só os primeiros 64 KB do SKILL.md são lidos; o frontmatter tem que fechar dentro deles. */
export const LIMITE_FRONTMATTER_BYTES = 64 * 1024

export type ResultadoFrontmatter =
  | { ok: true; campos: Record<string, unknown> }
  | { ok: false; motivo: string }

const ABERTURA = /^---[ \t]*(#.*)?$/
const FECHAMENTO = /^(---|\.\.\.)[ \t]*(#.*)?$/
const MAX_ALIAS = 20 // proteção contra "billion laughs"
const MOTIVO_MAX = 200

/** `truncado`: o texto é só o começo de um arquivo maior que o limite de leitura. */
export function lerFrontmatter(texto: string, { truncado = false }: { truncado?: boolean } = {}): ResultadoFrontmatter {
  const linhas = texto.replace(/^﻿/, '').split(/\r\n|\r|\n/)
  if (!ABERTURA.test(linhas[0] ?? '')) return { ok: false, motivo: 'frontmatter ausente' }
  const fim = linhas.findIndex((l, i) => i > 0 && FECHAMENTO.test(l))
  if (fim === -1) return { ok: false, motivo: truncado ? 'frontmatter acima de 64 KB' : 'frontmatter sem fechamento' }

  const doc = parseDocument(linhas.slice(1, fim).join('\n'), { version: '1.2', uniqueKeys: true, prettyErrors: true })
  if (doc.errors.length) {
    const e = doc.errors[0]
    const linha = e.linePos?.[0].line
    const msg = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '')
    return { ok: false, motivo: invalido(msg, linha === undefined ? undefined : linha + 1) } // +1: a linha de abertura `---`
  }
  let valor: unknown
  try { valor = doc.toJS({ maxAliasCount: MAX_ALIAS }) }
  catch { return { ok: false, motivo: invalido('alias em excesso') } }
  if (valor === null || valor === undefined) return { ok: true, campos: {} }
  if (typeof valor !== 'object' || Array.isArray(valor)) return { ok: false, motivo: 'frontmatter não é um mapa YAML' }
  return { ok: true, campos: valor as Record<string, unknown> }
}

function invalido(msg: string, linha?: number): string {
  const motivo = `frontmatter YAML inválido${linha === undefined ? '' : ` (linha ${linha})`}: ${msg}`
  return motivo.length > MOTIVO_MAX ? `${motivo.slice(0, MOTIVO_MAX - 1)}…` : motivo
}
