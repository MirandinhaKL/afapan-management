# Plano técnico — Estatísticas de voluntários

Data: 2026-10-15. Especificação aprovada, incluindo início na AFAPAN como referência anual. Plano aprovado pela responsável em 2026-10-15; implementação local autorizada.

## Estratégia de consulta

Adicionar módulo dedicado de estatísticas, separado da consulta paginada da listagem, com retorno tipado `{ active, awaitingValidation, startedThisYear, year }`. Calcular o ano corrente por Intl.DateTimeFormat com timeZone America/Sao_Paulo a partir de um instante injetável para testes.

Usar o cliente Supabase autenticado existente, com verificação de sessão por getUser antes da consulta. Fazer três contagens exatas em paralelo com `select('id', { count: 'exact', head: true })`, sempre `arquivado_em IS NULL`:

1. Ativos: `status = ativo`.
2. Aguardando validação: `status = aguardando_validacao`.
3. Novos voluntários no ano: `inicio_atividades_ano = anoAtual` e `inicio_atividades_mes >= 1 AND inicio_atividades_mes <= 12`, sem restrição de origem ou situação. Null/parcial não conta. Não consultar criado_em nem inferir início por outras datas. As validações existentes de cadastro continuam impedindo início futuro; não alterar essa regra nesta iniciativa.

Não receber filtros/página como argumentos. As contagens são feitas pelo banco, sem baixar cadastros nem depender do limite de linhas do servidor. Tratar count nulo, inválido ou erro como indisponibilidade, não como zero. Somente consolidar sucesso se todas as contagens forem válidas; em falha de uma, mostrar estado de erro do conjunto, com ação para tentar novamente. As três consultas podem observar instantes diferentes em presença de concorrência: são indicadores atuais, sem promessa de snapshot transacional. Não somar os cards como categorias exclusivas.

## Interface e ciclo de vida

Criar componente próprio dos cards, seguindo Card/CardHeader/CardContent e cores/ícones do padrão de Compostagem. Integrar abaixo do cabeçalho e acima da listagem: uma coluna no celular e três a partir do breakpoint adequado. Títulos Ativos, Aguardando validação e Novos voluntários em AAAA, com descrições “Não arquivados” e “Início das atividades na AFAPAN no ano”. Ícones decorativos com aria-hidden, sem aparência de botão.

Estados próprios: carregando, sucesso e erro. Skeleton no carregamento; números só no sucesso. Erro com mensagem clara e botão Tentar novamente. Não reutilizar loading/total da listagem; falha de um fluxo não deve derrubar o outro nem exportação/cópia.

Manter contador de revisão das estatísticas na página. Incrementar somente após sucesso de cadastro assistido/edição, mudança de situação e arquivamento/restauração, antes de aguardar a atualização da lista. Componente de cards recarrega ao montar e ao mudar essa revisão. Alterações de filtros ou paginação não modificam a revisão nem as consultas dos cards. Se uma mutação falhar, não aplicar atualização otimista fictícia. Se a mutação funcionar e a estatística falhar depois, manter sucesso da mutação e erro recuperável apenas nos cards.

Cancelar/desconsiderar respostas de carregamentos antigos por identificador de requisição ou cleanup do efeito, inclusive ao desmontar ou trocar de sessão. Não permitir que retorno atrasado substitua um resultado mais recente. A verificação de sessão e as políticas existentes continuam sendo a proteção efetiva.

Para a tela aberta durante a virada do ano: verificar ano em intervalo de um minuto e quando a aba voltar a ficar visível; ao detectar mudança, atualizar o título e recarregar as contagens, descartando o resultado do ano anterior. Limpar listeners/timer ao desmontar. Isso não é sincronização de novos cadastros entre sessões; registros externos aparecem no próximo carregamento/reabertura ou tentativa manual.

## Banco, segurança e compatibilidade

Somente SELECT/count com RLS e papel autenticado já utilizados no módulo. Nenhuma migração, função, grant, índice ou política alterada; sem endpoint público e sem service_role no cliente. Não modificar cadastros, datas de início ou situações para ajustar números.

O schema versionado permite leitura autenticada de voluntários. Validar as permissões efetivas no ambiente remoto em etapa própria, sem ampliar RLS implicitamente em caso de erro. Queries count podem custar mais em bases grandes; testar comportamento local com mocks representativos, registrar limites remotos e avaliar otimização futura com aprovação se houver evidência de necessidade.

Compatibilidade: listar/copiar/exportar continuam com seus próprios contratos. Adicionar mocks do novo módulo nos testes de página existentes para impedir acesso real ao Supabase e manter os cenários atuais. Reversão: retirar componente, consulta e gatilhos de revisão; não há dados a restaurar.

## Testes e critérios

- Consultas: três contagens exatas com head, exclusão de arquivados, status corretos, ano/mês de início, sessão ausente, erro parcial e count nulo. Asserções de ausência de range/limit, filtros da tela e uso de criado_em.
- Regra anual: cadastro criado neste ano com início antigo excluído; criado antes com início atual incluído; início ausente/parcial excluído; ambas as origens e todas as situações consideradas. Ano no fuso brasileiro em instantes antes/depois da virada, sem depender do fuso do sistema.
- Componente: skeleton, números zero confirmados, erro/repetição, texto do ano, foco/teclado e estrutura responsiva; resposta atrasada não sobrescreve estado recente; transição de ano com relógio de teste e retorno à aba.
- Integração: cards não variam com filtros/página, recarregam após as mutações aprovadas e preservam a independência da listagem/exportação. Mutação com falha não simula alteração nos cards.
- Executar testes relevantes, suíte completa e TypeScript; build para validar a integração final. Registrar validation.md com CA-001 a CA-007 e limitações de ambiente. Não usar dados pessoais reais em fixtures.

## Escopo de autorização

- [x] Plano e tarefas aprovados para implementação local T-001 a T-005.
- [ ] Publicação e verificação remota T-006 autorizadas separadamente.
