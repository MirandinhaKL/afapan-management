# Comprovantes opcionais — validação em 2026-11-05

RF-023/RF-024 implementados localmente. A nova solicitação aceita zero anexos. Correção mantém comprovante obrigatório. Relato e comprovantes têm espaçamento uniforme.

185 testes em 32 arquivos, TypeScript e build aprovados. O teste de formulário percorre envio sem arquivo e com PDF sem MIME informado, conferindo máscaras e payload. O teste SQL embarcado aplica 008 e verifica envio vazio, idempotência e ausência de anexos artificiais. Testes anteriores de correção e integridade de arquivos passam.

## Aplicação manual

Pré-condição: 001–007 do Conecta aplicados. Execute somente 008-conecta-optional-evidence.sql em nova consulta no projeto Supabase usado pela aplicação. Substitui duas funções para aceitar zero comprovantes. Preserva dados, tabelas, grants e RLS.

A sessão de envio é mantida também sem anexos para aplicar quota e idempotência. URLs de Storage e registros de comprovantes são criados somente quando houver arquivos. Isso ajusta o detalhe do plano sobre sessões sem arquivo.

Após aplicar, recarregue a página e envie uma nova participação sem arquivo. Confirme recebimento e presença na fila interna. Repita com PDF válido de até 15 MB. Risco operacional: código e funções precisam estar atualizados em conjunto.

Reversão: restaurar as duas funções da migração 004 e o contrato anterior do aplicativo. Preservar registros já enviados sem anexos.

Migração remota não executada. Teste real de Storage e inspeção visual no navegador permanecem pendentes.
