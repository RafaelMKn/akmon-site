import { Secao } from './Secao'

const LINHAS = [
  ['Claude Code', '~/.claude/skills/', 'Symlink da pasta da skill'],
  ['Google Antigravity', '.agents/skills/', 'Apontar a pasta'],
  ['Codex', '.agents/skills/', 'Apontar a pasta'],
  ['OpenClaw', '~/.hermes/skills/<categoria>/<skill>/', 'Copiar ou apontar'],
  ['Hermes', '~/.hermes/skills/<categoria>/<skill>/', 'Copiar ou apontar'],
]
const TH = 'border-b-2 border-tinta px-2.5 py-3 text-left font-mono text-[11px] leading-none font-semibold tracking-[.12em] text-tinta-2 uppercase'

export function Instalar() {
  return (
    <Secao id="instalar" num="§ 02" titulo="Onde cada harness lê as skills" tituloId="h-inst"
      texto="Uma pasta, vários harnesses. O que muda de um para outro é só o destino.">
      <div className="mx-auto max-w-[980px]">
        <table className="w-full border-collapse text-[15px]">
          <caption className="sr-only">Destino das skills por harness</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>Harness</th>
              <th scope="col" className={TH}>Destino das skills</th>
              <th scope="col" className={TH + ' max-[640px]:hidden'}>Como</th>
            </tr>
          </thead>
          <tbody>
            {LINHAS.map(([h, dest, como]) => (
              <tr key={h}>
                <th scope="row" className="border-b border-aco px-2.5 py-3 text-left align-baseline font-titulo text-[17px] leading-none font-extrabold tracking-[.04em] uppercase">{h}</th>
                <td className="border-b border-aco px-2.5 py-3 align-baseline font-mono text-[.86em] [overflow-wrap:anywhere]">{dest}</td>
                <td className="border-b border-aco px-2.5 py-3 align-baseline max-[640px]:hidden">{como}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-center">
          <a href="#montagem" className="inline-flex items-center gap-2 border-2 border-tinta bg-tinta px-[18px] py-[13px] font-titulo text-[15px] leading-none font-bold tracking-[.08em] text-papel uppercase no-underline hover:border-brasa hover:bg-brasa">
            Voltar à instrução de montagem
          </a>
        </p>
      </div>
    </Secao>
  )
}
