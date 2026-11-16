# Decisões — animação do herói ASCII no hover

Status: escopo confirmado em grill (29/10/2026). Implementado em app/src/components/ArtAnim.tsx; verificado no navegador (hover, saída, toque, reduced-motion), escolha da variação final pendente.

## Fatos verificados (leitura do repo, 29/10/2026)

- Herói: `app/src/components/Hero.tsx`, `<figure class="art">` com dois `<pre>`: `.corpo` (Hefesto, 93×70, `mix-blend-mode: difference`) e `.faisca` (faíscas, `position:absolute`, cor `--color-brasa-viva`), mesmo grid de caracteres.
- CSS em `app/src/index.css` (bloco "gravura ASCII"). Texto vem de `art` e `spark` em `app/src/data/akmon.json`.
- Hoje não há nenhuma animação nem hover nessa figura. Stack: React 19 + Vite + Tailwind 4, sem lib de ASCII instalada.
- `app/` está não versionado (untracked) na branch `feat/site-react`.

## Decisões

| Q | Tema | Decisão |
|---|---|---|
| Q1 | O que anima | Três variações: martelada (faíscas voam da bigorna), brasa (ASCII acende em brasa varrendo de baixo p/ cima), cursor (caracteres perto do mouse tremem/trocam) |
| Q2 | Gatilho | Mouse sobre a gravura inteira (`figure.art`); anima enquanto está em cima, volta ao repouso ao sair |
| Q3 | Touch | Toque dispara a animação uma vez; nada automático |
| Q4 | prefers-reduced-motion | Sem animação, gravura estática atual |
| Q5 | Técnica | CSS/JS próprio sobre os `<pre>` existentes; sem dependência nova, sem CDN |
| Q6 | Comparação | Parâmetro de URL `?anim=martelada \| brasa \| cursor`; só para escolher, depois uma fica e as outras são descartadas |
| Q7 | Padrão | Sem parâmetro = estático até Rafael escolher |
| Q8 | Fidelidade | Arte base (`akmon.json`, 93×70) intocada; martelada e brasa mexem só em camada faísca/cor; cursor altera caracteres exibidos do corpo, sem mudar o `aria-label` |
| Q9 | Docs | Este arquivo; `CONTEXT.md` só se surgir termo novo |
| Q10 | Execução | Subagente implementa; agente principal revisa e verifica (build, lint, navegador). Sem commit/push sem pedido |

## Observação do agente (não decidido por Rafael)

- Em "martelada" o martelo não se move: o corpo é texto fixo e Q8 proíbe mexer nele. O efeito é de faíscas + clarão na bigorna. Se ele quiser o martelo descendo, precisa de quadros extras do corpo (reabre Q8).

## Pendências

- Escolher a variação final (remove as outras e o parâmetro `?anim`).

## Critério de pronto

- `npm run build` e `npm run lint` passam em `app/`.
- No navegador: sem parâmetro, nada anima; cada valor de `?anim` anima só no hover; ao sair volta ao repouso; toque dispara uma vez; com reduced-motion emulado, nada anima.
- `git diff` não toca `akmon.json` (arte base).
