# Aprovação sem comprovante — correção de 2026-11-05

CA-023 também se aplica à análise. A função anterior recusava solicitações sem arquivos com código 22023 e a tela mostrava orientação sobre tarefas. A migração 009 retira somente essa exigência de arquivo, preservando conferência de horas, tarefas, revisão concorrente e acesso interno.

Teste SQL em PostgreSQL embarcado aprovado: solicitação sem anexos, segunda tarefa de Compostando nas Escolas, aprovação com 120 minutos sem justificativa porque não houve ajuste. Alteração da tarefa sem justificativa é rejeitada. Repetição da aprovação é rejeitada. Demais cenários do catálogo, envio, correção e certificados permanecem validados pelo mesmo script.

Aplicação manual: após 001–008 do Conecta, executar o conteúdo completo de 009-conecta-approve-optional-evidence.sql em nova consulta no Supabase conectado à aplicação. Atualizar a ficha e aprovar novamente. Confirmar situação aprovada e 2 horas reconhecidas. Não reaplicar os scripts antigos de voluntários.

Efeitos: substitui uma função, sem apagar dados, modificar tabelas ou ampliar permissões. Reversão: restaurar a função de revisão da migração 005. Teste remoto pendente, migração não executada pelo agente.
