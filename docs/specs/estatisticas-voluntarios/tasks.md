# Tarefas — Cards estatísticos de voluntários

Data: 2026-10-15. Especificação aprovada. Plano e implementação local aprovados; T-001 a T-005 concluídas localmente.

- [x] **T-001 — Contrato e consultas de contagem** (RF-001, RF-002; RNF-001, RNF-003; CA-001, CA-002, CA-003, CA-006).
  - Definir retorno tipado e ano atual em America/Sao_Paulo.
  - Contar ativos, aguardando e início no ano, sem arquivados, filtros ou paginação; head/exact, sessão e falhas validadas.
  - Criar testes de início versus criação, null/parcial, fuso/virada e ausência de limite de linhas.
- [x] **T-002 — Cards e estados independentes** (RF-001, RF-004, RF-005; RNF-002; CA-005, CA-006).
  - Criar três cards responsivos com títulos, ícones e descrições aprovadas.
  - Skeleton, zero confirmado, erro e repetição por teclado; proteção a respostas antigas.
- [x] **T-003 — Integrar atualizações na gestão** (RF-002, RF-003, RF-005; CA-003, CA-004, CA-005).
  - Inserir cards no topo sem acoplar filtros/página ao carregamento.
  - Recarregar após mutações bem-sucedidas, sem mascarar sucesso se estatísticas falharem; preservar demais fluxos e testes existentes.
- [x] **T-004 — Atualização do ano e acessibilidade** (RF-001, RF-003; RNF-002, RNF-004; CA-002, CA-006, CA-007).
  - Detectar mudança de ano por timer/visibilidade, descartar resposta antiga e limpar recursos no unmount.
  - Testar fronteiras de ano, celular/computador, teclado e mensagens acessíveis.
- [x] **T-005 — Regressão e evidências locais** (RF-001 a RF-005; RNF-001 a RNF-004; CA-001 a CA-007).
  - Executar suíte relevante/completa, TypeScript e build; registrar validation.md e limitações de concorrência/permissões remotas.
  - Confirmar ausência de escritas, mudanças de política e regressão em filtros, exportação/cópia e operações administrativas.
- [ ] **T-006 — Publicação e validação remota após autorização** (RNF-001, RNF-004; CA-001 a CA-007).
  - Conferir contagens reais com conta autorizada e critérios anuais/exclusão de arquivados, sem expor dados pessoais.
  - Publicar somente após autorização específica; não há migração prevista.

Dependências: aprovação do plano → T-001 → T-002 → T-003 → T-004 → T-005. T-006 exige autorização separada e validações locais aprovadas.

Evidências: validation.md. 171 testes, TypeScript e build aprovados; visual móvel/computador conferido com valores fictícios. Sem publicação ou consulta remota nesta implementação.
