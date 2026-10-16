# Tarefas

- [x] T-001: registrar escopo aprovado (RF-001 a RF-003; CA-001 a CA-003).
- [x] T-002: atualizar título, imagem e campo público (RF-001 a RF-003; CA-001 a CA-003).
- [x] T-003: executar testes do formulário e TypeScript, registrar resultados (RNF-001; CA-001 a CA-003).

## Validação em 2026-10-12

- 21 testes aprovados nos dois arquivos do formulário/página pública; cobrem texto, imagem, ausência do campo e regressões de validação/envio.
- TypeScript aprovado com `tsc --noEmit --incremental false`.
- SHA-256 confirma que a foto copiada é idêntica à original enviada. Proporção 4:3 e object-contain preservam o enquadramento.
- `git diff --check` sem erros.
- Primeira tentativa de testes bloqueada por EPERM no cache temporário do sandbox; repetição fora do isolamento aprovada.
- Publicação e inspeção visual em produção não executadas nesta revisão.

## Revisão do enquadramento — 2026-10-12

- [x] T-004 (RF-002 / CA-002): recorte responsivo somente na exibição, semelhante à primeira versão, sem editar a foto ou retocar rostos.
- Revalidação: 21 testes relevantes aprovados e TypeScript sem erros. Arquivo original preservado. Publicação não executada.

## Pergunta unificada

- [x] T-005 (RF-004 / CA-004): substituir as duas perguntas por uma única, reutilizando afapanStory e preservando dados existentes.
- Validação: 22 testes relevantes aprovados nos dois arquivos do formulário/página e TypeScript sem erros. Nenhuma migração ou publicação executada.

## Retirada do endereço explícito na gestão

- [x] T-006 (RF-005 / CA-005): remover bloco de link explícito, preservar Copiar link e mensagens acessíveis, corrigir orientação em falha. Validação: 10 testes da gestão aprovados e TypeScript sem erros. Sem banco ou publicação.

- [x] T-007 (RF-006 / CA-006): adicionar tooltip do link público por hover/foco, com fechamento por Escape. Validação: 11 testes da gestão aprovados e TypeScript sem erros. ResizeObserver simulado apenas nos testes para o posicionamento Radix em jsdom. Sem banco ou publicação.
