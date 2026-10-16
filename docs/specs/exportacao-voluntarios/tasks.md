# Tarefas — Exportação de voluntários

Data: 2026-10-15. Especificação aprovada; plano aprovado e tarefas locais executadas.

- [x] **T-001 — Contrato comum e prova dos recursos de PDF** (RF-003 a RF-007, RF-009; RNF-005; CA-003 a CA-006, CA-009).
  - Definir campos e normalização preservando ausência e valores históricos.
  - Inspecionar marca local e provar fontes/Unicode/emojis, licença e paginação básica em artefato fictício. Resolver limitações antes de avançar no gerador.
- [x] **T-002 — Consulta integral dos não arquivados** (RF-001, RF-002; RNF-001, RNF-003; CA-001, CA-002, CA-008).
  - Implementar consulta dedicada com sessão, RLS, cursor, lotes e manifesto final; sem filtros da tela nem escrita.
  - Cobrir limites do servidor, relações ausentes, duplicatas, falha e alteração concorrente. Confirmar atualização de versão nos fluxos existentes.
- [x] **T-003 — CSV seguro e completo** (RF-003 a RF-007; RNF-002; CA-003 a CA-006).
  - Implementar serialização e proteção textual, testar importação de telefone/zeros e prevenção de fórmulas, sem truncamento de relatos.
- [x] **T-004 — PDF institucional por voluntário** (RF-003 a RF-007, RF-009; RNF-005; CA-003 a CA-006, CA-009).
  - Implementar layout com marca, seções, uma ficha por página quando couber, continuação identificada e rodapé.
  - Gerar e renderizar PDFs fictícios; inspecionar texto e imagens, corrigir cortes/Unicode/legibilidade e registrar evidências.
- [x] **T-005 — Ações na gestão interna** (RF-001, RF-002, RF-008; RNF-001, RNF-004; CA-001, CA-002, CA-007).
  - Integrar formatos com mesma coleta, trava, progresso acessível, vazio e erro, sem depender da página ou filtro.
  - Testar teclado, cliques simultâneos, sessão e ausência de download parcial; informar quantidade e início do download.
- [x] **T-006 — Regressão e rastreabilidade** (RF-001 a RF-009; RNF-001 a RNF-005; CA-001 a CA-009).
  - Executar testes relevantes/completos, TypeScript e build; revisar permissões e ausência de escritas.
  - Registrar validation.md por critério, volume testado e limitações de concorrência/importação/ambiente. Não declarar validação remota sem evidências.
- [ ] **T-007 — Publicação e verificação remota após autorização específica** (RF-001 a RF-009; RNF-001, RNF-005; CA-001 a CA-009).
  - Conferir permissões reais e downloads com conta autorizada, isolamento anônimo, impressão e não arquivados.
  - Publicar somente após autorização e verificações locais; usar dados de teste autorizados e não persistir arquivos pessoais publicamente.

Ordem: T-001 → T-002 → T-003 → T-004 → T-005 → T-006. T-007 depende de autorização separada. Aprovação do plano precede qualquer implementação.

- [x] **T-008 — Alinhar botão à Compostagem** (RF-010, RF-008; CA-010, CA-007): botão compartilhado no cabeçalho com ícone e menu, trava e notificações preservadas. Testes de menu/teclado, CSV/PDF, erros e regressão da tela: 17 aprovados; TypeScript aprovado.

- [x] **T-009 — Remover seção administrativa do PDF** (RF-011; CA-011): omitir campos administrativos apenas na ficha PDF, preservando CSV e rodapé. Testes relevantes: 12 aprovados; TypeScript aprovado. PDF fictício real regenerado e renderizado; ausência dos campos conferida por extração e inspeção visual.

- [x] **T-010 — Remover oito colunas do CSV** (RF-012; CA-012): filtrar cabeçalho e valores sem alterar PDF ou banco. Criação preservada. Validação: 13 testes relevantes e TypeScript aprovados, com conferência de alinhamento entre colunas/linhas.
