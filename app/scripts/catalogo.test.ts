// Testes do gerador do Catálogo. Fixtures em diretório temporário próprio (não dependem de TMPDIR exportado).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, describe, test } from 'node:test'
import type { Catalogo, Curadoria } from '../src/data/catalogo-types.ts'
import { lerFrontmatter } from './frontmatter.ts'
import { ErroCatalogo, gerarCatalogo, humanizar, resumir, validarCuradoria } from './gerar.ts'

const BASE = [process.env.TMPDIR, tmpdir(), '/tmp'].find((d) => d && existsSync(d))!
const criados: string[] = []
const novoDir = (): string => { const d = mkdtempSync(join(BASE, 'akmon-catalogo-')); criados.push(d); return d }
after(() => { for (const d of criados) rmSync(d, { recursive: true, force: true }) })

const CLI = resolve(import.meta.dirname, 'catalogo.ts')
const VAZIA: Curadoria = { categorias: {}, destaques: {}, resumos: {} }
const fm = (name: string | null, description: string | null, extra = '') =>
  `---\n${name === null ? '' : `name: ${name}\n`}${description === null ? '' : `description: ${description}\n`}${extra}---\n\n# corpo\n`

function escrever(raiz: string, caminho: string, conteudo: string) {
  const alvo = join(raiz, caminho)
  mkdirSync(dirname(alvo), { recursive: true })
  writeFileSync(alvo, conteudo)
}
const skill = (raiz: string, pasta: string, slug: string, conteudo: string, sub = 'SKILL.md') => escrever(raiz, `${pasta}/${slug}/${sub}`, conteudo)
const gerar = (raiz: string, curadoria: Curadoria = VAZIA, commitFonte?: string) =>
  gerarCatalogo({ skillsDir: raiz, curadoria, commitFonte, agora: new Date('2026-11-16T12:00:00Z') })
const slugs = (c: Catalogo, pasta: string) => c.categorias.find((x) => x.pasta === pasta)!.skills.map((s) => s.slug)

describe('lerFrontmatter (YAML 1.2 via lib yaml)', () => {
  const campos = (t: string) => { const r = lerFrontmatter(t); assert.ok(r.ok, JSON.stringify(r)); return r.campos }

  test('escalar plano, aspas duplas e simples', () => {
    const c = campos(`---\nname: a-b\ndescription: "Faz X. Usa \\"Y\\" e \\\\ barra\\ncom quebra"\nlicense: 'It''s MIT'\n---\n`)
    assert.equal(c.name, 'a-b')
    assert.equal(c.description, 'Faz X. Usa "Y" e \\ barra\ncom quebra')
    assert.equal(c.license, "It's MIT")
  })

  test('description em bloco `>-` (dobrado, sem \\n final)', () => {
    const c = campos(`---\nname: n\ndescription: >-\n  Primeira linha da frase.\n  Segunda linha continua.\n\n  Outro parágrafo.\nversion: 1\n---\n`)
    assert.equal(c.description, 'Primeira linha da frase. Segunda linha continua.\nOutro parágrafo.')
    assert.equal(c.version, 1) // YAML real: número, não texto
  })

  test('blocos `>` (clip), `|` (literal) e indicador de recuo', () => {
    const c = campos(`---\na: >\n  um\n  dois\nb: |\n  linha1\n    linha2\nc: |2-\n    x\n---\n`)
    assert.equal(c.a, 'um dois\n')
    assert.equal(c.b, 'linha1\n  linha2\n')
    assert.equal(c.c, '  x')
  })

  test('plano multilinha, aspas multilinha e comentário ao fim do plano', () => {
    const c = campos(`---\na: um\n  dois\n   três\nb: "abre\n  fecha"\nc: texto # comentário\n---\n`)
    assert.equal(c.a, 'um dois três')
    assert.equal(c.b, 'abre fecha')
    assert.equal(c.c, 'texto')
  })

  test('mapas e listas aninhados chegam como estrutura e não vazam chaves', () => {
    const c = campos(`---\nname: n\nmetadata:\n  hermes:\n    tags: [a, b]\n  description: não é a do topo\ntags:\n  - x\n  - y\ndescription: real\n---\n`)
    assert.deepEqual(c.metadata, { hermes: { tags: ['a', 'b'] }, description: 'não é a do topo' })
    assert.deepEqual(c.tags, ['x', 'y'])
    assert.equal(c.description, 'real')
  })

  test('CRLF, BOM e fechamento com `...`', () => {
    assert.deepEqual(campos('\uFEFF---\r\nname: a\r\ndescription: b\r\n---\r\ncorpo'), { name: 'a', description: 'b' })
    assert.deepEqual(campos('---\nname: a\n...\ncorpo'), { name: 'a' })
  })

  test('ausente, sem fechamento e acima do limite de leitura', () => {
    assert.deepEqual(lerFrontmatter('# só markdown\n'), { ok: false, motivo: 'frontmatter ausente' })
    assert.deepEqual(lerFrontmatter(''), { ok: false, motivo: 'frontmatter ausente' })
    assert.deepEqual(lerFrontmatter('---\nname: a\ndescription: b\n'), { ok: false, motivo: 'frontmatter sem fechamento' })
    assert.deepEqual(lerFrontmatter('---\nname: a\n', { truncado: true }), { ok: false, motivo: 'frontmatter acima de 64 KB' })
    assert.equal(lerFrontmatter('---\nname: a\n---\n', { truncado: true }).ok, true) // fechou dentro do limite
  })

  test('YAML inválido traz linha do arquivo (conta a linha de abertura) e motivo em uma linha', () => {
    const r = lerFrontmatter('---\nname: a\ndescription: Use when: x\n---\n')
    assert.ok(!r.ok)
    assert.match(r.motivo, /^frontmatter YAML inválido \(linha 3\): /)
  })
})

