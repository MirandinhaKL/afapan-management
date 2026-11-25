# Tarefas da importação de turmas de compostagem

## Telefone compartilhado nas turmas históricas

**Status** - Migração e roteiro de verificação criados. Execução em PostgreSQL e prévia da 2ª Turma pendentes.

- **T-12** - Versionar a atualização da função de importação e validar as correspondências, conflitos e reimportações em PostgreSQL. **RF-010, RF-011, CA-014, CA-016**
- **T-13** - Conferir na prévia da 2ª Turma que as duas inscrições com telefone compartilhado são classificadas individualmente. Registrar o resultado sem confirmar o lote durante a validação. **RF-011, CA-016**

## Importação temporária de turmas antigas

**Status** - Implementação local, com validação da migração e prévia real pendentes

- **T-09** - Versionar e validar a migração, a correspondência histórica e a proteção contra duplicidades na transação. **RF-009, RF-010, CA-013, CA-014**
- **T-10** - Atualizar a validação do CSV, vincular o modo ao comprovante e testar o desligamento entre prévia e confirmação. **RF-009, RNF-006, CA-013, CA-015**
- **T-11** - Exibir o modo histórico e a confirmação explícita para linhas sem telefone. Revisar consumidores de e-mail ausente, executar testes e TypeScript e validar a prévia da primeira campanha no ambiente autorizado. **RF-009, RF-010, RNF-006, CA-013 a CA-015**

## Exibição da intenção de participar

**Status** - Aguardando aprovação do plano técnico

- **T-07** - Implementar a leitura autenticada por participante e turma. Testar sessão ausente, vínculo inacessível, resposta existente, inscrição ausente e falha de consulta. **RF-008, RNF-005, CA-011, CA-012**
- **T-08** - Exibir a intenção nos detalhes do participante. Testar a troca de turma e participante com requisições em andamento, a preservação de quebras de linha e os estados de ausência e erro. Executar os testes relevantes e o TypeScript. **RF-008, CA-011, CA-012**

**Status** - Implementação local aprovada, validação de banco pendente

Usar apenas dados fictícios em testes. O SQL de verificação local cobre privilégios, gravação, repetição do lote, conflito e reversão. A concorrência exige duas sessões de banco e segue pendente.

| Tarefa | Entrega e validação | Requisitos | Aceite |
| --- | --- | --- | --- |
| T-01 | Criar e validar localmente a migração aditiva, a tabela de permissões e o armazenamento restrito da inscrição. Verificar RLS, privilégios, unicidade, vínculo manual existente, preservação dos dados legados e reversão operacional. | RF-004 a RF-006, RNF-001 a RNF-003 | CA-004 a CA-007 |
| T-02 | Implementar leitura, mapeamento e validação do CSV. Testar cabeçalhos reordenados, ausentes e ambíguos, CSV com aspas e quebras de linha, data de Brasília, nome composto e único, campos vazios, e-mail duplicado, DDD e CPF textual com zero inicial. | RF-002 a RF-006 | CA-002 a CA-004, CA-007, CA-008 |
| T-03 | Implementar a prévia autenticada e a classificação. Testar turma ausente, cancelamento, acesso negado, correspondência única, cadastros ambíguos ou inativos, inscrição divergente, contagens, CPF mascarado e ausência de gravação. | RF-001 a RF-006, RNF-001, RNF-003 | CA-001 a CA-004, CA-006 a CA-008 |
| T-04 | Implementar RPC e confirmação com revalidação. Testar alteração da prévia, gravação parcial por pendência de linha, falha técnica com reversão integral, repetição do arquivo ou de linhas corrigidas, confirmações simultâneas e corrida com cadastro manual. | RF-003 a RF-006, RNF-001 a RNF-003 | CA-003 a CA-007 |
| T-05 | Integrar diálogo, atualização de lista e total, exibição de nome completo e consulta específica ao CPF. Testar seleção de turma, ajuste de DDD, cancelamento, confirmação, contadores e consulta autenticada. Verificar cadastro manual, vínculos anteriores, monitoramento, exportações e mensagens. | RF-001 a RF-006, RNF-001, RNF-003 | CA-001 a CA-004, CA-006 a CA-008 |
| T-06 | Executar testes relevantes, regressão e TypeScript. Validar migração e transação no Supabase local. Registrar evidências por critério e, após autorização, validar esquema remoto, permissões e a prévia real da 10ª turma. | RF-001 a RF-006, RNF-001 a RNF-003 | CA-001 a CA-008 |
