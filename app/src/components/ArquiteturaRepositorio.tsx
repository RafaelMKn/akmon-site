import { lazy, Suspense } from 'react'
import { Secao } from './Secao'

const ArvoreRepositorio = lazy(() => import('./ArvoreRepositorio'))

export function ArquiteturaRepositorio() {
  return (
    <Secao id="categorias" titulo="Catálogo de skills" tituloId="h-cats"
      texto="Abra uma categoria e selecione uma skill para ler o resumo.">
      <div className="mx-auto max-w-[768px] border border-aco bg-forja px-2 py-3 text-papel sm:px-4">
        <Suspense fallback={<p role="status" className="px-2 py-2">Carregando o catálogo…</p>}>
          <ArvoreRepositorio />
        </Suspense>
      </div>
    </Secao>
  )
}