describe('resumir / humanizar', () => {
  test('1ª frase até ". " mantendo o ponto, espaços colapsados', () => {
    assert.equal(resumir('Faz   X\n  com Y. Depois faz Z. Fim.'), 'Faz X com Y.')
    assert.equal(resumir('Sem ponto no meio'), 'Sem ponto no meio')
    assert.equal(resumir('Termina com ponto.'), 'Termina com ponto.')
  })

  test('trunca em 160 caracteres com reticências (por code point)', () => {
    const longa = `${'a'.repeat(200)}. Resto.`
    const r = resumir(longa)
    assert.equal([...r].length, 160)
    assert.ok(r.endsWith('…'))
    assert.equal(resumir('b'.repeat(160)), 'b'.repeat(160)) // exatamente 160: intacto
    assert.equal([...resumir('😀'.repeat(170))].length, 160) // sem cortar par substituto
    assert.ok(!resumir('😀'.repeat(170)).includes('�'))
  })

  test('humaniza o nome da pasta', () => {
    assert.equal(humanizar('07-novas-ideias_pro'), 'Novas ideias pro')
    assert.equal(humanizar('05-dev-harness-cli'), 'Dev harness cli')
  })
})

describe('gerarCatalogo', () => {
  test('skill aninhada (last30days) conta como 1 skill com slug da pasta de 1º nível', () => {
    const raiz = novoDir()
    const p = '05-dev-harness-cli'
    skill(raiz, p, 'last30days-skill', fm('last30days', '"Pesquisa o que dizem sobre um tema. Com engajamento."'), 'skills/last30days/SKILL.md')
    escrever(raiz, `${p}/last30days-skill/README.md`, 'x')
    escrever(raiz, `${p}/last30days-skill/tests/fixtures/SKILL.md`, 'sem frontmatter, mais fundo: ignorado')
    skill(raiz, p, 'simples', fm('simples', 'Skill rasa.'))
    const { catalogo, avisos } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, p), ['last30days-skill', 'simples'])
    assert.equal(catalogo.categorias[0].total, 2)
    assert.equal(catalogo.categorias[0].skills[0].resumo, 'Pesquisa o que dizem sobre um tema.')
    assert.deepEqual(catalogo.rejeitadas, [])
    assert.deepEqual(avisos, [])
  })

  test('SKILL.md mais raso vence; empate no mesmo nível desempata por ordem alfabética', () => {
    const raiz = novoDir()
    const p = '01-a'
    skill(raiz, p, 'x', fm('raso', 'Resumo do raso.'))
    skill(raiz, p, 'x', fm('fundo', 'Resumo do fundo.'), 'a/b/SKILL.md')
    skill(raiz, p, 'y', fm('b', 'Resumo B.'), 'b/SKILL.md')
    skill(raiz, p, 'y', fm('a', 'Resumo A.'), 'a/SKILL.md')
    const { catalogo } = gerar(raiz)
    const r = Object.fromEntries(catalogo.categorias[0].skills.map((s) => [s.slug, s.resumo]))
    assert.deepEqual(r, { x: 'Resumo do raso.', y: 'Resumo A.' })
  })

  test('frontmatter ausente, sem name, sem description, vazio e sem fechamento → rejeitadas', () => {
    const raiz = novoDir()
    const p = '02-b'
    skill(raiz, p, 'boa', fm('boa', 'Ok.'))
    skill(raiz, p, 'sem-fm', '# nada aqui\n')
    skill(raiz, p, 'sem-name', fm(null, 'tem description'))
    skill(raiz, p, 'sem-desc', fm('tem-name', null))
    skill(raiz, p, 'desc-vazia', fm('n', '""'))
    skill(raiz, p, 'sem-ambos', '---\nversion: 1\n---\n')
    skill(raiz, p, 'sem-fecha', '---\nname: n\ndescription: d\n')
    skill(raiz, p, 'aninhada-ruim', '---\nname: n\n---\n', 'skills/x/SKILL.md')
    const { catalogo } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, p), ['boa'])
    assert.equal(catalogo.categorias[0].total, 1)
    assert.deepEqual(catalogo.rejeitadas, [
      { caminho: `${p}/aninhada-ruim/skills/x/SKILL.md`, motivo: 'frontmatter sem description' },
      { caminho: `${p}/desc-vazia/SKILL.md`, motivo: 'frontmatter sem description' },
      { caminho: `${p}/sem-ambos/SKILL.md`, motivo: 'frontmatter sem name e sem description' },
      { caminho: `${p}/sem-desc/SKILL.md`, motivo: 'frontmatter sem description' },
      { caminho: `${p}/sem-fecha/SKILL.md`, motivo: 'frontmatter sem fechamento' },
      { caminho: `${p}/sem-fm/SKILL.md`, motivo: 'frontmatter ausente' },
      { caminho: `${p}/sem-name/SKILL.md`, motivo: 'frontmatter sem name' },
    ])
  })

  test('description em bloco `>-` gera o resumo pela 1ª frase', () => {
    const raiz = novoDir()
    skill(raiz, '03-c', 's', `---\nname: s\ndescription: >-\n  Constrói fluxos do zero ao ativo.\n  Use quando o usuário pedir X.\nmetadata:\n  a: b\n---\n`)
    const { catalogo } = gerar(raiz)
    assert.equal(catalogo.categorias[0].skills[0].resumo, 'Constrói fluxos do zero ao ativo.')
  })

  test('pasta sem SKILL.md não é Skill (nem rejeitada); arquivos, ocultas, node_modules e links são ignorados', () => {
    const raiz = novoDir()
    const p = '04-d'
    skill(raiz, p, 'ok', fm('ok', 'Ok.'))
    escrever(raiz, `${p}/vazia/README.md`, 'só readme')
    escrever(raiz, `${p}/.oculta/SKILL.md`, fm('o', 'o'))
    escrever(raiz, `${p}/node_modules/SKILL.md`, fm('o', 'o'))
    escrever(raiz, `${p}/ok/node_modules/pkg/SKILL.md`, '# ignorado')
    escrever(raiz, `${p}/NOTAS.md`, 'arquivo solto')
    const fora = novoDir()
    skill(fora, 'externa', 'x', fm('x', 'Fora do repo.'), 'SKILL.md')
    symlinkSync(join(fora, 'externa'), join(raiz, p, 'link'), 'dir')
    escrever(raiz, 'README.md', 'raiz')
    escrever(raiz, 'assets/x.png', 'png')
    const { catalogo } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, p), ['ok'])
    assert.deepEqual(catalogo.rejeitadas, [])
    assert.deepEqual(catalogo.categorias.map((c) => c.pasta), [p]) // assets/ não casa ^\d{2}-
  })

  test('categoria sem curadoria: nome humanizado, curto = nome; com curadoria parcial', () => {
    const raiz = novoDir()
    skill(raiz, '07-novas-ideias', 'a', fm('a', 'A.'))
    skill(raiz, '08-so-nome', 'a', fm('a', 'A.'))
    skill(raiz, '09-completa', 'a', fm('a', 'A.'))
    const cur: Curadoria = { categorias: { '08-so-nome': { nome: 'Só Nome' }, '09-completa': { nome: 'Completa', curto: 'Comp' } }, destaques: {}, resumos: {} }
    const { catalogo } = gerar(raiz, cur)
    const por = Object.fromEntries(catalogo.categorias.map((c) => [c.id, [c.nome, c.curto]]))
    assert.deepEqual(por, { '07': ['Novas ideias', 'Novas ideias'], '08': ['Só Nome', 'Só Nome'], '09': ['Completa', 'Comp'] })
  })

  test('destaque inexistente: aviso, não falha; resumo de skill inexistente também avisa', () => {
    const raiz = novoDir()
    const p = '01-a'
    skill(raiz, p, 'real', fm('real', 'Real.'))
    skill(raiz, p, 'quebrada', '# sem fm')
    const cur: Curadoria = { categorias: { '99-fantasma': { nome: 'X' } }, destaques: { [p]: ['fantasma', 'real', 'quebrada'], '98-nada': ['x'] }, resumos: { [`${p}/fantasma`]: 'R' } }
    const { catalogo, avisos } = gerar(raiz, cur)
    assert.deepEqual(slugs(catalogo, p), ['real'])
    assert.ok(catalogo.categorias[0].skills[0].destaque)
    assert.deepEqual(avisos, [
      `destaque "fantasma" da categoria ${p} não existe no Catálogo`,
      `destaque "quebrada" da categoria ${p} não existe no Catálogo`,
      'curadoria.categorias referencia categoria inexistente: 99-fantasma',
      'curadoria.destaques referencia categoria inexistente: 98-nada',
      `resumo "${p}/fantasma" aponta para Skill inexistente`,
    ])
  })

  test('ordenação: destaques na ordem da curadoria (sem duplicar), resto alfabético por slug', () => {
    const raiz = novoDir()
    const p = '01-a'
    for (const s of ['zeta', 'alfa', 'mike', 'bravo', 'yankee']) skill(raiz, p, s, fm(s, `Skill ${s}.`))
    const { catalogo } = gerar(raiz, { ...VAZIA, destaques: { [p]: ['yankee', 'alfa', 'yankee', 'zeta'] } })
    const lista = catalogo.categorias[0].skills
    assert.deepEqual(lista.map((s) => s.slug), ['yankee', 'alfa', 'zeta', 'bravo', 'mike'])
    assert.deepEqual(lista.map((s) => s.destaque), [true, true, true, false, false])
    assert.equal(catalogo.categorias[0].total, 5)
  })

  test('categorias ordenadas por id; resumo da curadoria vence a description e não é truncado; url por skill', () => {
    const raiz = novoDir()
    skill(raiz, '10-ultima', 'a', fm('a', 'Desc EN.'))
    skill(raiz, '02-segunda', 'a b', fm('a', 'Desc.'))
    const longo = 'R'.repeat(300)
    const { catalogo } = gerar(raiz, { ...VAZIA, resumos: { '10-ultima/a': longo } }, 'abc1234')
    assert.deepEqual(catalogo.categorias.map((c) => c.id), ['02', '10'])
    assert.equal(catalogo.categorias[1].skills[0].resumo, longo)
    assert.equal(catalogo.categorias[0].skills[0].url, 'https://github.com/RafaelMKn/skills-library/tree/main/02-segunda/a%20b')
    assert.equal(catalogo.categorias[1].skills[0].url, 'https://github.com/RafaelMKn/skills-library/tree/main/10-ultima/a')
    assert.equal(catalogo.commitFonte, 'abc1234')
    assert.equal(catalogo.geradoEm, '2026-11-16T12:00:00.000Z')
    assert.equal(gerar(raiz).catalogo.commitFonte, 'local')
  })

  test('zero categorias → ErroCatalogo sem-categorias', () => {
    const raiz = novoDir()
    escrever(raiz, 'README.md', 'x')
    escrever(raiz, 'assets/a.txt', 'x')
    assert.throws(() => gerar(raiz), (e: unknown) => e instanceof ErroCatalogo && e.codigo === 'sem-categorias')
  })
})

