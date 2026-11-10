# Motivo da invalidação na ficha do certificado

A responsável solicitou que o cartão do certificado invalidado exiba o motivo já registrado. A ficha administrativa mostra o texto junto ao código e à situação, acima da opção de gerar nova emissão.

A migração 011 atualiza somente conecta_certificate_status. Reaproveita a coluna invalidation_reason, retorna o texto quando a emissão apresentada está invalidada e preserva seleção, permissões, RLS e verificação de usuário interno ativo. A consulta pública permanece fora desse fluxo.

O risco é expor um texto administrativo. A consulta continua restrita e o teste verifica a negação ao usuário anônimo. A tela apresenta texto simples, com quebra de linha. A reversão técnica consiste em restaurar a função da migração 007.

Validação local: teste SQL consulta uma emissão antes e depois da invalidação. Teste da interface confere a exibição do motivo e a opção de nova emissão. Em Supabase, após 001–010, aplicar a migração 011 e reabrir uma ficha com emissão invalidada para conferir o texto registrado.
