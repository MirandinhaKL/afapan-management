# Cards estatísticos de voluntários

Data: 2026-10-15. Status: especificação aprovada pela responsável com revisão da regra anual; plano aprovado e implementação local concluída; publicação e validação remota pendentes.

## Objetivo

Adicionar três cards no topo da gestão de voluntários, abaixo das ações e acima da listagem, seguindo o padrão visual dos indicadores de Compostagem. Mostrar um resumo dos cadastros acessíveis à equipe, sem depender da página ou dos filtros.

## Definições aprovadas

- Ativos: cadastros não arquivados com situação atual ativo.
- Aguardando validação: cadastros não arquivados com situação atual aguardando_validacao.
- Novos voluntários em AAAA: voluntários não arquivados cujo ano de início das atividades na AFAPAN seja o ano atual, pelos campos inicio_atividades_mes e inicio_atividades_ano; incluir cadastro público e assistido, independentemente da situação atual. Não usar criado_em nem data de validação. Sem mês/ano de início informado, não contar neste indicador; não inferir data a partir de outros campos.
- O ano atual é definido em America/Sao_Paulo. O início é registrado como mês/ano, sem dia ou horário: comparar o ano de início ao ano atual e exigir mês válido (1 a 12). Mostrar o ano real no card, sem fixar 2026 no código.
- Os cards são totais globais autorizados, não resultados dos filtros. Arquivados não entram, inclusive quando a lista estiver filtrada para exibi-los.

Definições aprovadas pela responsável, incluindo sua correção explícita para considerar início na AFAPAN. Os indicadores podem se sobrepor: um voluntário que iniciou no ano pode também estar ativo ou aguardando validação; não são parcelas de um total exclusivo.

## Requisitos funcionais

- **RF-001:** apresentar cards Ativos, Aguardando validação e Novos voluntários em AAAA, com quantidade, ícone e descrição curta da regra de cada indicador.
- **RF-002:** aplicar as definições acima à base completa autorizada de não arquivados, sem usar apenas os registros carregados na página nem os filtros da listagem.
- **RF-003:** carregar estatísticas ao abrir a tela e atualizá-las após cadastro assistido, edição, mudança de situação, arquivamento e restauração realizados pela tela. Cadastro público feito em outra sessão aparece no próximo carregamento; atualização em tempo real entre sessões fica fora do escopo.
- **RF-004:** apresentar zero somente quando a consulta confirmar base vazia/contagem zero. Durante carregamento usar skeleton; em falha mostrar indisponibilidade e permitir tentar novamente, sem apresentar zero falso ou número antigo como atual.
- **RF-005:** manter listagem e estatísticas independentes em caso de falha, preservando filtros, paginação, exportação e demais ações. Os cards são informativos, sem navegação/filtro ao clicar nesta iniciativa.

## Requisitos não funcionais

- **RNF-001:** usar autenticação e RLS existentes, sem acesso público às contagens ou exposição de segredos. Somente leitura; não reclassificar cadastros nem mudar o banco sem plano e aprovação próprios.
- **RNF-002:** layout responsivo, três colunas em telas amplas e empilhamento no celular, rótulos legíveis e estados de erro/carregamento acessíveis. Evitar ícones como única identificação.
- **RNF-003:** buscar contagens completas sem depender do limite de linhas do Supabase; evitar transferir relatos/dados pessoais desnecessários para calcular números. Estratégia e consistência entre contagens serão definidas no plano técnico.
- **RNF-004:** criar testes de regras, virada do ano/fuso, exclusão de arquivados, independência de filtros e atualização/falhas. Executar testes relevantes, regressões e TypeScript; registrar validações remotas pendentes.

## Critérios de aceite

- **CA-001** (RF-001, RF-002): base com situações e arquivamentos variados retorna corretamente os totais Ativos e Aguardando validação; registros arquivados não contam.
- **CA-002** (RF-001, RF-002): card anual conta início das atividades no ano atual de America/Sao_Paulo, incluindo assistidos e públicos de qualquer situação não arquivados. Cadastro criado neste ano com início antigo não conta; cadastro criado em outro ano com início no atual conta. Sem início informado não conta. Testar mudança de ano no fuso adotado.
- **CA-003** (RF-002, RNF-003): com base maior que uma página/lote e filtros ativos, totais permanecem globais; nem o filtro de arquivados modifica as contagens.
- **CA-004** (RF-003): alterações bem-sucedidas da tela recarregam os cards; falha na mutação não simula novo total. Reabrir a tela incorpora novos cadastros de outras sessões.
- **CA-005** (RF-004, RF-005): carregamento não exibe zero falso; erro mostra indisponibilidade e nova tentativa sem impedir listagem/exportação. Base vazia validada mostra zero nos três cards.
- **CA-006** (RNF-001, RNF-002): somente equipe autorizada consulta os indicadores, sem mudar políticas/dados; celular, computador e estados acessíveis funcionam.
- **CA-007** (RNF-004): testes e TypeScript aprovados, com evidências e limitações registradas antes da conclusão.

## Riscos e limites

A responsável definiu início das atividades na AFAPAN como referência para o indicador anual. Registros sem mês/ano não entram; completar esses dados é uma ação cadastral separada, sem preenchimento automático nesta iniciativa. Arquivamento posterior retira o registro de todos os cards, inclusive do anual. São totais atuais, não série histórica de pessoas atendidas no ano. Uma consulta em curso pode coincidir com mudança em outra sessão; o plano deve explicar a consistência oferecida, sem prometer snapshot sem mecanismo que o garanta.

## Aprovação

- [x] Regras e especificação aprovadas pela responsável, com início na AFAPAN como referência anual.
- Plano técnico, tarefas e decisões preparados nesta iniciativa; implementação local autorizada pela aprovação do plano em 2026-10-15.