describe('validarCuradoria', () => {
  const invalido = (v: unknown) => assert.throws(() => validarCuradoria(v), (e: unknown) => e instanceof ErroCatalogo && e.codigo === 'curadoria')

  test('aceita formato completo, parcial e vazio', () => {
    assert.deepEqual(validarCuradoria({}), VAZIA)
    assert.deepEqual(validarCuradoria({ categorias: { '01-a': { nome: ' N ' } }, destaques: { '01-a': ['x'] }, resumos: { '01-a/x': 'R' } }),
      { categorias: { '01-a': { nome: 'N' } }, destaques: { '01-a': ['x'] }, resumos: { '01-a/x': 'R' } })
  })

  test('recusa tipos errados e chaves desconhecidas', () => {
    for (const v of [null, [], 'x', 1, { categoria: {} }, { categorias: [] }, { categorias: { a: 'x' } }, { categorias: { a: { nome: '' } } },
      { categorias: { a: { nome: 1 } } }, { categorias: { a: { apelido: 'x' } } }, { destaques: { a: 'x' } }, { destaques: { a: [1] } },
      { destaques: { a: [''] } }, { resumos: { a: 1 } }, { resumos: { a: ' ' } }]) invalido(v)
  })
})

// ---------------------------------------------------------------- achados do QA (fase 1)
const raizRoot = process.getuid?.() === 0 // root ignora chmod: casos de EACCES não são reproduzíveis
const comTrava = (alvo: string, corpo: () => void) => { chmodSync(alvo, 0o000); try { corpo() } finally { chmodSync(alvo, 0o755) } }

