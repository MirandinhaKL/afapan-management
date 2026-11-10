# Signatário do certificado — correção de 2026-11-05

Objetivo: corrigir a geração bloqueada pela exigência antiga de signer na configuração. A regra aprovada identifica como signatário o usuário autor da aprovação, com Farroupilha, RS como cidade.

Migração 010 substitui somente conecta_reserve_certificate. Consulta o nome do perfil de d.actor, verifica nome presente e mantém fotografia do conteúdo da emissão. Emissões existentes são reutilizadas sem alterar conteúdo ou código. Não muda tabelas, grants ou RLS nem exclui dados.

Teste SQL local aprovado usando exatamente a configuração enviada pela API: somente city. Verifica nome do aprovador, identificação AFAPAN, cidade, horas reconhecidas, idempotência, conflito de hash e substituição após invalidação. Configuração sem cidade e usuário inativo permanecem rejeitados.

Aplicação manual: após 001–009 do Conecta, executar o conteúdo completo de 010-conecta-certificate-approver.sql no Supabase usado pela aplicação. Reabrir a solicitação aprovada e gerar o certificado. Confirmar o nome de quem aprovou e a cidade no PDF. A geração e o armazenamento no ambiente real ainda dependem dessa verificação.

Migração remota não executada. Reversão: restaurar a função de reserva anterior preservando os registros de emissão.
