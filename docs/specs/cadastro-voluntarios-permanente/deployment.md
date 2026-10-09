# Implantação do cadastro permanente

Data: 2026-10-09. Implementação local aprovada; nenhuma operação remota executada.

## Finalidade, efeitos e limites

A migração 006 cria a configuração dos textos e versões, a RPC permanente e a limpeza exclusiva de tentativas temporárias com mais de 24 horas. Atualiza a RPC assistida para registrar os novos consentimentos somente na criação. Torna a expiração de campanhas sem efeitos, cancela o job conhecido e revoga a execução das RPCs antigas de campanha nos papéis da aplicação. Não apaga campanhas, voluntários, interesses, consentimentos ou histórico e não reclassifica situações existentes. As políticas das tabelas pessoais permanecem intactas; a configuração tem RLS e leitura restrita ao servidor.

Riscos: locks concorrentes, assinaturas/grants divergentes no ambiente, catálogo incompatível e clientes antigos ainda abertos. A transação tem limite de espera de lock de cinco segundos. Clientes antigos devem atualizar a página; sua API de campanha passa a responder 410. Falhas técnicas não devem ser tratadas como inscrição encerrada.

## Ordem — exige autorização específica antes de SQL remoto ou publicação

1. Confirmar o ambiente e as revisões 001, 003 e 004. Capturar definições de funções, grants, políticas, constraints, jobs e contagens dos dados pessoais antes da alteração, em local protegido. Usar as consultas somente leitura de `verification.sql`. Verificar também jobs personalizados e execuções de expiração já iniciadas.
2. Confirmar o catálogo real. A aplicação atual usa o catálogo novo. A migração 006 não aplica 005 nem altera suas constraints. Se o catálogo remoto divergir, interromper a publicação e obter autorização própria para a iniciativa do catálogo. A migração 005 exclui interesses e não deve ser reaplicada implicitamente.
3. Preparar uma janela coordenada sem novos envios nem edições e aguardar operações em andamento. A janela deve ser operacional, sem restaurar controles de campanha no produto.
4. Aplicar integralmente `006-permanent-volunteer-registration.sql`, somente após autorização. Não reaplicar 001 ou 002. Se 005 for aplicada depois de 006, reaplicar 006 antes de liberar a aplicação: 005 substitui a função assistida. A reaplicação de 006 preserva configuração existente e consentimentos históricos.
5. Executar as verificações pós-migração: configuração completa, SECURITY DEFINER com search_path vazio, grants, RLS, função de expiração sem efeitos e job de limpeza. Sem pg_cron, não instalar extensão implicitamente: a API executa a limpeza antes da verificação de limite de tentativas.
6. Comparar contagens e situações antes de inserir dados de teste. Conferir vínculos de campanhas e textos históricos. As tentativas temporárias são a única categoria eliminável pela rotina de retenção.
7. Publicar somente após autorização própria e compatibilidade confirmada. Confirmar a presença da variável de proteção HMAC no servidor sem revelar seu valor. Abrir o formulário, verificar ausência de prazo, copiar o link e validar sucesso, duplicidade, menor de idade e falha recuperável com dados de teste autorizados.
8. Conferir cadastro público aguardando validação, campaign_id nulo e consentimentos exatamente iguais aos textos/versões apresentados. Validar cadastro assistido, edição sem reescrever aceites, filtros, arquivamento e restauração. Testar permissões com papéis reais: anônimo não acessa tabelas pessoais nem executa a RPC; servidor executa a pública; autenticado autorizado executa a assistida. Registrar resultados antes de concluir CA-012.

## Reversão

Antes da aplicação, guardar as definições e permissões anteriores. Uma falha antes do commit reverte a migração. Após commit, suspender os envios e restaurar definições/grants capturados com revisão específica; preservar a configuração e todos os registros criados, inclusive os novos campaign_id nulos. Não apagar a configuração nem reescrever consentimentos para simular o modelo antigo. A aplicação anterior exige campanha e não é reversão compatível por si só: preparar adaptação ou manter o fluxo indisponível até correção autorizada. Não reativar a expiração automática sem aprovação de nova regra de negócio.

## Evidências ainda pendentes

Não há PostgreSQL local disponível para execução transacional. SQL foi revisado e testado estaticamente; aplicação real, permissões efetivas, jobs e preservação de dados dependem de T-007. Publicação e testes de fumaça dependem de T-008. Nenhuma dessas tarefas está autorizada nesta execução.