describe('QA #1: profundidade ilimitada', () => {
  test('SKILL.md em qualquer profundidade (12 e 40 níveis) conta como Skill, sem avisos', () => {
    const raiz = novoDir()
    const fundo = (n: number) => Array.from({ length: n }, (_, i) => `n${i}`).join('/')
    skill(raiz, '07-teste', 'p8', fm('p8', 'Nível 8.'), `${fundo(8)}/SKILL.md`)
    skill(raiz, '07-teste', 'p12', fm('p12', 'Nível 12.'), `${fundo(12)}/SKILL.md`)
    skill(raiz, '07-teste', 'p40', fm('p40', 'Nível 40.'), `${fundo(40)}/SKILL.md`)
    const { catalogo, avisos } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, '07-teste'), ['p12', 'p40', 'p8'])
    assert.deepEqual(catalogo.rejeitadas, [])
    assert.deepEqual(avisos, [])
  })
})

describe('QA #2: erro de I/O não derruba o job', () => {
  test('pasta de Skill ilegível → rejeitada com o código do erro; as demais seguem', (t) => {
    if (raizRoot) return t.skip('root ignora chmod')
    const raiz = novoDir()
    skill(raiz, '01-a', 'boa', fm('boa', 'Boa.'))
    skill(raiz, '01-a', 'trancada', fm('t', 'Trancada.'))
    comTrava(join(raiz, '01-a', 'trancada'), () => {
      const { catalogo } = gerar(raiz)
      assert.deepEqual(slugs(catalogo, '01-a'), ['boa'])
      assert.deepEqual(catalogo.rejeitadas, [{ caminho: '01-a/trancada', motivo: 'erro de leitura (EACCES)' }])
    })
  })

  test('SKILL.md ilegível → rejeitada com o código; raiz da Categoria ilegível → aviso e total 0', (t) => {
    if (raizRoot) return t.skip('root ignora chmod')
    const raiz = novoDir()
    skill(raiz, '01-a', 'boa', fm('boa', 'Boa.'))
    skill(raiz, '01-a', 'sem-leitura', fm('s', 'S.'))
    skill(raiz, '02-b', 'x', fm('x', 'X.'))
    chmodSync(join(raiz, '01-a', 'sem-leitura', 'SKILL.md'), 0o000)
    try {
      comTrava(join(raiz, '02-b'), () => {
        const { catalogo, avisos } = gerar(raiz)
        assert.deepEqual(catalogo.rejeitadas, [{ caminho: '01-a/sem-leitura/SKILL.md', motivo: 'arquivo ilegível (EACCES)' }])
        assert.deepEqual(avisos, ['não foi possível listar a categoria 02-b (EACCES)'])
        const c = catalogo.categorias.find((x) => x.pasta === '02-b')!
        assert.deepEqual([c.total, c.skills], [0, []])
        assert.deepEqual(slugs(catalogo, '01-a'), ['boa'])
      })
    } finally { chmodSync(join(raiz, '01-a', 'sem-leitura', 'SKILL.md'), 0o644) }
  })

  test('SKILLS_DIR ilegível → ErroCatalogo skills-dir (exit 2), não erro inesperado', (t) => {
    if (raizRoot) return t.skip('root ignora chmod')
    const raiz = novoDir()
    skill(raiz, '01-a', 'x', fm('x', 'X.'))
    comTrava(raiz, () => assert.throws(() => gerar(raiz), (e: unknown) => e instanceof ErroCatalogo && e.codigo === 'skills-dir' && /EACCES/.test(e.message)))
  })
})

