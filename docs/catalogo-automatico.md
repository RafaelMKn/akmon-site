# Spec — Catálogo automático do site

Status: desenho fechado em grill com Rafael (16/11/2026). Implementação delegada; nada publicado ainda.
Termos: ver `CONTEXT.md` (Skill, Categoria, Catálogo, Destaque, Resumo, Curadoria).

## Objetivo

Toda Skill que entrar no `main` do skills-library aparece no site em até ~2 min, sem edição manual.

## Fatos verificados (16/11/2026)

- `app/src/data/akmon.json` é escrito à mão; contagens já divergem do disco (02: 31×32, 04: 13×14, 05: 60×64). 180 SKILL.md no disco.
- skills-library: público, `main`, sem CI, sem índice. 179 skills em `categoria/skill/SKILL.md`; 1 aninhada (`05-dev-harness-cli/last30days-skill/skills/last30days/SKILL.md`).
- `description` dos SKILL.md: EN/PT misturado, longa, voltada ao agente.
- akmon-site: privado; Pages não habilitado.

## Decisões

| Q | Tema | Decisão |
|---|---|---|
| Q1 | Fonte | `main` do skills-library no GitHub |
| Q2 | Latência | Até ~2 min após o push; site estático |
| Q3 | Exibição | Lista completa por Categoria + Destaques |
| Q4 | Exposição | Site público; revoga a restrição do README |
| Q5 | Hospedagem | GitHub Pages |
| Q6 | Texto | Resumo PT opcional; fallback = 1ª frase da `description`, truncada |
| Q7 | Curadoria | No repo do site (`app/curadoria.json`) |
| Q8 | Unidade | Pasta de 1º nível da Categoria com ≥1 SKILL.md em qualquer profundidade = 1 Skill |
| Q9 | Repo | akmon-site passa a público (após varredura de segredos) |
| Q10 | Frontmatter inválido | Publica sem a Skill; lista em `rejeitadas` e no resumo do job |
| Q11 | Categoria nova | Aparece automática, nome humanizado da pasta; nome bonito opcional na Curadoria |
| Q12 | Termo | "Skill" na UI; "peça" só em copy de marca |
| Q13 | Gatilho | Token fine-grained (Contents: write só no akmon-site — mínimo exigido por POST /dispatches) salvo como secret no skills-library |
| Q14 | Endereço | `https://rafaelmkn.github.io/akmon-site/` |
| Q15 | Ordem | Destaques na ordem da Curadoria; resto alfabético por slug |
| Q16 | Link | Cada Skill linka `github.com/RafaelMKn/skills-library/tree/main/<pasta>/<slug>` |

## Arquitetura

```
push main (skills-library, paths 0*/**)
  → workflow notify-site: repository_dispatch {event_type: "skills-updated", client_payload: {sha}} → akmon-site
akmon-site workflow deploy (gatilhos: repository_dispatch skills-updated, push em main, workflow_dispatch)
  → checkout akmon-site + checkout skills-library@main
  → npm ci && SKILLS_DIR=<checkout> npm run catalogo  (gera app/src/data/catalogo.json)
  → npm run build (base /akmon-site/)  → deploy GitHub Pages
```

Sem servidor em runtime (ver `docs/adr/0001-catalogo-gerado-no-build.md`).

## Contratos

### Comando
`npm run catalogo` em `app/`. Entrada: env `SKILLS_DIR` (obrigatório, raiz do skills-library) e `SKILLS_SHA` (opcional). Saída: `app/src/data/catalogo.json`. Exit 0 mesmo com rejeitadas; exit ≠0 só se `SKILLS_DIR` inválido, Curadoria inválida ou zero Categorias.

### `app/curadoria.json`
```ts
type Curadoria = {
  categorias: Record<string /* pasta */, { nome?: string; curto?: string }>
  destaques: Record<string /* pasta */, string[] /* slugs, em ordem */>
  resumos: Record<string /* "<pasta>/<slug>" */, string>
}
```
Destaque ou resumo apontando para Skill inexistente: aviso no resumo do job, não falha.

### `app/src/data/catalogo.json`
```ts
type Catalogo = {
  geradoEm: string        // ISO 8601
  commitFonte: string     // SHA do skills-library ou "local"
  categorias: {
    id: string            // prefixo numérico: "05"
    pasta: string         // "05-dev-harness-cli"
    nome: string          // Curadoria ou humanizado
    curto: string         // Curadoria ou = nome
    total: number         // nº de Skills válidas
    skills: { slug: string; resumo: string; destaque: boolean; url: string }[]
  }[]                     // ordenadas por id
  rejeitadas: { caminho: string; motivo: string }[]
}
```
Regras:
- Categoria = pasta na raiz do skills-library com nome `^\d{2}-`.
- Skill válida = SKILL.md mais raso da pasta de 1º nível (em qualquer profundidade, sem limite; empate no mesmo nível → ordem alfabética do caminho) cujo frontmatter é YAML 1.2 válido (lib `yaml`; chaves duplicadas, aliases em excesso e sintaxe inválida são rejeitados) e tem `name` e `description` como **texto não vazio**. Outro tipo (lista, número, booleano, mapa), YAML inválido, frontmatter ausente, sem fechamento ou acima de 64 KB → `rejeitadas`, com o motivo (do parser, quando for o caso).
- Limite de leitura: só os primeiros **64 KB** de cada SKILL.md são lidos; o frontmatter tem que fechar dentro deles (corpo maior não importa). Frontmatter que não fecha nesse trecho → rejeitada com motivo "frontmatter acima de 64 KB".
- Erro de leitura (EACCES etc.) numa pasta de Skill → essa Skill vai para `rejeitadas` com "erro de leitura (<código>)"; na raiz de uma Categoria → aviso e Categoria com `total` 0. Exit codes continuam só 0, 2, 3 e 4 (SKILLS_DIR ilegível = 2).
- Prefixo numérico repetido (`07-a`, `07-b`): exit 0 com aviso. `id` continua sendo o prefixo; quem consome deve usar `pasta` como chave.
- Links simbólicos (pasta de Categoria ou de Skill, subpasta, ou SKILL.md) não são seguidos: são ignorados com aviso contendo o caminho. Pastas ocultas e `node_modules` são ignoradas.
- Resumo: Curadoria, senão 1ª frase da `description` (até `. `), truncada em 160 caracteres com `…`.
- `akmon.json` fica só com `art` e `spark`; `cats` sai.

## Critério de pronto

- Testes do gerador cobrem: skill aninhada (last30days) e profundidade ilimitada, frontmatter ausente/inválido (YAML real) e de tipo errado, `description` em bloco `>-`, categoria sem Curadoria, destaque inexistente, ordenação, erro de I/O, prefixo repetido, limite de 64 KB e links simbólicos.
- `npm run build` e `npm run lint` passam; site mostra 180 Skills (ou o total do `main` na hora) sem contagem manual.
- Avisos "contagem em revisão" removidos do site.
- Push de teste no skills-library → Skill visível em `rafaelmkn.github.io/akmon-site/` em ≤ ~2 min (medido por QA).

## Pendências do Rafael

- Criar token fine-grained (Contents: read/write, só repo akmon-site; guia: /home/rafalmuraro/OpenBot/Shared/akmon-pages-ativacao.md) e salvar como secret `AKMON_SITE_DISPATCH_TOKEN` no skills-library.
- Aprovar a mudança de visibilidade do akmon-site para público após o relatório de varredura de segredos.
