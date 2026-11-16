// Contratos do Catálogo gerado (scripts/catalogo.ts) e da Curadoria (app/curadoria.json).
// Spec: docs/catalogo-automatico.md, seção "Contratos".

export type Curadoria = {
  categorias: Record<string /* pasta */, { nome?: string; curto?: string }>
  destaques: Record<string /* pasta */, string[] /* slugs, em ordem */>
  resumos: Record<string /* "<pasta>/<slug>" */, string>
}

export type CatalogoSkill = {
  slug: string
  resumo: string
  destaque: boolean
  url: string
}

export type CatalogoCategoria = {
  id: string // prefixo numérico: "05"
  pasta: string // "05-dev-harness-cli"
  nome: string // Curadoria ou humanizado
  curto: string // Curadoria ou = nome
  total: number // nº de Skills válidas
  skills: CatalogoSkill[]
}

export type Rejeitada = { caminho: string; motivo: string }

export type Catalogo = {
  geradoEm: string // ISO 8601
  commitFonte: string // SHA do skills-library ou "local"
  categorias: CatalogoCategoria[] // ordenadas por id
  rejeitadas: Rejeitada[]
}
