# Tarefas — Cadastro e confirmação de voluntários AFAPAN

- **Status:** T-022 a T-024 implementadas localmente; T-025 com validação local e preparação da implantação, validação remota pendente
- **Plano:** `./technical-plan.md`
- **Atualização:** 2026-10-01

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

## Tarefas da revisão aprovada em 2026-10-01

- [x] **T-013 — Atualizar domínio, contratos e migração local** (`RF-002`, `RF-004`, `RF-032`–`RF-043`, `RNF-005`–`RNF-011`, `RNF-015`, `CA-029`–`CA-037`)
  - Adicionar campos opcionais de perfil e autorização de imagem.
  - Substituir dias, turnos e observações pelas cinco frequências estáveis.
  - Implementar parser e formatador de `dd/mm/aaaa` e manter `MM/AAAA` para início das atividades.
  - Atualizar SQL, restrições, RPCs, auditoria e mapeamentos sem expor novos dados ao acesso anônimo.
  - Criar ou atualizar testes unitários de domínio, payload e persistência.

- [x] **T-014 — Substituir link com token por campanha ativa** (`RF-032`–`RF-034`, `RNF-005`–`RNF-010`, `CA-029`, `CA-030`)
  - Criar rota pública fixa `/voluntariado/cadastro` e consulta mínima da campanha ativa.
  - Resolver novamente a campanha no servidor durante o envio e rejeitar ausência ou ambiguidade com mensagem genérica.
  - Remover rota e contratos antigos com token, pois não há compatibilidade exigida.
  - Cobrir campanha ativa, ausente, expirada, ambígua e associação correta em testes unitários.

- [x] **T-015 — Renovar o formulário público** (`RF-035`–`RF-043`, `RNF-001`–`RNF-005`, `RNF-012`–`RNF-015`, `CA-031`–`CA-037`)
  - Adicionar introdução acolhedora, foto preparada e seções curtas responsivas.
  - Incorporar campos opcionais de perfil, experiência, comunicação, projeto, história e autorização de imagem.
  - Exibir apenas frequência na disponibilidade e aplicar padrões brasileiros de data.
  - Otimizar a fotografia para web sem publicar a versão original com o rosto da criança visível.
  - Testar opcionais, recusa/não resposta da autorização, datas, frequência, imagem, teclado e celular.

- [x] **T-016 — Atualizar gestão e detalhamento dos voluntários** (`RF-016`–`RF-020`, `RF-036`–`RF-041`, `CA-010`, `CA-016`, `CA-032`–`CA-034`, `CA-037`)
  - Exibir e editar os novos campos opcionais no cadastro assistido e no detalhamento.
  - Substituir disponibilidade antiga por frequência nos formulários, filtros, consultas e auditoria.
  - Cobrir carregamento, edição, valores ausentes e apresentação brasileira das datas em testes.

- [x] **T-017 — Recolher busca e filtros na listagem** (`RF-044`–`RF-046`, `RNF-016`, `CA-038`–`CA-041`)
  - Criar botão acessível `Filtros`, região recolhida inicialmente e indicador da quantidade de filtros ativos.
  - Preservar valores/resultados ao recolher e restaurar o estado inicial em `Limpar filtros`.
  - Testar abertura, fechamento, teclado, contagem, persistência durante a sessão da tela e limpeza.

- [x] **T-018 — Validar revisão e preparar implantação controlada** (`RNF-001`–`RNF-016`, `CA-029`–`CA-041`)
  - Executar testes relevantes e completos, TypeScript e build de produção.
  - Validar responsividade, acessibilidade, ausência de token na URL e proteção da foto original.
  - Atualizar instruções de SQL remoto, variáveis, verificação, reversão e teste de fumaça.
  - Manter as operações remotas de `T-011` e `T-012` pendentes até autorização específica.

- [x] **T-019 — Corrigir a cópia do link público** (`RF-032`, `RNF-001`, `CA-029`)
  - Tentar a API moderna da área de transferência e oferecer alternativa compatível quando ela estiver indisponível ou bloqueada.
  - Informar sucesso somente após a cópia, tanto no botão quanto em uma região acessível, e apresentar orientação visível em caso de falha.
  - Atualizar a campanha na interface imediatamente após o salvamento e permitir a cópia sem depender de uma segunda consulta.
  - Manter o botão visível e orientar a criação ou ativação da campanha quando necessário.
  - Cobrir por testes unitários os cenários de sucesso, alternativa e falha.

- [x] **T-020 — Melhorar a apresentação e o preenchimento do formulário público** (`RF-047`–`RF-051`, `CA-042`–`CA-046`)
  - Remover a faixa vazia sobre o cabeçalho e aumentar o espaçamento entre rótulos e campos.
  - Destacar rótulos obrigatórios e remover a indicação textual de opcionalidade.
  - Aplicar e testar máscara brasileira nos telefones.
  - Adicionar e testar a seleção ou remoção de todas as atividades.
  - Validar e testar a data de nascimento ao concluir o preenchimento do campo.

- [x] **T-021 — Refinar validações e textos do formulário público** (`RF-052`–`RF-055`, `CA-047`–`CA-050`)
  - Validar junto ao campo somente e-mails preenchidos.
  - Centralizar o conteúdo do cabeçalho e renomear a seção de localização para `Endereço`.
  - Tornar facultativa a descrição de `Outras atividades` no domínio e na interface.
  - Cobrir os quatro comportamentos com testes unitários e de componente.
  - Criar a migração incremental `004` para alinhar a restrição do banco à descrição facultativa de `Outras atividades`.
  - Centralizar o bloco textual do cabeçalho nos dois eixos, mantendo o ícone fora do cálculo de centralização.

