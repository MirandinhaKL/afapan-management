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
