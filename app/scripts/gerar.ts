// Gerador do Catálogo: lê o skills-library e a Curadoria e produz o Catalogo (puro, sem escrever o resultado).
// Spec: docs/catalogo-automatico.md. Só stdlib (e `yaml` para o frontmatter).
import type { Dirent } from 'node:fs'
import { closeSync, constants as fsc, fstatSync, openSync, readSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Catalogo, CatalogoCategoria, CatalogoSkill, Curadoria, Rejeitada } from '../src/data/catalogo-types.ts'
import { LIMITE_FRONTMATTER_BYTES, lerFrontmatter } from './frontmatter.ts'

export const URL_BASE = 'https://github.com/RafaelMKn/skills-library/tree/main'
export const RESUMO_MAX = 160
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
const codigoErro = (e: unknown) => (e as NodeJS.ErrnoException)?.code ?? 'desconhecido'
const ehDiretorio = (caminho: string) => { try { return statSync(caminho).isDirectory() } catch { return false } }

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

/**
 * SKILL.md mais raso da pasta da Skill (busca por nível, sem limite de profundidade; empate → ordem alfabética).
 * Não segue links: link simbólico para pasta, ou chamado SKILL.md, é ignorado e reportado em `aoIgnorarLink`.
 * Erro de leitura (EACCES etc.) é propagado ao chamador.
 */