- [x] **T-022 — Substituir o domínio do catálogo de atividades** (`RF-056`–`RF-063`, `CA-051`–`CA-055`)
  - Criar uma única estrutura agrupada e derivar dela tipo, lista achatada, rótulos e seleção total.
  - Remover `outras`, `otherActivityDescription` e identificadores antigos dos contratos em uso.
  - Atualizar testes unitários do domínio.

- [x] **T-023 — Atualizar formulários e visualização** (`RF-056`–`RF-062`, `CA-051`–`CA-053`, `CA-055`)
  - Renderizar os cinco grupos com ícones no formulário público.
  - Atualizar formulário assistido e detalhamento para o novo catálogo.
  - Testar grupos, textos, seleção individual e `Marcar todas`.

- [x] **T-024 — Criar migração destrutiva e controlada do catálogo** (`RF-063`, `CA-052`, `CA-054`, `CA-055`)
  - Criar `005-volunteer-activity-catalog.sql` transacional.
  - Apagar somente vínculos de interesses antigos, remover coluna obsoleta, substituir restrição e atualizar RPCs.
  - Preservar tabela, RLS, chaves, voluntários e demais dados.
  - Documentar verificação e reversão sem recuperação dos interesses apagados.

- [ ] **T-025 — Validar e preparar implantação** (`RF-056`–`RF-063`, `CA-051`–`CA-055`)
  - Executar testes relevantes, suíte completa, TypeScript e build.
  - Aplicar o SQL remoto somente após autorização específica e validar catálogo, RPCs e RLS.
  - Executar testes de fumaça público e assistido após o deploy.

### Evidências locais das tarefas T-022 a T-025 — 2026-10-08

- Domínio e lista achatada derivados dos cinco grupos; opção independente incluída na seleção total.
- Componente compartilhado entre formulário público e assistido; filtros e detalhamento usam os rótulos derivados.
- Códigos antigos e desconhecidos rejeitados pelo domínio e pela API antes de acessar o banco.
- Migração `005` preparada e definição-base `001` alinhada. Nenhum SQL remoto executado.
- Suíte completa: 98 testes em 19 arquivos aprovados; TypeScript sem emissão aprovado.
- Build de produção aprovado; verificação de tipos executada separadamente, pois o build do projeto omite essa etapa.
- `CA-051` e `CA-053`: validados nos testes do formulário público e da gestão interna.
- `CA-052` e `CA-055`: validados no domínio, API, payloads, mapeamento, edição e detalhamento; validação do banco permanece pendente.
- `CA-054`: escopo do script conferido por teste estático; preservação efetiva e transação no PostgreSQL permanecem pendentes.
- T-025 permanece aberta até migração autorizada, verificação de RPCs/RLS e testes de fumaça após publicação. Procedimento em `activity-catalog-deployment.md`.

## Dependências entre tarefas

As tarefas `T-001` a `T-010` foram implementadas localmente conforme o plano anterior. `T-013` a `T-018` compõem a revisão atual. A migração incremental `003` foi aplicada e verificada no Supabase em 2026-10-01. `T-011` e a parte remota de `T-012` permanecem parcialmente pendentes até a validação completa de permissões, aplicação do agendamento e publicação controlada.

1. `T-001` antecede formulários, APIs e consultas.
2. `T-002` antecede `T-003`, `T-004`, `T-007`, `T-009` e `T-010`.
3. `T-003` e `T-004` antecedem `T-005`.
4. `T-005` antecede `T-006`.
5. `T-007` antecede `T-008`.
6. `T-009` e `T-010` antecedem a validação integrada.
7. `T-011` deve ocorrer antes de compartilhar o link público.
8. `T-013` antecede `T-014`, `T-015` e `T-016`.
9. `T-014` antecede a integração final de `T-015`.
10. `T-016` e `T-017` podem ser implementadas após `T-013` e devem terminar antes de `T-018`.
11. `T-018` antecede qualquer execução remota, publicação ou compartilhamento do novo endereço.

## Aprovação

- [x] Tarefas da revisão e ordem revisadas
- [x] Rastreabilidade da revisão revisada
- [x] Plano técnico e tarefas da revisão aprovados pelo responsável em 2026-10-01

## Pendências de ambiente

- [x] `001-volunteers-schema.sql` aplicado no Supabase, conforme confirmação da responsável.
- [x] `003-volunteers-form-revision.sql` aplicado e validado no Supabase: sete novas colunas presentes, assinaturas antiga e nova da RPC disponíveis, nenhuma frequência inválida e RLS habilitada nas cinco tabelas do módulo.
- [x] `004-optional-other-activity-description.sql` aplicado e validado no Supabase em 2026-10-06; envio público com `Outras atividades` sem descrição confirmado em produção.
- [ ] Configurar `VOLUNTEER_FORM_RATE_LIMIT_SECRET` localmente e na Vercel.
- [ ] Aplicar e validar `002-volunteers-schedule.sql` após a migração principal.
- [ ] Executar testes de RLS com os papéis `anon`, `authenticated` e `service_role`.
- [ ] Publicar e executar teste de fumaça antes de compartilhar o link público.
