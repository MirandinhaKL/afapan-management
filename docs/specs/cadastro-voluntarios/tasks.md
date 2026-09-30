# Tarefas — Cadastro e confirmação de voluntários AFAPAN

- **Status:** Implementação local concluída; validação remota pendente
- **Plano:** `./technical-plan.md`
- **Atualização:** 2026-09-29

- [ ] **T-001 — Criar domínio e validações compartilhadas** (`RF-002`–`RF-008`, `RF-011`–`RF-014`, `RF-024`, `RF-028`, `RF-031`, `RNF-009`, `CA-003`–`CA-006`, `CA-012`, `CA-015`, `CA-017`, `CA-022`, `CA-026`–`CA-028`)
  - Tipos, constantes, telefone normalizado, idade, disponibilidade, interesses e responsável.
  - Testes unitários de todos os limites e regras condicionais.

- [ ] **T-002 — Criar migração aditiva do banco** (`RF-009`, `RF-015`–`RF-031`, `RNF-006`–`RNF-010`, `CA-002`, `CA-006`–`CA-012`, `CA-019`–`CA-028`)
  - Tabelas, restrições, índices, token de campanha e unicidade parcial do telefone.
  - RLS, grants e documentação de verificação e reversão.

- [ ] **T-003 — Implementar RPCs transacionais e auditoria** (`RF-009`, `RF-012`, `RF-015`–`RF-029`, `CA-002`, `CA-003`, `CA-008`–`CA-012`, `CA-019`–`CA-023`)
  - Envio público, criação assistida, edição, situação, campanha, arquivamento e restauração.
  - Concorrência otimista, consentimentos, histórico e auditoria.

- [ ] **T-004 — Implementar proteção do formulário público** (`RNF-005`, `RNF-006`, `RNF-010`, `CA-003`, `CA-007`, `CA-012`)
  - Honeypot, limite por janela, identificador HMAC e limpeza de tentativas.
  - Testes de bloqueio e ausência de dados pessoais nas respostas e logs.

- [ ] **T-005 — Implementar APIs públicas** (`RF-001`–`RF-014`, `RF-024`, `RF-030`, `RNF-004`–`RNF-010`, `CA-001`–`CA-007`, `CA-012`, `CA-014`, `CA-015`, `CA-017`, `CA-018`, `CA-024`, `CA-025`)
  - Consulta da campanha e submissão do formulário.
  - Testes unitários com Supabase mockado para sucesso e exceções.

- [ ] **T-006 — Construir página pública acessível** (`RF-001`–`RF-010`, `RF-024`, `RF-030`, `RNF-001`–`RNF-005`, `RNF-012`, `CA-001`, `CA-004`–`CA-006`, `CA-013`–`CA-015`, `CA-017`, `CA-018`, `CA-024`, `CA-025`)
  - Seções de identificação, endereço, perfil, disponibilidade, interesses, responsável e consentimentos.
  - Estados de carregamento, validação, envio, duplicidade, campanha encerrada e sucesso.
  - Testes de formulário, teclado, rótulos e mensagens.

- [ ] **T-007 — Implementar consultas administrativas paginadas** (`RF-016`, `RF-020`, `RF-021`, `RF-022`, `RF-028`, `RF-031`, `RNF-007`, `CA-011`, `CA-016`, `CA-021`, `CA-022`, `CA-026`–`CA-028`)
  - Mapeamento, paginação, busca, filtros e arquivamento padrão.
  - Testes de filtros e apresentação de idade/aniversário.

- [ ] **T-008 — Construir página interna de voluntários** (`RF-015`–`RF-031`, `RNF-001`–`RNF-003`, `CA-008`–`CA-011`, `CA-016`, `CA-019`, `CA-021`–`CA-028`)
  - Navegação, tabela, detalhes, cadastro assistido, edição e mudanças de situação.
  - Confirmações para arquivar/restaurar e feedback de concorrência.
  - Testes unitários dos fluxos administrativos.

- [ ] **T-009 — Implementar gestão da campanha e link** (`RF-001`, `RF-025`–`RF-030`, `CA-001`, `CA-020`, `CA-023`–`CA-025`)
  - Criar/editar campanha, alterar prazo, ativar/desativar e copiar link público.
  - Exibir textos aprovados e canais oficiais.

- [ ] **T-010 — Implementar processamento automático de prazo** (`RF-026`, `RF-027`, `RNF-007`, `CA-020`, `CA-023`)
  - Função idempotente, histórico de origem `sistema`, agendamento e fallback por acesso.
  - Testes de prazo e repetição segura.

- [ ] **T-011 — Validar segurança e permissões no Supabase** (`RNF-005`–`RNF-010`, `CA-007`)
  - Anônimo sem leitura/escrita direta, autenticado com acesso administrativo e API pública limitada.
  - Verificar que segredos permanecem somente no servidor.

- [ ] **T-012 — Executar validação integrada e preparar implantação** (`RNF-001`–`RNF-012`, todos os CAs)
  - Vitest completo, TypeScript, build, teste responsivo e teste de fumaça.
  - Documentar SQL remoto, variáveis, ordem de publicação, verificação e reversão.

## Dependências entre tarefas

As tarefas `T-001` a `T-010` foram implementadas localmente. `T-011` e a parte remota de `T-012` permanecem pendentes até a aplicação das migrações no Supabase e a publicação controlada.

1. `T-001` antecede formulários, APIs e consultas.
2. `T-002` antecede `T-003`, `T-004`, `T-007`, `T-009` e `T-010`.
3. `T-003` e `T-004` antecedem `T-005`.
4. `T-005` antecede `T-006`.
5. `T-007` antecede `T-008`.
6. `T-009` e `T-010` antecedem a validação integrada.
7. `T-011` deve ocorrer antes de compartilhar o link público.

## Aprovação

- [x] Tarefas e ordem revisadas
- [x] Rastreabilidade revisada
- [x] Plano técnico e tarefas aprovados pelo responsável em 2026-09-29

## Pendências de ambiente

- [ ] Aplicar e validar `001-volunteers-schema.sql` no Supabase.
- [ ] Configurar `VOLUNTEER_FORM_RATE_LIMIT_SECRET` localmente e na Vercel.
- [ ] Aplicar e validar `002-volunteers-schedule.sql` após a migração principal.
- [ ] Executar testes de RLS com os papéis `anon`, `authenticated` e `service_role`.
- [ ] Publicar e executar teste de fumaça antes de compartilhar o link público.
