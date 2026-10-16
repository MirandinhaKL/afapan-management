# Decisões — Estatísticas de voluntários

- **DEC-001:** responsável solicitou cards de Ativos, Aguardando validação e Novos voluntários do ano atual.
- **DEC-002:** responsável corrigiu explicitamente a referência anual: usar início na AFAPAN, e aprovou as demais regras da especificação.
- **DEC-003:** início é registrado como mês/ano. Não contar datas ausentes/parciais nem preencher a partir da data de criação/validação.
- **DEC-004:** indicadores globais de não arquivados, independentes da página/filtros e de origem; anual independe da situação. Não são categorias exclusivas.
- **DEC-005:** aprovação da especificação autoriza preparar plano e tarefas. Implementação depende da aprovação do plano; publicação e operação remota continuam separadas.
- **DEC-006 — Técnica aprovada:** consultas head/count exact no cliente autenticado com RLS existente, sem migração ou transferência de perfis para contar.
- **DEC-007 — Técnica aprovada:** estados independentes da lista, revisão após mutações locais e descarte de respostas obsoletas. Não prometer snapshot entre três consultas nem atualização em tempo real de outras sessões.

- **DEC-008 — Aprovação do plano:** a mensagem “Aprovado” de 2026-10-15 autoriza implementar localmente T-001 a T-005. Não autoriza publicação ou alteração remota.
- **DEC-009 — Estados:** falha de qualquer uma das três contagens invalida o conjunto, sem converter ausência em zero. Nova revisão oculta valores anteriores até receber resposta atual; respostas obsoletas são descartadas.
