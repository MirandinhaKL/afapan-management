# Tarefas — CRUD de campanhas Eco Drive

- **Status:** Implementação local concluída; implantação pendente
- **Plano:** `./technical-plan.md`
- **Atualização:** 2026-09-22

- [x] **T-001 — Migração aditiva e auditoria** (`RF-001`–`RF-027`, `RNF-003`–`RNF-005`, `CA-001`, `CA-004`, `CA-010`, `CA-013`, `CA-016`)
- [x] **T-002 — RPCs transacionais e concorrência otimista** (`RF-002`, `RF-015`, `RF-034`, `CA-001`, `CA-004`, `CA-011`)
- [x] **T-003 — Domínio, validações e consultas paginadas** (`RF-007`–`RF-010`, `RNF-007`, `RNF-008`, `CA-006`, `CA-007`, `CA-012`, `CA-015`, `CA-017`, `CA-022`)
- [x] **T-004 — Formulário compartilhado de criação/edição** (`RF-001`, `RF-011`–`RF-017`, `CA-001`, `CA-003`–`CA-007`)
- [x] **T-005 — Detalhes, filtros, paginação e ações** (`RF-004`–`RF-010`, `RF-018`–`RF-024`, `CA-002`, `CA-008`–`CA-010`, `CA-014`, `CA-017`–`CA-019`, `CA-022`)
- [x] **T-006 — Relatórios PDF/CSV** (`RF-028`–`RF-031`, `CA-020`)
- [x] **T-007 — Testes unitários e verificação TypeScript** (`RNF-006`, todos os CAs aplicáveis)
- [x] **T-008 — Migração de endurecimento RLS e roteiro de implantação** (`RNF-003`, `RNF-004`, `RNF-009`, `RNF-010`, `CA-013`, `CA-021`)

## Pendências de ambiente

- [ ] Aplicar `003-fix-audit-trigger.sql` no ambiente que já recebeu o script 001.
- [ ] Aplicar `001-eco-drive-crud.sql` no Supabase e validar criação, edição, arquivamento, restauração e auditoria.
- [ ] Publicar a aplicação e executar um teste de fumaça no ambiente de produção.
- [ ] Após a validação da aplicação, aplicar `002-eco-drive-rls-hardening.sql` e verificar bloqueios de acesso anônimo e mutações diretas.
