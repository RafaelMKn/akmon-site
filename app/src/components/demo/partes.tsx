import { demo, promptDaDemo, rotulosDaDemo } from '../../data/demoCaptura'

/** Conteúdo final completo para leitores de tela; os quadros animados ficam aria-hidden. */
export function TextoAcessivel() {
  return (
    <div className="sr-only">
      <p>{promptDaDemo}</p>
      {demo.execucoes.map((e) => (
        <div key={e.id}>
          <p>{rotulosDaDemo[e.id]}. Skill: {e.skill ?? 'nenhuma'}.</p>
          <p>Ferramentas: {e.passos.map((p) => `${p.ferramenta} ${p.argumento}`).join('; ')}.</p>
          <p>Resposta final: {e.resumo}</p>
        </div>
      ))}
    </div>
  )
}