describe('QA #3, #6, #7: frontmatter é YAML de verdade', () => {
  const um = (conteudo: string) => {
    const raiz = novoDir()
    skill(raiz, '01-a', 's', conteudo)
    const { catalogo } = gerar(raiz)
    return { resumo: catalogo.categorias[0].skills[0]?.resumo, rej: catalogo.rejeitadas[0] }
  }

  test('YAML inválido → rejeitada com o motivo do parser (c01, c02, c03, c06, c17, c18)', () => {
    for (const [id, conteudo] of Object.entries({
      c01: '---\nname: a\ndescription: Use when: o usuário pede\n---\nx',
      c02: '---\nname: a\ndescription: @foo bar\n---\nx',
      c03: '---\nname: a\ndescription: `code` texto\n---\nx',
      c06: '---\nname: a\ndescription: "sem fim\n---\nx',
      c17: '---\nname: a\ndescription:\n\tfoo\n---\nx',
      c18: '---\nname: a\ndescription: ? x\n---\nx',
      c04: '---\nname: a\nname: b\ndescription: d\n---\nx',
    })) {
      const r = um(conteudo)
      assert.equal(r.resumo, undefined, `${id} deveria ser rejeitada`)
      assert.match(r.rej.motivo, /^frontmatter YAML inválido \(linha \d+\): .+/, id)
      assert.ok(!r.rej.motivo.includes('\n'), `${id}: motivo em uma linha`)
    }
  })

  test('YAML válido é aceito (c07 comentário no ---, c08 chave entre aspas, c13 indentado, c09, c10, c15, c19, c20)', () => {
    assert.equal(um('--- # comentario\nname: a\ndescription: d\n---\nx').resumo, 'd')
    assert.equal(um('---\n"name": a\n"description": d\n---\nx').resumo, 'd')
    assert.equal(um('---\n  name: a\n  description: d\n---\nx').resumo, 'd')
    assert.equal(um('---\nname: a\ndescription: primeira linha\n\n  continua aqui\n---\nx').resumo, 'primeira linha continua aqui')
    assert.equal(um('---\nname: a\ndescription: "\\x41BC"\n---\nx').resumo, 'ABC')
    assert.equal(um('---\nname: a\ndescription: foo#bar\n---\nx').resumo, 'foo#bar')
    assert.equal(um('---\nname: a\ndescription: Foo:bar\n---\nx').resumo, 'Foo:bar')
    assert.equal(um('---\nname: a\ndescription: "Use when: x"\n---\nx').resumo, 'Use when: x')
  })

  test('alias e âncora são resolvidos pelo YAML (c11)', () => {
    assert.equal(um('---\nname: &n a\ndescription: *n\n---\nx').resumo, 'a')
  })

  test('name/description que não são texto → rejeitada (c05 lista, c14 lista, número, booleano, mapa)', () => {
    const motivo = (c: string) => um(c).rej?.motivo
    assert.equal(motivo('---\nname: [a, b]\ndescription: d\n---\nx'), 'frontmatter: name deve ser texto (recebido lista)')
    assert.equal(motivo('---\nname: a\ndescription:\n  - item um\n  - item dois\n---\nx'), 'frontmatter: description deve ser texto (recebido lista)')
    assert.equal(motivo('---\nname: 123\ndescription: d\n---\nx'), 'frontmatter: name deve ser texto (recebido número)')
    assert.equal(motivo('---\nname: a\ndescription: true\n---\nx'), 'frontmatter: description deve ser texto (recebido booleano)')
    assert.equal(motivo('---\nname: a\ndescription: {x: 1}\n---\nx'), 'frontmatter: description deve ser texto (recebido mapa)')
  })

  test('frontmatter que não é mapa (lista ou texto) é rejeitado; vazio vale "sem name e sem description"', () => {
    assert.equal(um('---\n- a\n- b\n---\nx').rej.motivo, 'frontmatter não é um mapa YAML')
    assert.equal(um('---\nsó texto\n---\nx').rej.motivo, 'frontmatter não é um mapa YAML')
    assert.equal(um('---\n---\nx').rej.motivo, 'frontmatter sem name e sem description')
    assert.equal(um('---\nname:\ndescription: d\n---\nx').rej.motivo, 'frontmatter sem name')
  })

  test('bomba de aliases (billion laughs) é rejeitada sem travar', () => {
    const niveis = ['a: &a0 [x, x, x, x, x, x, x, x, x, x]']
    for (let i = 1; i < 9; i++) niveis.push(`b${i}: &a${i} [${Array(10).fill(`*a${i - 1}`).join(', ')}]`)
    const inicio = Date.now()
    const r = um(`---\nname: a\ndescription: d\n${niveis.join('\n')}\n---\nx`)
    assert.ok(Date.now() - inicio < 2000, 'demorou demais')
    assert.equal(r.resumo, undefined)
    assert.match(r.rej.motivo, /^frontmatter YAML inválido/)
  })
})

