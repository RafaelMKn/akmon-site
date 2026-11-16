// Contrato do Catálogo gerado (docs/catalogo-automatico.md). Não adicionar campos fora dele.
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

export type CatalogoRejeitada = { caminho: string; motivo: string }

export type Catalogo = {
  geradoEm: string // ISO 8601
  commitFonte: string // SHA do skills-library ou "local"
  categorias: CatalogoCategoria[] // ordenadas por id
  rejeitadas: CatalogoRejeitada[]
}
