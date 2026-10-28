# Akmon: 3 identidades para escolher

Pedido (Rafael, 28/10/2026): 3 exemplos de identidade visual para o repositório e a landing do Akmon,
com a versão ASCII do ferreiro de `docs/` como herói. Entrega em boards lado a lado; ele escolhe uma
e só depois ela é aplicada (README, landing real, DESIGN.md).

Fontes de verdade: `PRODUCT.md` (raiz) e `docs/identidade-akmon.md`.

## Verdade do produto (não negociável em nenhuma variante)

- Nome: **Akmon** (grego ákmōn, "bigorna"). Grafia exata: Akmon. Nunca "Master Skills Library".
- O que é: biblioteca curada de Agent Skills (pastas com SKILL.md) para harnesses de IA. Harnesses
  citados no README, todos com o mesmo peso: Claude Code, Codex, Google Antigravity, OpenClaw, Hermes.
- Repositório: https://github.com/RafaelMKn/skills-library
- Categorias reais (nome e pasta exatos):
  - 01 Automação de Processos & n8n / Make — `01-automacao-n8n-make/` (ex.: make-manager, n8n-agents, n8n-code-javascript, n8n-flow-builder)
  - 02 Design, UI Motion, 3D Web, Vídeo & Criativos — `02-design-ui-motion-3d/` (ex.: ascii-video, architecture-diagram, ad-creative)
  - 03 Agentes Autônomos & Engenharia de Prompt — `03-agentes-ia-prompts/` (ex.: auditoria-trabalho-de-agente, eval-set-agentes, create-subagent)
  - 04 APIs, Backend & Banco de Dados — `04-backend-apis-banco/` (ex.: airtable, clickup-api, fastify-best-practices)
  - 05 Ferramental de Desenvolvimento, CLI & Harness — `05-dev-harness-cli/` (ex.: agent-session-handoff, blocked-page-recovery)
  - 06 Produtividade, Pesquisa, Documentos & Mídia — `06-produtividade-pesquisa-docs/` (ex.: arxiv, competitor-news-monitor)
- Os números 01–06 são o nome real das pastas: podem aparecer como identificador da categoria.
- Contagem de skills: **não fixar número**. README diz 136, disco tem 174 (não reconciliado). Se a
  composição precisar de número, rotular como "exemplo — contagem em revisão".
- Instalação real (copiar exato):
  - Claude Code: `ln -s "$(pwd)/01-automacao-n8n-make/n8n-flow-builder" ~/.claude/skills/n8n-flow-builder`
  - Antigravity e Codex: apontar via `.agents/skills/`
  - Hermes e OpenClaw: copiar ou apontar para `~/.hermes/skills/<categoria>/<skill>/`
- Proibido inventar: depoimentos, estrelas, downloads, clientes, logos de empresas, benchmarks,
  preço, domínio próprio, pacote npm. Exemplo ilustrativo leva o rótulo "exemplo fictício".
- Sem a palavra FluxMind na landing (o Akmon é público e agnóstico). "Forjado em operação real" pode.
- Língua da landing: português do Brasil. Nomes de skill e comandos ficam como estão.

## Compromissos de marca fixados pelo Rafael (valem para as 3)

- Herói: Hefesto/ferreiro martelando. Nas landings, o herói é a **versão ASCII** já gerada:
  - `docs/ascii/akmon-ferreiro.txt` (96×72, charAspect 0.5) e `docs/ascii/akmon-ferreiro-github.txt` (96×60, charAspect 0.42)
  - `docs/ascii/ferreiro.html`: conversão ao vivo com asciify-engine@4.32.8 (referência de uso do engine)
  - Fonte: `docs/Ferreiro Forjando uma Lâmina no Anvil.png` (silhueta preta em fundo branco, faíscas à esquerda da bigorna)
- Tipografia: fonte **quadrada e impactante** para títulos e logotipo. Família com licença aberta
  (OFL, Google Fonts ou equivalente, citar a licença no board).
- Paleta: **vermelho-laranja de metal em brasa** + **preto**; off-white opcional. Cada variante
  decide os hex e prova o contraste calculado em JS.

## Cena de uso

Dev ou operador de agentes, no meio do trabalho, chega por um link do GitHub ou de um post. Tela de
notebook ou celular, normalmente com editor e terminal escuros abertos. Quer saber em segundos: o que
é, se tem skill para o que precisa e como instalar no harness dele.

## Rut evitado

A página que essa categoria sempre entrega: fundo quase preto com um neon, cards iguais de
ícone+título+texto, número grande de "skills" no topo, mono como fantasia. E a leitura literal do
nome (brasa, chamas, textura de metal em gradiente). As três direções abaixo partem de outros objetos
do mundo do público.

## As 3 direções

### A — Catálogo de Ferramentaria
- Tese: o Akmon é um catálogo industrial de ferramentas; cada skill é uma peça com código, placa de
  especificação e instrução de montagem. Recusa o grid de cards de marketing.
- Mundo: folha de catálogo técnico (estilo catálogo de ferramentaria/McMaster), off-white de papel
  de catálogo, preto de tinta, vermelho-laranja como cor de marcação (código de peça, seleção,
  etiqueta "em estoque"). Plaquetas metálicas gravadas, régua milimetrada, cotas.
- Tipo: grotesca quadrada condensada ou estêncil industrial para títulos e marca; texto corrido sóbrio.
- Assinatura de movimento: ao escolher uma categoria, o "trilho de abas" desliza e a folha troca em
  2 quadros secos (sem easing), como página de catálogo indexada.
