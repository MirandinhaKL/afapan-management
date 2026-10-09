# Tarefas — Cadastro permanente de voluntários

- **Status:** Plano aprovado em 2026-10-09; T-001 a T-006 concluídas no escopo local; verificações remotas pendentes.
- **Data:** 2026-10-09.
- **Plano:** `./technical-plan.md`.
- Os identificadores RF, RNF e CA desta lista referem-se à especificação desta iniciativa.

- [x] **T-001 — Preparar configuração e contratos do formulário permanente**
  - Requisitos: RF-001, RF-006, RF-008; RNF-001, RNF-003.
  - Critérios: CA-001, CA-004, CA-005, CA-007.
  - Definir configuração com textos/versões e payload com versões apresentadas, sem prazo, ativação ou campanha.
  - Preparar testes de validação dos novos contratos, preservando domínio existente.

- [x] **T-002 — Preparar migração local 006 e segurança**
  - Requisitos: RF-002, RF-007, RF-008, RF-010, RF-011; RNF-001, RNF-004, RNF-005.
  - Critérios: CA-002, CA-005, CA-006, CA-007, CA-008, CA-009.
  - Criar configuração, nova RPC permanente e atualização de consentimentos na RPC assistida.
  - Preservar vínculos históricos e dados; tornar função de expiração sem efeitos e retirar execução das RPCs de campanha nos papéis da aplicação.
  - Criar limpeza de tentativas e preparar cancelamento do job antigo com tratamento de ambiente sem pg_cron.
  - Documentar instalação nova, catálogo, ordem, consultas de verificação e reversão.
  - Testar estática e, se houver ambiente local já disponível, transacionalmente. Não executar SQL remoto.

- [x] **T-003 — Implementar APIs de configuração e envio permanente**
  - Requisitos: RF-001, RF-002, RF-007, RF-008, RF-009, RF-012; RNF-001, RNF-003.
  - Critérios: CA-001, CA-002, CA-005, CA-006, CA-007, CA-010.
  - Criar GET /api/volunteers/form sem consulta de campanha e mudar o POST para nova RPC.
  - Preservar honeypot/HMAC/limite; executar limpeza limitada a tentativas antigas.
  - Rejeitar versões desatualizadas e tratar erros sem repetir criação.
  - Retirar expiração da rota antiga e orientar atualização de páginas antigas.
  - Testes mockados de sucesso, validação, versões, limite, duplicidade e falha.

- [x] **T-004 — Atualizar página e formulário públicos**
  - Requisitos: RF-001, RF-006, RF-008, RF-009, RF-012; RNF-002, RNF-003.
  - Critérios: CA-001, CA-002, CA-004, CA-005, CA-007, CA-010, CA-011.
  - Carregar configuração própria, retirar prazo/nome de campanha e apresentar textos aprovados.
  - Preservar campos, imagem preparada, validações e dados durante falha/atualização dos textos.
  - Testar envio, rejeição de versão, falha técnica, teclado e ausência de campanha.

- [x] **T-005 — Simplificar gestão interna e acesso ao link**
  - Requisitos: RF-003, RF-004, RF-005, RF-011; RNF-002, RNF-003.
  - Critérios: CA-003, CA-004, CA-009, CA-011.
  - Remover controles, consultas, funções e diálogo de campanha sem alterar fluxos de voluntários.
  - Mostrar endereço absoluto, abertura e cópia; manter link disponível com listagem indisponível.
  - Cobrir sucesso, alternativa e falha de cópia, filtros e fluxos administrativos em testes.

- [x] **T-006 — Validar implementação local e reconciliar documentação**
  - Requisitos: RF-001 a RF-012; RNF-001 a RNF-006.
  - Critérios: CA-001 a CA-012, com evidências remotas explicitamente pendentes.
  - Executar testes relevantes, suíte completa, TypeScript e build.
  - Conferir referências operacionais remanescentes de campanha e acessibilidade/responsividade.
  - Reconciliar requisitos/cenários antigos de cadastro-voluntarios e retirar orientações de instalar 002 ou criar campanha como pré-requisito.
  - Registrar resultados por critério e preparar roteiro de implantação.

- [ ] **T-007 — Inspecionar e migrar ambiente remoto após autorização específica**
  - Requisitos: RF-002, RF-007, RF-008, RF-010; RNF-001, RNF-004, RNF-005, RNF-006.
  - Critérios: CA-002, CA-005, CA-006, CA-007, CA-008, CA-012.
  - Confirmar catálogo real e estado de 005 sem executá-la implicitamente.
  - Capturar definições, grants, jobs e contagens históricas antes de alteração.
  - Aplicar 006 somente com autorização e verificar RPCs, RLS, consentimentos, rollback e agendamento.
  - Se faltar compatibilidade do catálogo, registrar impedimento e pedir autorização separada para a iniciativa correspondente.

- [ ] **T-008 — Publicar e validar o fluxo permanente após autorização**
  - Requisitos: RF-001 a RF-012; RNF-001, RNF-002, RNF-006.
  - Critérios: CA-001 a CA-012.
  - Publicar em ordem compatível com banco e catálogo.
  - Testes de fumaça público e assistido, link/cópia, consentimentos, duplicidade e históricos.
  - Registrar evidências e concluir somente quando todos os critérios aplicáveis estiverem validados.

## Dependências

1. Aprovação deste plano antecede T-001.
2. T-001 → T-002 → T-003 → T-004 → T-005 → T-006.
3. T-006 antecede solicitação de autorização para T-007.
4. T-007 com compatibilidade confirmada antecede autorização e execução de T-008.
5. A migração 005 pertence à iniciativa de catálogo, com autorização própria. Não é tarefa de execução desta iniciativa.

## Aprovação

- [x] Plano técnico e tarefas aprovados pela responsável em 2026-10-09.
- [x] Implementação local T-001 a T-006 autorizada.
- [ ] Operações remotas T-007 autorizadas separadamente.
- [ ] Publicação e teste de fumaça remoto T-008 autorizados separadamente.

## Evidências locais

Ver `validation.md`, `deployment.md` e `verification.sql`. Capturas móveis/computador locais e testes de teclado aprovados; testes de fumaça autenticados e inspeção em dispositivo real ficam em T-008. Nenhuma execução remota foi realizada.
