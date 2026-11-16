// `npm run catalogo` (em app/): gera src/data/catalogo.json a partir do skills-library.
//   SKILLS_DIR  (obrigatório) raiz do skills-library
//   SKILLS_SHA  (opcional)    SHA do skills-library; ausente/ inválido → "local"
//   CATALOGO_CURADORIA / CATALOGO_SAIDA (opcionais, para testes) sobrescrevem os caminhos padrão
// Exit 0 mesmo com rejeitadas/avisos; ≠0 só se SKILLS_DIR inválido (2), Curadoria inválida (3) ou zero Categorias (4).
import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { ErroCatalogo, gerarCatalogo, validarCuradoria } from './gerar.ts'

const APP = resolve(import.meta.dirname, '..')
const SAIDAS = { 'skills-dir': 2, curadoria: 3, 'sem-categorias': 4 } as const

export function executar(env: NodeJS.ProcessEnv, escrever: (linha: string) => void = console.log): number {
  const avisosExtras: string[] = []
  try {
    const skillsDir = env.SKILLS_DIR?.trim()
    if (!skillsDir) throw new ErroCatalogo('skills-dir', 'SKILLS_DIR não definido')
    let ehDir = false
    try { ehDir = statSync(skillsDir, { throwIfNoEntry: false })?.isDirectory() ?? false }
    catch (e) { throw new ErroCatalogo('skills-dir', `SKILLS_DIR ilegível (${(e as NodeJS.ErrnoException).code ?? 'desconhecido'})`) }
    if (!ehDir) throw new ErroCatalogo('skills-dir', 'SKILLS_DIR não é um diretório')
    const shaBruto = env.SKILLS_SHA?.trim()
    const sha = shaBruto && /^[0-9a-f]{7,40}$/i.test(shaBruto) ? shaBruto.toLowerCase() : 'local'
    if (shaBruto && sha === 'local') avisosExtras.push('SKILLS_SHA ignorado: não é um SHA hexadecimal de 7 a 40 caracteres')

    const arquivoCuradoria = resolve(env.CATALOGO_CURADORIA ?? `${APP}/curadoria.json`)
    let bruto: unknown
    try { bruto = JSON.parse(readFileSync(arquivoCuradoria, 'utf8')) }
    catch { throw new ErroCatalogo('curadoria', `Curadoria ilegível ou JSON inválido: ${arquivoCuradoria}`) }
    const curadoria = validarCuradoria(bruto)

    const { catalogo, avisos } = gerarCatalogo({ skillsDir: resolve(skillsDir), curadoria, commitFonte: sha })
    const saida = resolve(env.CATALOGO_SAIDA ?? `${APP}/src/data/catalogo.json`)
    mkdirSync(dirname(saida), { recursive: true })
    const tmp = `${saida}.${process.pid}.tmp`
    writeFileSync(tmp, `${JSON.stringify(catalogo, null, 2)}\n`)
    renameSync(tmp, saida)

    const total = catalogo.categorias.reduce((n, c) => n + c.total, 0)
    const todosAvisos = [...avisosExtras, ...avisos]
    const linhas = [
      `catálogo: ${catalogo.categorias.length} categorias, ${total} skills, ${catalogo.rejeitadas.length} rejeitadas, ${todosAvisos.length} avisos (fonte ${sha})`,
      ...catalogo.rejeitadas.map((r) => `rejeitada: ${r.caminho} — ${r.motivo}`),
      ...todosAvisos.map((a) => `aviso: ${a}`),
    ]
    for (const l of linhas) escrever(l)
    if (env.GITHUB_STEP_SUMMARY) {
      const md = [`### Catálogo`, '', `${catalogo.categorias.length} categorias, ${total} skills, ${catalogo.rejeitadas.length} rejeitadas, ${todosAvisos.length} avisos.`, '',
        ...catalogo.rejeitadas.map((r) => `- rejeitada \`${r.caminho}\`: ${r.motivo}`), ...todosAvisos.map((a) => `- aviso: ${a}`), ''].join('\n')
      appendFileSync(env.GITHUB_STEP_SUMMARY, md)
    }
    return 0
  } catch (e) {
    if (e instanceof ErroCatalogo) { console.error(`erro (${e.codigo}): ${e.message}`); return SAIDAS[e.codigo] }
    console.error(`erro inesperado: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
}

if (import.meta.filename === process.argv[1]) process.exitCode = executar(process.env)
