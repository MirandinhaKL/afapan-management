# Tarefas — Conecta AFAPAN

Data: 2026-10-28. Planejamento preparado com autorização para seguir. Plano e escolhas P-001 a P-010 aprovados em 2026-11-03. Implementação local iniciada; veja implementation-progress.md para estado e validações. Remotas continuam separadas.

- [ ] **T-001 — Fechar contrato e provas de viabilidade locais** (RF-001 a RF-018; RNF-001 a RNF-007; CA-001 a CA-017).
  - Registrar aprovação/revisão de P-001 a P-010, unidade de período/duplicidade, vários certificados no reenvio e limites de anexos.
  - Provar upload privado compatível com hospedagem, tratamento de PDF/vídeo e geração do certificado com Unicode; documentar dependências/limites.
  - Revisar autorização de perfil e registrar gates de configuração remota, signatário/remetente/retenção. Não criar conta/serviço externo.
- [ ] **T-002 — Preparar schema, RLS e transações** (RF-002, RF-004 a RF-006, RF-011 a RF-018; RNF-001, RNF-004, RNF-006; CA-002, CA-003, CA-008, CA-010 a CA-017).
  - Criar migração aditiva local com entidades prefixadas, minutos inteiros, versões, revisões, decisões, idempotência e outbox; seed sem sobrescrever catálogo administrado.
  - Restringir mutações a RPCs autorizadas, RLS, grants e segurança de funções; incluir testes SQL de concorrência/duplicidade e autorização quando houver ambiente local.
  - Não executar SQL remoto; não alterar políticas de outros módulos implicitamente.
- [ ] **T-003 — Gestão administrativa do catálogo** (RF-002, RF-015, RF-016; CA-010, CA-012, CA-016).
  - Projetos/modalidades/tarefas, checklist ou horas livres, inclusão sem deploy, novas versões e retirada de publicação sem apagar histórico.
  - Seed de sete frentes e Marketing A/B; Visitas sem valor fixo de 12 h; preservar catálogos de outros módulos.
- [ ] **T-004 — Submissão pública e comprovantes** (RF-001 a RF-004, RF-013, RF-014, RF-017; RNF-001 a RNF-003; CA-001, CA-008, CA-011, CA-014).
  - Formulário, checklist/horas livres, período e nascimento; validação servidor/cliente e confirmação somente após persistência.
  - Sessão de upload restrita, quota, bucket privado, validação de formato e pelo menos uma evidência válida; impedir leitura/listagem/substituição por token de upload.
- [ ] **T-005 — Lista, detalhe, análise e revisão** (RF-005, RF-006, RF-011, RF-014; CA-002, CA-003, CA-010, CA-013, CA-015, CA-016).
  - Busca/paginação/abas; histórico do aluno; soma das tarefas reconhecidas e ajuste justificado de horas livres; autor/concorrência por revisão.
  - Aprovação/recusa/devolução, sem teto acumulado e sem duplicidade; permissões iguais para usuários internos ativos.
- [ ] **T-006 — Correção segura pelo aluno** (RF-003, RF-004, RF-011, RF-014, RF-016; RNF-001 a RNF-004; CA-001, CA-011, CA-013).
  - Token temporário no e-mail original e escopo restrito; revisão da mesma solicitação com relato/checklist/evidências.
  - Preservar declaração/decisão anterior; impedir troca pública de identificação/destinatário e retorno de histórico alheio.
- [ ] **T-007 — Certificado, assinatura e invalidação** (RF-007 a RF-011, RF-016; RNF-002, RNF-005; CA-004 a CA-007, CA-009).
  - PDF horizontal versionado/idempotente com marca/texto/signatário, código forte e armazenamento privado; bloquear emissão real sem configuração.
  - Download interno, assinatura externa, upload/conferência com hash e preservação de bytes; invalidar emissão errada e vincular nova emissão sem apagar histórico.
  - Gerar/renderizar/inspecionar exemplo fictício e validar ausência de cortes/Unicode perdido.
