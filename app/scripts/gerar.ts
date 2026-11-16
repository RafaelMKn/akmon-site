// Gerador do Catálogo: lê o skills-library e a Curadoria e produz o Catalogo (puro, sem escrever o resultado).
// Spec: docs/catalogo-automatico.md. Só stdlib.
import { closeSync, lstatSync, openSync, readSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Catalogo, CatalogoCategoria, CatalogoSkill, Curadoria, Rejeitada } from '../src/data/catalogo-types.ts'
import { lerFrontmatter } from './frontmatter.ts'

export const URL_BASE = 'https://github.com/RafaelMKn/skills-library/tree/main'
export const RESUMO_MAX = 160
const LEITURA_MAX = 64 * 1024 // o frontmatter tem que caber aqui
const PROFUNDIDADE_MAX = 8
const IGNORADAS = new Set(['node_modules'])

export class ErroCatalogo extends Error {
  codigo: 'skills-dir' | 'curadoria' | 'sem-categorias'
  constructor(codigo: ErroCatalogo['codigo'], mensagem: string) {
    super(mensagem)
    this.name = 'ErroCatalogo'
    this.codigo = codigo
  }
}

const porCodigo = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const pastaVisivel = (nome: string) => !nome.startsWith('.') && !IGNORADAS.has(nome)

/** `05-dev-harness-cli` → `Dev harness cli`. */
export function humanizar(pasta: string): string {
  const palavras = pasta.replace(/^\d{2}-/, '').replace(/[-_]+/g, ' ').trim()
  return palavras.charAt(0).toUpperCase() + palavras.slice(1)
}

/** 1ª frase da description (até `. `, mantendo o ponto), com espaços colapsados, em no máx. 160 caracteres. */
export function resumir(description: string): string {
  const texto = description.replace(/\s+/g, ' ').trim()
  const fim = texto.indexOf('. ')
  return truncar(fim === -1 ? texto : texto.slice(0, fim + 1), RESUMO_MAX)
}

function truncar(texto: string, max: number): string {
  const pontos = [...texto] // por code point: não corta par substituto ao meio
  return pontos.length <= max ? texto : `${pontos.slice(0, max - 1).join('').trimEnd()}…`
}

const objeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const textoNaoVazio = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Valida o JSON da Curadoria; lança ErroCatalogo('curadoria') listando todos os problemas. */
export function validarCuradoria(bruto: unknown): Curadoria {
  const erros: string[] = []
  if (!objeto(bruto)) throw new ErroCatalogo('curadoria', 'a Curadoria deve ser um objeto JSON')
  for (const k of Object.keys(bruto)) {
    if (!['categorias', 'destaques', 'resumos'].includes(k)) erros.push(`chave desconhecida "${k}"`)
  }
  const sec = (nome: string): Record<string, unknown> => {
    const v = bruto[nome] ?? {}
    if (!objeto(v)) { erros.push(`"${nome}" deve ser um objeto`); return {} }
    return v
  }
  const categorias: Curadoria['categorias'] = {}
  for (const [pasta, v] of Object.entries(sec('categorias'))) {
    if (!objeto(v)) { erros.push(`categorias.${pasta} deve ser um objeto`); continue }
    const item: { nome?: string; curto?: string } = {}
    for (const [k, campo] of Object.entries(v)) {
      if (k !== 'nome' && k !== 'curto') erros.push(`categorias.${pasta}: chave desconhecida "${k}"`)
      else if (!textoNaoVazio(campo)) erros.push(`categorias.${pasta}.${k} deve ser texto não vazio`)
      else item[k] = campo.trim()
    }
    categorias[pasta] = item
  }
  const destaques: Curadoria['destaques'] = {}
  for (const [pasta, v] of Object.entries(sec('destaques'))) {
    if (!Array.isArray(v) || !v.every(textoNaoVazio)) { erros.push(`destaques.${pasta} deve ser lista de slugs (texto não vazio)`); continue }
    destaques[pasta] = v
  }
  const resumos: Curadoria['resumos'] = {}
  for (const [chave, v] of Object.entries(sec('resumos'))) {
    if (!textoNaoVazio(v)) erros.push(`resumos["${chave}"] deve ser texto não vazio`)
    else resumos[chave] = v.trim()
  }
  if (erros.length) throw new ErroCatalogo('curadoria', erros.join('; '))
  return { categorias, destaques, resumos }
}

/** SKILL.md mais raso da pasta da Skill (busca por nível; empate → ordem alfabética). Não segue links. */
export function acharSkillMd(pastaSkill: string): string | null {
  let nivel = ['']
  for (let prof = 0; prof <= PROFUNDIDADE_MAX && nivel.length; prof++) {
    const achados: string[] = []
    const proximo: string[] = []
    for (const rel of nivel) {
      const entradas = readdirSync(join(pastaSkill, rel), { withFileTypes: true }).sort((a, b) => porCodigo(a.name, b.name))
      for (const e of entradas) {
        const caminho = rel ? `${rel}/${e.name}` : e.name
        if (e.isFile() && e.name === 'SKILL.md') achados.push(caminho)
        else if (e.isDirectory() && pastaVisivel(e.name)) proximo.push(caminho)
      }
    }
    if (achados.length) return achados.sort(porCodigo)[0]
    nivel = proximo
  }
  return null
}

