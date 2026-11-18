# Akmon: decisões de identidade

Registro das decisões tomadas em 28/10/2026. Ainda não é o guia de marca final.

## Nome

- Nome escolhido: **Akmon**.
- Origem: grego *ákmōn*, "bigorna". Remete à forja, sem repetir Hermes nem colidir com o Alethe.
- Substitui o nome provisório "Master Skills Library" (README atual do repositório).
- Pendente: checagem de conflito em GitHub, npm e domínios (não feita).

## Herói

- Hefesto martelando numa forja em gravura ASCII (93 colunas × 70 linhas, `docs/ascii/ferreiro.html`), cotada como desenho técnico na Identidade A.
- **Fagulhas** é a animação padrão do topo da página. Ao rolar, os caracteres se soltam da gravura, sobem e se espalham. Ao voltar ao topo, a gravura se recompõe. Com movimento reduzido, a gravura fica estática.

## Direção escolhida: Identidade A — Catálogo de Ferramentaria

- Escolhida em 28/10/2026: **Identidade A · Catálogo de Ferramentaria** (`design_system/identidades/a/index.html`).
- Arquétipo: catálogo técnico industrial (McMaster-Carr + Teenage Engineering).
- Tipografia (SIL OFL 1.1, self-host em `design_system/identidades/a/fonts/`):
  - Marca e códigos de peça: **Big Shoulders Stencil Display** (800, caixa-alta)
  - Títulos: **Big Shoulders Display** (700/800, caixa-alta)
  - Texto corrido: **Barlow** (400/500/600)
  - Código e caminhos: **JetBrains Mono** (400/600)
- Paleta:
  - `--papel`: `#F3F0E8` (folha de catálogo)
  - `--papel-2`: `#E4E0D4` (aba, placa, régua)
  - `--mesa`: `#CFCABB` (bancada)
  - `--tinta`: `#16140F` (tinta principal)
  - `--tinta-2`: `#4A463C` (texto secundário)
  - `--aco`: `#7A7769` (linhas, réguas, rebites)
  - `--aco-claro`: `#B9B5A7` (texto secundário sobre tinta)
  - `--brasa`: `#B8340A` (marcação sobre papel)
  - `--brasa-viva`: `#FF5A1F` (marcação sobre tinta)
- Movimento-assinatura: troca de folha em 2 quadros secos (`90ms steps(2, jump-none)`), sem easing.

## Próximos passos

1. Checar conflito de nome (GitHub, npm, domínio).
2. Consolidar `DESIGN.md` na raiz a partir da Identidade A.
3. Promover a landing da Identidade A para publicação no GitHub Pages e atualizar o `README.md` com o nome Akmon e a nova identidade.