describe('QA #4: prefixo numérico repetido', () => {
  test('07-a e 07-b: exit 0, aviso, id continua sendo o prefixo e a pasta é única', () => {
    const raiz = novoDir()
    skill(raiz, '07-a', 's', fm('s', 'A.'))
    skill(raiz, '07-b', 's', fm('s', 'B.'))
    skill(raiz, '08-c', 's', fm('s', 'C.'))
    const { catalogo, avisos } = gerar(raiz)
    assert.deepEqual(catalogo.categorias.map((c) => [c.id, c.pasta]), [['07', '07-a'], ['07', '07-b'], ['08', '08-c']])
    assert.deepEqual(avisos, ['prefixo numérico repetido (id "07"): 07-a, 07-b; use a pasta como chave'])
  })
})

describe('QA #8: limite de 64 KB do frontmatter', () => {
  test('frontmatter acima de 64 KB → motivo correto (não "sem fechamento")', () => {
    const raiz = novoDir()
    skill(raiz, '01-a', 'grande', fm('g', 'x'.repeat(70 * 1024)))
    skill(raiz, '01-a', 'sem-fecha-pequeno', '---\nname: a\ndescription: d\n')
    const { catalogo } = gerar(raiz)
    assert.deepEqual(catalogo.rejeitadas, [
      { caminho: '01-a/grande/SKILL.md', motivo: 'frontmatter acima de 64 KB' },
      { caminho: '01-a/sem-fecha-pequeno/SKILL.md', motivo: 'frontmatter sem fechamento' },
    ])
  })

  test('arquivo grande com frontmatter pequeno é válido; frontmatter perto do limite também', () => {
    const raiz = novoDir()
    skill(raiz, '01-a', 'corpo-grande', `${fm('c', 'Corpo grande. Resto.')}${'linha de corpo\n'.repeat(20000)}`)
    skill(raiz, '01-a', 'quase', fm('q', 'y'.repeat(60 * 1024)))
    const { catalogo } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, '01-a'), ['corpo-grande', 'quase'])
    assert.deepEqual(catalogo.rejeitadas, [])
  })
})

