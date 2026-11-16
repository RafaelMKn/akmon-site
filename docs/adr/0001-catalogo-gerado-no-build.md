# 0001 — Catálogo gerado no build, sem backend em runtime

Status: aceito (16/11/2026)

## Contexto

O site precisa refletir cada Skill nova do skills-library sem edição manual. Rafael aceitou até ~2 min de atraso após o push e escolheu GitHub Pages como hospedagem.

## Decisão

O Catálogo é gerado por um script no build do site, disparado por `repository_dispatch` a cada push em `main` do skills-library. O site publicado é estático; não há servidor, banco nem consulta à API do GitHub pelo navegador.

## Alternativas descartadas

- **Backend com webhook** (segundos de atraso): exige servidor permanente e manutenção, para ganhar ~2 min que não foram pedidos.
- **Navegador consulta a API do GitHub a cada visita**: limite de 60 req/h por IP sem token e 180+ leituras de SKILL.md por visita.
- **Agendamento periódico**: cron do GitHub Actions atrasa com frequência; não garante os ~2 min.

## Consequências

- Depende de um token fine-grained no skills-library, que expira e precisa ser renovado.
- Se o build falhar, o site continua na última versão publicada.
- Se um dia o requisito virar segundos ou conteúdo por usuário, esta decisão é reaberta.
