# Decisões da importação de turmas de compostagem

| Status | Decisão |
| --- | --- |
| Aprovada | Usar e-mail normalizado para identificar cadastros existentes. Reutilizar uma correspondência única compatível e encaminhar conflitos para revisão. |
| Aprovada | Iniciar o planejamento técnico com base na especificação. |
| Aprovada | Implementar localmente o plano técnico. |
| Proposta | Guardar respostas e CPF por vínculo, com acesso ao CPF pela aplicação. Adicionar sobrenome anulável ao cadastro e manter a apresentação do nome completo nos fluxos existentes. |
| Proposta | Conceder permissão de importação por usuário no servidor. A definição de quem recebe a concessão inicial deve ser confirmada antes da disponibilização. |
| Proposta | Gravar as linhas válidas em uma transação e serializar a verificação de correspondência com as escritas concorrentes no cadastro. Validar a duração e o comportamento sob contenção no Supabase local. |