describe('QA #9: links simbólicos ignorados geram aviso', () => {
  test('pasta de Skill, SKILL.md, pasta de Categoria e subpasta (diretório) viram aviso com o caminho', () => {
    const raiz = novoDir(), fora = novoDir()
    skill(fora, 'ext', 'real', fm('r', 'Real.'))
    skill(raiz, '01-a', 'ok', fm('ok', 'Ok.'))
    symlinkSync(join(fora, 'ext', 'real'), join(raiz, '01-a', 'link-skill'), 'dir')
    escrever(fora, 'alvo/SKILL.md', fm('x', 'X.'))
    mkdirSync(join(raiz, '07-link', 'sk'), { recursive: true })
    symlinkSync(join(fora, 'alvo', 'SKILL.md'), join(raiz, '07-link', 'sk', 'SKILL.md'))
    symlinkSync(join(fora, 'ext'), join(raiz, '08-cat'), 'dir')
    skill(raiz, '01-a', 'com-subpasta-link', fm('c', 'C.'), 'x/SKILL.md')
    symlinkSync(join(fora, 'ext'), join(raiz, '09-d'), 'dir')
    mkdirSync(join(raiz, '10-e', 'sk', 'sub'), { recursive: true })
    symlinkSync(join(fora, 'ext'), join(raiz, '10-e', 'sk', 'docs'), 'dir')
    escrever(raiz, '10-e/sk/sub/SKILL.md', fm('s', 'S.'))
    symlinkSync(join(fora, 'alvo', 'SKILL.md'), join(raiz, '10-e', 'sk', 'LEIAME.md')) // symlink de arquivo comum: sem aviso
    const { catalogo, avisos } = gerar(raiz)
    assert.deepEqual(slugs(catalogo, '01-a'), ['com-subpasta-link', 'ok'])
    assert.deepEqual(avisos, [
      'link simbólico ignorado: 01-a/link-skill',
      'link simbólico ignorado: 07-link/sk/SKILL.md',
      'link simbólico ignorado: 08-cat',
      'link simbólico ignorado: 09-d',
      'link simbólico ignorado: 10-e/sk/docs',
    ])
    assert.deepEqual(catalogo.categorias.map((c) => c.pasta), ['01-a', '07-link', '10-e']) // 08-cat/09-d (links) não viram Categoria
  })
})

