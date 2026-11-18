import snapshot from '../data/pastasRepositorio.json'
import { TreeView, type TreeNode } from './ui/animated-tree-view'

const github = 'https://github.com/RafaelMKn/skills-library'

function montarArvore(arquivos: string[]): TreeNode[] {
  const filhosRaiz: TreeNode[] = []
  const pastas = new Map<string, TreeNode[]>([['', filhosRaiz]])
  const url = `${github}/blob/${snapshot.revisao}`

  for (const arquivo of arquivos) {
    const segmentos = arquivo.split('/')
    const nome = segmentos.pop() ?? arquivo
    let caminho = ''
    let filhos = filhosRaiz

    for (const pasta of segmentos) {
      caminho = caminho ? `${caminho}/${pasta}` : pasta
      let proximos = pastas.get(caminho)
      if (!proximos) {
        proximos = []
        pastas.set(caminho, proximos)
        filhos.push({ id: caminho, name: pasta, children: proximos })
      }
      filhos = proximos
    }

    const path = arquivo.split('/').map(encodeURIComponent).join('/')
    filhos.push({ id: arquivo, name: nome, href: `${url}/${path}` })
  }

  for (const filhos of pastas.values()) {
    filhos.sort((a, b) =>
      Number(Boolean(b.children)) - Number(Boolean(a.children)) || a.name.localeCompare(b.name, 'pt-BR'),
    )
  }

  return [{ id: '', name: 'skills-library', children: filhosRaiz }]
}

const arvore = montarArvore(snapshot.arquivos)

export default function ArvoreRepositorio() {
  return <TreeView data={arvore} defaultExpandedIds={['']} />
}
