export type Peca = { skill: string; desc: string }
export type Categoria = {
  id: string
  nome: string
  curto: string
  pasta: string
  n: number
  pecas: Peca[]
}
