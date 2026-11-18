import { lazy, Suspense } from 'react'
import { Secao } from './Secao'

const ArvoreRepositorio = lazy(() => import('./ArvoreRepositorio'))

export function ArquiteturaRepositorio() {
  return (
    <Secao id="repositorio" titulo="Estrutura do repositório" tituloId="h-repositorio"
      texto="Expanda as pastas para explorar as categorias e abra os arquivos no GitHub.">
      <div className="mx-auto max-w-[768px] border border-aco bg-forja px-2 py-3 text-papel sm:px-4">
        <Suspense fallback={<p role="status" className="px-2 py-2">Carregando a estrutura do repositório…</p>}>
          <ArvoreRepositorio />
        </Suspense>
      </div>
    </Secao>
  )
}