export function acharSkillMd(pastaSkill: string, aoIgnorarLink: (relativo: string) => void = () => {}): string | null {
  let nivel = ['']
  while (nivel.length) {
    const achados: string[] = []
    const proximo: string[] = []
    for (const rel of nivel) {
      const entradas = readdirSync(join(pastaSkill, rel), { withFileTypes: true }).sort((a, b) => porCodigo(a.name, b.name))
      for (const e of entradas) {
        const caminho = rel ? `${rel}/${e.name}` : e.name
        if (e.isSymbolicLink()) {
          if (e.name === 'SKILL.md' || (pastaVisivel(e.name) && ehDiretorio(join(pastaSkill, caminho)))) aoIgnorarLink(caminho)
        } else if (e.isFile() && e.name === 'SKILL.md') achados.push(caminho)
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
  let truncado: boolean
  try {
    const fd = openSync(arquivo, fsc.O_RDONLY | fsc.O_NOFOLLOW)
    try {
      const st = fstatSync(fd)
      if (!st.isFile()) return { ok: false, motivo: 'arquivo ilegível' }
      truncado = st.size > LIMITE_FRONTMATTER_BYTES
      const buf = Buffer.alloc(LIMITE_FRONTMATTER_BYTES)
      texto = buf.subarray(0, readSync(fd, buf, 0, LIMITE_FRONTMATTER_BYTES, 0)).toString('utf8')
    } finally { closeSync(fd) }
  } catch (e) { return { ok: false, motivo: `arquivo ilegível (${codigoErro(e)})` } }
  const fm = lerFrontmatter(texto, { truncado })
  if (!fm.ok) return fm
  const nome = campoTexto(fm.campos, 'name')
  const descricao = campoTexto(fm.campos, 'description')
  if (nome.motivo) return { ok: false, motivo: nome.motivo }
  if (descricao.motivo) return { ok: false, motivo: descricao.motivo }
  if (!nome.valor && !descricao.valor) return { ok: false, motivo: 'frontmatter sem name e sem description' }
  if (!nome.valor) return { ok: false, motivo: 'frontmatter sem name' }
  if (!descricao.valor) return { ok: false, motivo: 'frontmatter sem description' }
  return { ok: true, description: descricao.valor }
}

/** `name`/`description` precisam ser texto não vazio: ausente, nulo ou em branco = vazio; outro tipo = erro. */
function campoTexto(campos: Record<string, unknown>, chave: string): { valor?: string; motivo?: string } {
  const v = Object.hasOwn(campos, chave) ? campos[chave] : undefined
  if (v === undefined || v === null) return {}
  if (typeof v === 'string') return v.trim() ? { valor: v.trim() } : {}
  const tipo = Array.isArray(v) ? 'lista' : typeof v === 'number' ? 'número' : typeof v === 'boolean' ? 'booleano' : 'mapa'
  return { motivo: `frontmatter: ${chave} deve ser texto (recebido ${tipo})` }
}

const urlDaSkill = (pasta: string, slug: string) => `${URL_BASE}/${encodeURIComponent(pasta)}/${encodeURIComponent(slug)}`

export type EntradaGerador = { skillsDir: string; curadoria: Curadoria; commitFonte?: string; agora?: Date }

export function gerarCatalogo({ skillsDir, curadoria, commitFonte = 'local', agora = new Date() }: EntradaGerador): { catalogo: Catalogo; avisos: string[] } {
  const avisos: string[] = []
  const rejeitadas: Rejeitada[] = []
  let raiz: Dirent[]
  try { raiz = readdirSync(skillsDir, { withFileTypes: true }) }
  catch (e) { throw new ErroCatalogo('skills-dir', `SKILLS_DIR ilegível (${codigoErro(e)})`) }
  const candidatas = raiz
    .filter((e) => /^\d{2}-/.test(e.name))
    .map((e) => ({ pasta: e.name, link: e.isSymbolicLink() }))
    .filter((c) => (c.link ? ehDiretorio(join(skillsDir, c.pasta)) : raiz.find((e) => e.name === c.pasta)!.isDirectory()))
    .sort((a, b) => porCodigo(a.pasta.slice(0, 2), b.pasta.slice(0, 2)) || porCodigo(a.pasta, b.pasta))
  const pastas = candidatas.filter((c) => !c.link).map((c) => c.pasta)
  if (pastas.length === 0) throw new ErroCatalogo('sem-categorias', 'nenhuma Categoria (pasta ^\\d{2}-) encontrada em SKILLS_DIR')

  const categorias: CatalogoCategoria[] = []
  const validas = new Set<string>() // "<pasta>/<slug>"
  for (const { pasta, link } of candidatas) {
    if (link) { avisos.push(`link simbólico ignorado: ${pasta}`); continue }
    const cur = Object.hasOwn(curadoria.categorias, pasta) ? curadoria.categorias[pasta] : {}
    const destaqueOrdem = [...new Set(Object.hasOwn(curadoria.destaques, pasta) ? curadoria.destaques[pasta] : [])]
    const itens: { slug: string; resumo: string }[] = []
    let entradas: Dirent[] = []
    try { entradas = readdirSync(join(skillsDir, pasta), { withFileTypes: true }) }
    catch (e) { avisos.push(`não foi possível listar a categoria ${pasta} (${codigoErro(e)})`) }
    entradas.sort((a, b) => porCodigo(a.name, b.name))
    for (const entrada of entradas) {
      const slug = entrada.name
      if (!pastaVisivel(slug)) continue
      const dirSkill = join(skillsDir, pasta, slug)
      if (entrada.isSymbolicLink()) { if (ehDiretorio(dirSkill)) avisos.push(`link simbólico ignorado: ${pasta}/${slug}`); continue }
      if (!entrada.isDirectory()) continue
      let rel: string | null
      try { rel = acharSkillMd(dirSkill, (r) => avisos.push(`link simbólico ignorado: ${pasta}/${slug}/${r}`)) }
      catch (e) { rejeitadas.push({ caminho: `${pasta}/${slug}`, motivo: `erro de leitura (${codigoErro(e)})` }); continue }
      if (rel === null) continue // pasta sem nenhum SKILL.md não é Skill
      const leitura = lerSkillMd(join(dirSkill, rel))
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

  const porId = new Map<string, string[]>()
  for (const c of categorias) porId.set(c.id, [...(porId.get(c.id) ?? []), c.pasta])
  for (const [id, lista] of porId) if (lista.length > 1) avisos.push(`prefixo numérico repetido (id "${id}"): ${lista.join(', ')}; use a pasta como chave`)

  const pastasSet = new Set(pastas)
  for (const pasta of Object.keys(curadoria.categorias)) if (!pastasSet.has(pasta)) avisos.push(`curadoria.categorias referencia categoria inexistente: ${pasta}`)
  for (const pasta of Object.keys(curadoria.destaques)) if (!pastasSet.has(pasta)) avisos.push(`curadoria.destaques referencia categoria inexistente: ${pasta}`)
  for (const chave of Object.keys(curadoria.resumos)) if (!validas.has(chave)) avisos.push(`resumo "${chave}" aponta para Skill inexistente`)

  rejeitadas.sort((a, b) => porCodigo(a.caminho, b.caminho))
  return { catalogo: { geradoEm: agora.toISOString(), commitFonte, categorias, rejeitadas }, avisos }
}