describe('CLI (npm run catalogo)', () => {
  const rodar = (env: Record<string, string | undefined>) => {
    const limpo: Record<string, string> = { PATH: process.env.PATH ?? '' } // sem TMPDIR, sem GITHUB_*
    for (const [k, v] of Object.entries(env)) if (v !== undefined) limpo[k] = v
    return spawnSync(process.execPath, [CLI], { env: limpo, encoding: 'utf8' })
  }
  const cenario = () => {
    const raiz = novoDir(), saida = join(novoDir(), 'sub', 'catalogo.json'), cur = join(novoDir(), 'curadoria.json')
    skill(raiz, '01-a', 'boa', fm('boa', 'Boa skill. Detalhe.'))
    skill(raiz, '01-a', 'ruim', '# sem frontmatter')
    writeFileSync(cur, JSON.stringify({ destaques: { '01-a': ['boa', 'sumiu'] } }))
    return { raiz, saida, cur }
  }

  test('exit 0 com rejeitadas e avisos; escreve o JSON no formato Catalogo e imprime o resumo', () => {
    const { raiz, saida, cur } = cenario()
    const r = rodar({ SKILLS_DIR: raiz, SKILLS_SHA: 'ABCDEF1234', CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur })
    assert.equal(r.status, 0, r.stderr)
    const c = JSON.parse(readFileSync(saida, 'utf8')) as Catalogo
    assert.equal(c.commitFonte, 'abcdef1234')
    assert.deepEqual(c.rejeitadas, [{ caminho: '01-a/ruim/SKILL.md', motivo: 'frontmatter ausente' }])
    assert.deepEqual(Object.keys(c).sort(), ['categorias', 'commitFonte', 'geradoEm', 'rejeitadas'])
    assert.deepEqual(Object.keys(c.categorias[0]).sort(), ['curto', 'id', 'nome', 'pasta', 'skills', 'total'])
    assert.deepEqual(Object.keys(c.categorias[0].skills[0]).sort(), ['destaque', 'resumo', 'slug', 'url'])
    assert.ok(!Number.isNaN(Date.parse(c.geradoEm)))
    assert.match(r.stdout, /1 categorias, 1 skills, 1 rejeitadas, 1 avisos/)
    assert.match(r.stdout, /rejeitada: 01-a\/ruim\/SKILL\.md — frontmatter ausente/)
    assert.match(r.stdout, /aviso: destaque "sumiu"/)
    assert.equal(r.stdout.trimEnd().split('\n').length, 3) // resumo + 1 rejeitada + 1 aviso, sem lixo extra
  })

  test('SKILLS_SHA ausente ou inválido → "local" (inválido avisa)', () => {
    const { raiz, saida, cur } = cenario()
    assert.equal(rodar({ SKILLS_DIR: raiz, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 0)
    assert.equal(JSON.parse(readFileSync(saida, 'utf8')).commitFonte, 'local')
    const r = rodar({ SKILLS_DIR: raiz, SKILLS_SHA: 'não-é-sha; rm -rf', CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur })
    assert.equal(r.status, 0)
    assert.equal(JSON.parse(readFileSync(saida, 'utf8')).commitFonte, 'local')
    assert.match(r.stdout, /SKILLS_SHA ignorado/)
  })

  test('exit 2: SKILLS_DIR ausente, inexistente ou arquivo; nada é escrito', () => {
    const { saida, cur, raiz } = cenario()
    assert.equal(rodar({ CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 2)
    assert.equal(rodar({ SKILLS_DIR: join(raiz, 'nao-existe'), CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 2)
    assert.equal(rodar({ SKILLS_DIR: cur, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 2)
    assert.equal(existsSync(saida), false)
  })

  test('exit 3: Curadoria ausente, JSON quebrado ou inválida; nada é escrito', () => {
    const { raiz, saida, cur } = cenario()
    writeFileSync(cur, '{quebrado')
    assert.equal(rodar({ SKILLS_DIR: raiz, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 3)
    writeFileSync(cur, JSON.stringify({ destaques: { '01-a': 'boa' } }))
    const r = rodar({ SKILLS_DIR: raiz, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur })
    assert.equal(r.status, 3)
    assert.match(r.stderr, /destaques\.01-a/)
    assert.equal(rodar({ SKILLS_DIR: raiz, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: join(raiz, 'nao-existe.json') }).status, 3)
    assert.equal(existsSync(saida), false)
  })

  test('pasta de Skill ilegível: exit 0, a Skill vai para rejeitadas (nunca exit 1)', (t) => {
    if (raizRoot) return t.skip('root ignora chmod')
    const { raiz, saida, cur } = cenario()
    skill(raiz, '01-a', 'trancada', fm('t', 'T.'))
    comTrava(join(raiz, '01-a', 'trancada'), () => {
      const r = rodar({ SKILLS_DIR: raiz, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur })
      assert.equal(r.status, 0, r.stderr)
      const c = JSON.parse(readFileSync(saida, 'utf8')) as Catalogo
      assert.ok(c.rejeitadas.some((x) => x.caminho === '01-a/trancada' && x.motivo === 'erro de leitura (EACCES)'))
      assert.match(r.stdout, /rejeitada: 01-a\/trancada — erro de leitura \(EACCES\)/)
    })
  })

  test('exit 4: zero categorias', () => {
    const { saida, cur } = cenario()
    const vazio = novoDir()
    escrever(vazio, 'README.md', 'x')
    assert.equal(rodar({ SKILLS_DIR: vazio, CATALOGO_SAIDA: saida, CATALOGO_CURADORIA: cur }).status, 4)
    assert.equal(existsSync(saida), false)
  })

  test('curadoria.json do repositório é válida', () => {
    const real = JSON.parse(readFileSync(resolve(import.meta.dirname, '../curadoria.json'), 'utf8'))
    const c = validarCuradoria(real)
    assert.equal(Object.keys(c.categorias).length, 6)
    for (const lista of Object.values(c.destaques)) assert.equal(lista.length, 4)
  })
})
