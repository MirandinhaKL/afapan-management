# Seleção e remoção de arquivos — 2026-11-06

Solicitação autorizada: selecionar vários comprovantes e remover arquivos antes do envio.

Comportamento: seleção múltipla nativa e adição em etapas, preservando seleções anteriores. Exibir lista de nomes e botão acessível de remoção por arquivo. Rejeitar adição que viole formato, tamanho individual, cinco anexos ou soma de 50 MiB, preservando a seleção válida anterior. Evitar repetir o mesmo arquivo por nome, tamanho, tipo e data de modificação.

Plano: estado local continua fonte da lista enviada. Limpar seletor nativo após cada seleção para permitir escolher novamente arquivo removido. Remover afeta somente a seleção local e não exclui registros ou arquivos do servidor. Sem mudança de schema, API, RLS ou migração.

Correção visual: ocultar a indicação nativa que ficava vazia após limpar o seletor. Apresentar botão Adicionar arquivos e contagem baseada na lista de arquivos do formulário, com anúncio acessível da quantidade.

Validação: testes de seleção em etapas, remoção e payload final; TypeScript e build.
