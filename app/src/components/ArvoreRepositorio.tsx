import { catalogo } from '../data/catalogo'
import type { CatalogoSkill } from '../data/catalogo-types'
import { TreeView, type TreeNode } from './ui/animated-tree-view'

function noDaSkill(pasta: string, skill: CatalogoSkill): TreeNode {
  return {
    id: `${pasta}/${skill.slug}`,
    name: skill.slug,
    content: (
      <div className="px-3 pt-2 pb-3 font-texto text-base sm:px-4">
        <p className="mb-1.5 break-words text-papel">{skill.resumo}</p>
        <a href={skill.url} target="_blank" rel="noopener noreferrer"
          className="inline-block rounded-sm text-sm font-semibold text-brasa-viva underline underline-offset-4 focus-visible:outline-brasa-viva">
          Abrir no GitHub
          <span className="sr-only"> · {skill.slug} (nova aba)</span>
        </a>
      </div>
    ),
  }
}

const arvore: TreeNode[] = [{
  id: 'skills-library',
  name: 'skills-library',
  children: catalogo.categorias.map((categoria) => ({
    id: categoria.pasta,
    name: categoria.pasta,
    children: categoria.skills.filter((skill) => skill.destaque).map((skill) => noDaSkill(categoria.pasta, skill)),
    moreChildren: categoria.skills.filter((skill) => !skill.destaque).map((skill) => noDaSkill(categoria.pasta, skill)),
  })),
}]

export default function ArvoreRepositorio() {
  if (catalogo.categorias.length === 0) {
    return <p className="px-2 py-2">O catálogo de skills ainda não foi gerado.</p>
  }

  return <TreeView data={arvore} defaultExpandedIds={['skills-library']} />
}
