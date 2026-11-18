import { Secao } from '../Secao'
import { V2Conversa } from './ab/V2Conversa'
import { TextoAcessivel } from './partes'

/** Demo única: a conversa (ab2) aprovada. Query string `?demo=` é ignorada. */
export function Demonstracao() {
  return (
    <Secao id="demonstracao" titulo="Mesmo prompt. Outro resultado." tituloId="h-demo">
      <div aria-live="off" data-demo="ab2">
        <TextoAcessivel />
        <V2Conversa />
      </div>
    </Secao>
  )
}
