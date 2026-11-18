import bruto from './demo-captura.json'

export type Passo = {
  ferramenta: string
  argumento: string
  emS: number // segundos reais desde o envio do prompt
}

export type Execucao = {
  id: 'sem-akmon' | 'com-akmon'
  rotulo: string
  skill: string | null
  anuncio: string | null
  passos: Passo[]
  duracaoS: number // duração real total
  tokens: { entrada: number; saida: number }
  chamadasApi: number
  screenshot: string
  screenshotMobile: string
  resumo: string
}

export type DemoCaptura = {
  prompt: string
  harness: string
  modelo: string
  data: string
  execucoes: [Execucao, Execucao]
  diferencas: { criterio: string; sem: number; com: number; evidencia: string }[]
  catalogo: { slug: string; categoria: string }[]
  opcoesRoteador: string[] // skills de design instaladas no catálogo; inclui a escolhida
}

export const demo = bruto as DemoCaptura
export const [semAkmon, comAkmon] = demo.execucoes
export const promptDaDemo = 'Crie a seção hero de uma landing page para um app de agendamento online para clínicas odontológicas.'
export const rotulosDaDemo: Record<Execucao['id'], string> = {
  'sem-akmon': 'Sua IA sem Akmon',
  'com-akmon': 'Sua IA + Akmon',
}

/** Caminhos do JSON ("/demo/x.png") são relativos à raiz do site; resolve contra a base do Vite (ex.: /akmon-site/). */
export const urlPublica = (caminho: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${caminho.replace(/^\//, '')}`

export function linhaSkill(e: Execucao) {
  if (e.anuncio) return e.anuncio
  if (e.skill) return `Skill: ${e.skill}`
  return null
}
