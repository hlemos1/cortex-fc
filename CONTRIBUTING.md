# Guia de Contribuicao

Obrigado por contribuir com este projeto. Siga as diretrizes abaixo para manter a qualidade e consistencia do codigo.

## Nomenclatura de Branches

Utilize os seguintes prefixos ao criar branches:

- `feature/` — Nova funcionalidade (ex: `feature/filtro-de-busca`)
- `fix/` — Correcao de bug (ex: `fix/erro-login`)
- `docs/` — Alteracoes em documentacao (ex: `docs/atualizar-readme`)
- `refactor/` — Refatoracao sem mudanca de comportamento (ex: `refactor/extrair-servico`)

## Convencao de Commits

Seguimos o padrao [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — Nova funcionalidade
- `fix:` — Correcao de bug
- `docs:` — Alteracao em documentacao
- `chore:` — Tarefas de manutencao (deps, configs, CI)
- `refactor:` — Refatoracao de codigo
- `test:` — Adicao ou correcao de testes

Exemplo: `feat: adicionar endpoint de listagem de pedidos`

## Processo de Pull Request

1. Crie uma branch a partir de `main` seguindo a nomenclatura acima.
2. Implemente as alteracoes com commits atomicos e descritivos.
3. Rode os testes localmente antes de abrir o PR.
4. Abra o PR com titulo claro e descricao do que foi feito e por que.
5. Solicite revisao de pelo menos um membro da equipe.
6. Aguarde aprovacao antes de fazer merge.

## Checklist de Code Review

Antes de aprovar um PR, verifique:

- [ ] Testes passando (suite completa, zero falhas)
- [ ] Sem erros de lint
- [ ] Sem secrets ou credenciais no codigo
- [ ] Tipagem correta (sem `any` desnecessario em TypeScript)
- [ ] Sem codigo morto ou comentado
- [ ] Mudancas coerentes com o escopo do PR

## Setup de Desenvolvimento

Consulte o `README.md` do projeto para instrucoes de instalacao e configuracao do ambiente de desenvolvimento.
