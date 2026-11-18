import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Estado = 'idle' | 'ok' | 'erro'

const PROMPT = `Leia o documento abaixo e siga o que está nele, fase por fase, na ordem:
https://raw.githubusercontent.com/RafaelMKn/skills-library/main/05-dev-harness-cli/akmon/references/adaptar-ao-usuario.md

(Se o repositório Akmon-skills já estiver clonado nesta máquina, leia o arquivo local:
05-dev-harness-cli/akmon/references/adaptar-ao-usuario.md.)

Resumo do que você vai fazer: me entrevistar, uma pergunta por vez, para entender como eu trabalho;
propor quais skills da biblioteca fazem sentido para mim; perguntar onde instalar (.claude, .agents
ou outro); perguntar se quero o akmon rodando em toda requisição; e podar o akmon para citar só o
que eu instalei. Não instale nem edite nenhum arquivo sem a minha permissão explícita.
Se não conseguir abrir o link, me peça para colar o conteúdo do arquivo.`

export function Montagem() {
  const [estado, setEstado] = useState<Estado>('idle')
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(PROMPT)
      setEstado('ok')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setEstado('idle'), 2600)
    } catch {
      setEstado('erro')
    }
  }

  return (
    <div className="border border-tinta bg-tinta p-[18px] text-left text-papel" id="montagem" aria-labelledby="h-mont">
      <h2 id="h-mont" className="mb-3.5 font-titulo text-xl leading-none font-extrabold tracking-[.06em] uppercase">
        Instrução de montagem
      </h2>
      <div className="border border-tinta-2 bg-forja">
        <div className="flex items-center justify-between border-b border-tinta-2 py-1.5 pr-1.5 pl-3 font-mono text-[11px] leading-none font-semibold tracking-[.1em] text-aco-claro uppercase">
          <span>Prompt para o seu agente</span>
          <button
            type="button"
            onClick={copiar}
            className={
              'inline-flex cursor-pointer items-center gap-1.5 border-0 px-3 py-2 font-titulo text-[13px] leading-none font-bold tracking-[.08em] uppercase ' +
              (estado === 'ok'
                ? 'bg-papel text-tinta'
                : estado === 'erro'
                  ? 'bg-transparent text-brasa-viva outline outline-1 outline-brasa-viva'
                  : 'bg-brasa-viva text-tinta')
            }
          >
            <Icon name={estado === 'ok' ? 'check' : estado === 'erro' ? 'x' : 'copy'} />
            <span>{estado === 'ok' ? 'Copiado' : estado === 'erro' ? 'Falhou' : 'Copiar'}</span>
          </button>
        </div>
        <pre tabIndex={0} aria-label="Prompt de montagem" className="m-0 px-3 py-3.5 font-mono text-[13px] leading-[1.6] break-words whitespace-pre-wrap text-papel">
          {PROMPT}
        </pre>
        <p role="status" aria-live="polite" className="m-0 px-3 text-[13px] text-aco-claro empty:p-0 not-empty:pb-2.5">
          {estado === 'ok' && 'Prompt copiado. Cole no seu agente.'}
          {estado === 'erro' && 'O navegador bloqueou a cópia. Selecione o texto do prompt e copie na mão.'}
        </p>
      </div>
    </div>
  )
}