type LeituraSkill = { ok: true; description: string } | { ok: false; motivo: string }

function lerSkillMd(arquivo: string): LeituraSkill {
  let texto: string
  try {
    if (!lstatSync(arquivo).isFile()) return { ok: false, motivo: 'arquivo ilegível' }
    const fd = openSync(arquivo, 'r')
    try {
      const buf = Buffer.alloc(LEITURA_MAX)
      texto = buf.subarray(0, readSync(fd, buf, 0, LEITURA_MAX, 0)).toString('utf8')
    } finally { closeSync(fd) }
  } catch { return { ok: false, motivo: 'arquivo ilegível' } }
  const fm = lerFrontmatter(texto)
  if (!fm.ok) return { ok: false, motivo: fm.motivo === 'ausente' ? 'frontmatter ausente' : 'frontmatter sem fechamento' }
  const name = (fm.campos.name ?? '').trim()
  const description = (fm.campos.description ?? '').trim()
  if (!name && !description) return { ok: false, motivo: 'frontmatter sem name e sem description' }
  if (!name) return { ok: false, motivo: 'frontmatter sem name' }
  if (!description) return { ok: false, motivo: 'frontmatter sem description' }
  return { ok: true, description }
}

const urlDaSkill = (pasta: string, slug: string) => `${URL_BASE}/${encodeURIComponent(pasta)}/${encodeURIComponent(slug)}`

export type EntradaGerador = { skillsDir: string; curadoria: Curadoria; commitFonte?: string; agora?: Date }

export function gerarCatalogo({ skillsDir, curadoria, commitFonte = 'local', agora = new Date() }: EntradaGerador): { catalogo: Catalogo; avisos: string[] } {
  const avisos: string[] = []
  const rejeitadas: Rejeitada[] = []
  const pastas = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => porCodigo(a.slice(0, 2), b.slice(0, 2)) || porCodigo(a, b))
  if (pastas.length === 0) throw new ErroCatalogo('sem-categorias', 'nenhuma Categoria (pasta ^\\d{2}-) encontrada em SKILLS_DIR')

  const categorias: CatalogoCategoria[] = []
  const validas = new Set<string>() // "<pasta>/<slug>"
  for (const pasta of pastas) {
    const cur = Object.hasOwn(curadoria.categorias, pasta) ? curadoria.categorias[pasta] : {}
    const destaqueOrdem = [...new Set(Object.hasOwn(curadoria.destaques, pasta) ? curadoria.destaques[pasta] : [])]
    const itens: { slug: string; resumo: string }[] = []
    const slugs = readdirSync(join(skillsDir, pasta), { withFileTypes: true })
      .filter((e) => e.isDirectory() && pastaVisivel(e.name))
      .map((e) => e.name)
      .sort(porCodigo)
    for (const slug of slugs) {
      const raiz = join(skillsDir, pasta, slug)
      const rel = acharSkillMd(raiz)
      if (rel === null) continue // pasta sem nenhum SKILL.md não é Skill
      const leitura = lerSkillMd(join(raiz, rel))
      if (!leitura.ok) { rejeitadas.push({ caminho: `${pasta}/${slug}/${rel}`, motivo: leitura.motivo }); continue }
      const chave = `${pasta}/${slug}`
      validas.add(chave)
      itens.push({ slug, resumo: Object.hasOwn(curadoria.resumos, chave) ? curadoria.resumos[chave] : resumir(leitura.description) })
    }
    const existentes = new Set(itens.map((i) => i.slug))
    for (const d of destaqueOrdem) if (!existentes.has(d)) avisos.push(`destaque "${d}" da categoria ${pasta} não existe no Catálogo`)
    const noTopo = destaqueOrdem.filter((d) => existentes.has(d))
    const topo = new Set(noTopo)
    const ordenadas = [
      ...noTopo.map((d) => itens.find((i) => i.slug === d)!),
      ...itens.filter((i) => !topo.has(i.slug)), // já em ordem alfabética por slug
    ]
    const skills: CatalogoSkill[] = ordenadas.map((i) => ({ slug: i.slug, resumo: i.resumo, destaque: topo.has(i.slug), url: urlDaSkill(pasta, i.slug) }))
    const nome = cur.nome ?? humanizar(pasta)
    categorias.push({ id: pasta.slice(0, 2), pasta, nome, curto: cur.curto ?? nome, total: skills.length, skills })
  }

  const pastasSet = new Set(pastas)
  for (const pasta of Object.keys(curadoria.categorias)) if (!pastasSet.has(pasta)) avisos.push(`curadoria.categorias referencia categoria inexistente: ${pasta}`)
  for (const pasta of Object.keys(curadoria.destaques)) if (!pastasSet.has(pasta)) avisos.push(`curadoria.destaques referencia categoria inexistente: ${pasta}`)
  for (const chave of Object.keys(curadoria.resumos)) if (!validas.has(chave)) avisos.push(`resumo "${chave}" aponta para Skill inexistente`)

  rejeitadas.sort((a, b) => porCodigo(a.caminho, b.caminho))
  return { catalogo: { geradoEm: agora.toISOString(), commitFonte, categorias, rejeitadas }, avisos }
}