- [ ] **T-008 — Mensageria e recuperação de falhas** (RF-006, RF-009, RF-011; RNF-001, RNF-004, RNF-006; CA-003, CA-005, CA-006).
  - Adapter simulado local, templates escapados, outbox transacional, worker com lease e idempotência/reconciliação.
  - Retry/backoff e estado incerto; não afirmar entrega em caixa postal; revalidar emissão vigente no despacho. Não enviar mensagens reais.
- [ ] **T-009 — Consulta pública e segunda via** (RF-010, RF-018; RNF-001, RNF-007; CA-007, CA-017).
  - Projeção pública mínima com aprovado/rejeitado, sem arquivo/PII; POST de reenvio CPF/nascimento/código opcional, resposta uniforme e outbox.
  - Rate limit/cooldown, destino original, vários certificados por lote, elegibilidade e legados sem nascimento; sem acesso direto ao documento ou mudança de e-mail.
- [ ] **T-010 — Integração e regressão local** (RF-001 a RF-018; RNF-001 a RNF-007; CA-001 a CA-017).
  - Navegação Conecta AFAPAN, responsividade, teclado, mensagens e estados independentes; preservar módulos existentes.
  - Executar suíte relevante/completa, testes SQL quando disponíveis, TypeScript/build e inspeção visual PDF/UI. Registrar validation.md por critério, distinguindo mock/local/remoto.
- [ ] **T-011 — Preparar implantação e reversão revisáveis** (RNF-001, RNF-004 a RNF-007; CA-009, CA-016, CA-017).
  - Criar deployment.md, consultas read-only de antes/depois, configuração de bucket/worker/segredos sem valores, políticas e rollback não destrutivo.
  - Documentar autorização efetiva de profiles/onboarding, signatário/provedor/domínio/retencão e migração eventual do MVP como gates separados.
- [ ] **T-012 — Inspeção e aplicação remota após autorização específica** (RF-001 a RF-018; RNF-001, RNF-002, RNF-006, RNF-007; CA-001 a CA-017).
  - Conferir ambiente, backup, políticas reais e dependências; aplicar apenas migração aprovada e bucket privado, conferir constraints/RLS/RPCs com papéis reais.
  - Nenhum e-mail real, alteração de autenticação compartilhada ou importação do MVP sem autorização específica.
- [ ] **T-013 — Publicação e homologação de envios após autorização** (RF-001 a RF-018; RNF-001 a RNF-007; CA-001 a CA-017).
  - Configurar provedor/remetente aprovado e política institucional; testar com destinatários autorizados, assinar externamente documento de teste e conferir consulta/reenvio.
  - Publicar versão compatível, habilitar worker/jobs somente após verificação e registrar evidências finais. Não declarar conclusão integral antes dos critérios remotos.

Ordem: aprovação do plano → T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-007 → T-008 → T-009 → T-010 → T-011. T-012 e T-013 exigem autorizações próprias e resultado local aprovado. Sem autorização para implementação, nenhum desses itens deve ser marcado concluído por existir apenas o documento.

- [ ] **T-014 — Validar preservação sem exclusão** (RNF-008; CA-018): incluir em T-010/T-011 verificação de que expiração, invalidação e retirada de publicação preservam dados e arquivos; não implementar job de descarte.
- [ ] **T-015 — Corrigir formulário público** (RF-019 a RF-022; CA-019 a CA-022).
  - Ajustar espaçamento, validação de e-mail no cliente e servidor e máscaras acessíveis de CPF e WhatsApp com envio normalizado.
  - Diagnosticar envio ponta a ponta, preservar os dados em falhas e confirmar apenas após persistência. Adicionar testes de formulário e APIs.
- [ ] **T-016 — Permitir envio sem comprovantes** (RF-023, RF-024; CA-023, CA-024).
  - Corrigir também a aprovação sem anexos pela migração 009, com teste de aprovação, justificativa de ajuste e rejeição de decisão repetida.
  - Atualizar contrato de domínio, sessão de upload e persistência para aceitar zero anexos, preservando as validações quando forem fornecidos.
  - Corrigir o espaçamento dos campos relato e comprovantes e cobrir submissão sem arquivo e com arquivos inválidos/válidos.