- Primeira dobra: página de catálogo — marca Akmon com código de catálogo, o ferreiro ASCII
  impresso como gravura técnica com cotas, índice das 6 categorias como abas laterais com altura
  proporcional, e o comando de instalação como "instrução de montagem" copiável.
- Elevação recebida (do manual de acetato com abas): trilho de abas na lateral, uma aba por categoria,
  altura proporcional ao volume — navegação que mostra a extensão do acervo.
- Risco honesto: pode parecer frio/B2B demais para quem chega por um post.

### B — BBS da Forja
- Tese: o Akmon é um BBS de madrugada — tela de texto, menu numerado, quem conectou é dono da noite.
  Fala a língua nativa do público (terminal). Recusa o "dark mode com neon".
- Mundo: grade de caracteres 80×25 em preto de terminal; a paleta ANSI de 16 cores é traduzida para
  o compromisso de marca — vermelho-laranja (brasa), um laranja mais claro (faísca), off-white,
  cinza de fósforo apagado. Molduras com box-drawing (╔═╗), blocos ░▒▓█.
- Tipo: fonte de grade (mono de terminal/CP437 com licença aberta) para tudo da tela; marca em
  letreiro ANSI de blocos quadrados.
- Assinatura de movimento: a tela de abertura "chega" linha a linha em velocidade de modem, o
  ferreiro ASCII escorrendo de cima para baixo; `prefers-reduced-motion` mostra tudo de uma vez.
- Primeira dobra: tela de título ANSI com o ferreiro, letreiro AKMON em blocos, menu numerado
  [1]–[6] = categorias reais, [I] instalar, operação completa por teclado.
- Elevação recebida (da gramática BBS, aplicada à verdade do produto): a geometria única é a célula
  de caractere; nada fora da grade.
- Risco honesto: nostalgia pode soar como fantasia de "retrô"; legibilidade no celular exige reflow
  da grade.

### C — Livro Aparafusado
- Tese: o Akmon é um manifesto de oficina em tipografia de madeira — cada skill uma palavra batida
  na bigorna. Recusa a landing calma e simétrica.
- Mundo: papel off-white cru como fundo, preto de tinta de tipo de madeira, um único vermelho-laranja
  mecânico para a palavra sob pressão; dois parafusos de alumínio sempre visíveis prendendo a página.
  Composições a 15–45° da horizontal; onomatopeias de martelada (TANG, KLANG) escaladas por volume.
- Tipo: display quadrado e pesado, de tipo de madeira, em vários tamanhos numa mesma frase.
- Assinatura de movimento: a palavra pressionada "bate" maior dentro de um anel de choque impresso,
  em sincronia com a martelada do ferreiro ASCII.
- Primeira dobra: o ferreiro ASCII em diagonal, a marca AKMON batida em tipo de madeira, "skills
  forjadas para o seu harness" com o verbo em vermelho-laranja, CTA de instalação claro e visível.
- Risco honesto: ruído pode esconder a oferta; o CTA e a ordem de leitura precisam vencer a colisão.

### Desafiantes recusados (registro)
- Câmara escura com luz âmbar — recusado: âmbar disputa com o vermelho-laranja fixado. Disciplina
  herdada por A: estados irreversíveis bem marcados (copiado ≠ não copiado).
- Coluna de tensegridade — recusado: metáfora de forças não fala com o público. Disciplina herdada
  por A: anotações presas por linhas-guia (as cotas da gravura).
- Colcha de memória — recusado: material doméstico, sem relação com ferramenta. Disciplina herdada
  por C: toda legenda costurada ao seu bloco (proveniência visível de cada skill: pasta real).

Seed do sorteio: e5ea4bb6 (direction, persuade). A = direção sorteada; B e C = desafiantes
competitivos fundidos ao produto.

## Esqueleto obrigatório de cada board (`design_system/identidades/<a|b|c>/index.html`)

1. Abertura + tese (uma frase, nada de kicker/eyebrow).
2. Marca: wordmark Akmon + símbolo em SVG autoral + favicon (SVG).
3. Paleta com hex e contraste WCAG **calculado em JS no próprio board** (nunca digitado).
4. Tipografia: família(s), licença, escala, exemplo com texto real.
5. Forma e movimento: o momento-assinatura com botão "repetir" e `prefers-reduced-motion`.
6. Componentes com estados: botão (normal/hover/foco/desabilitado), comando de instalação copiável
   (copiar → copiado → falha), item de skill, item de categoria (normal/selecionada/vazia).
7. Landing em moldura 1440 (em escala) e 390 — primeira dobra completa + uma seção de categorias +
   instalação + rodapé.
8. Riscos.
- Parâmetro `?frame=<nome>` renderiza só aquele frame em tamanho real. Frames obrigatórios:
  `landing-desktop` (1440 de largura), `landing-mobile` (390), `marca`, `paleta`.
- HTML/CSS estático, sem build. JS só onde precisa. Fontes por Google Fonts (link) ou self-host.
- O ferreiro ASCII: ler de `../../../docs/ascii/akmon-ferreiro*.txt` (fetch) ou embutir o texto; ou
  rodar asciify-engine@4.32.8 por ESM (`https://esm.sh/asciify-engine@4.32.8`) sobre o PNG. Arte é
  decorativa: `aria-hidden` + texto alternativo no contêiner.
