# Especificação — Cadastro e confirmação de voluntários AFAPAN

> Revisão aprovada em 2026-10-09: [cadastro permanente](../cadastro-voluntarios-permanente/specification.md) substitui as regras de campanha, prazo, ativação e expiração deste documento. RF-026, RF-027, RF-029, RF-033, RF-034 e os critérios/cenários associados são históricos e não orientam a implementação atual. O link permanece /voluntariado/cadastro; os novos consentimentos seguem a configuração permanente. Não instalar a migração 002 nem criar campanha como pré-requisito. Consulte o [plano atual](../cadastro-voluntarios-permanente/technical-plan.md) e o [roteiro de implantação](../cadastro-voluntarios-permanente/deployment.md).

- **Status:** Aprovada — revisão de ampliação do formulário público
- **Responsável:** AFAPAN
- **Data:** 2026-09-28
- **Última atualização:** 2026-10-01

## 1. Contexto e problema

A AFAPAN mantém um grupo de WhatsApp com pessoas que, em diferentes momentos, demonstraram interesse em atuar como voluntárias. Atualmente não existe uma base estruturada que permita identificar quem ainda deseja participar, quais atividades cada pessoa aceita realizar e quando está disponível.

A organização pretende compartilhar um único link no grupo atual para que os interessados confirmem sua permanência. As respostas serão validadas pela equipe da AFAPAN e servirão para formar um novo grupo com voluntários ativos. Como parte do público possui pouca familiaridade com tecnologia, a experiência deve ser simples e permitir cadastro assistido pela equipe.

## 2. Objetivo

Disponibilizar um módulo integrado ao sistema da AFAPAN para coletar, validar e manter os dados dos voluntários, identificar quem permanece ativo e apoiar a distribuição de atividades conforme disponibilidade, interesses, profissão e habilidades.

## 3. Usuários e partes interessadas

- Integrantes do grupo atual de voluntários da AFAPAN.
- Novas pessoas interessadas em realizar voluntariado.
- Equipe autenticada da AFAPAN responsável pela validação e manutenção dos registros.
- Coordenação das ações e projetos ambientais.

## 4. Escopo

### Incluído

- Página pública acessível por um único link compartilhável no WhatsApp.
- Autodeclaração de interesse em continuar como voluntário.
- Cadastro assistido e manutenção de registros pela equipe autenticada.
- Prevenção de duplicidade por telefone com WhatsApp.
- Validação interna antes de considerar o voluntário ativo.
- Consulta, busca, filtros, edição, alteração de situação e arquivamento lógico.
- Registro de disponibilidade, atividades de interesse, profissão e habilidades.
- Registro separado dos consentimentos obrigatórios.
- Histórico das mudanças de situação e das alterações administrativas relevantes.
- Interface pública acessível, responsiva e adequada a pessoas com pouca familiaridade com tecnologia.
- Endereço público amigável e fixo em `/voluntariado/cadastro`, sem dependência de campanha.
- Apresentação institucional acolhedora, com linguagem inspirada no formulário de referência da AFAPAN.
- Exibição da versão preparada da fotografia institucional dos voluntários, com o rosto da criança desfocado para reduzir sua identificação.
- Coleta de informações sobre expectativas, vínculo com a AFAPAN, experiência anterior de voluntariado, canais de comunicação, ideias de projetos e autorização de uso de imagem.

### Fora do escopo desta primeira versão

- Criação ou administração automática de grupos no WhatsApp.
- Envio automático de mensagens pelo WhatsApp.
- Login ou senha para o voluntário.
- Link individual de preenchimento ou edição.
- Edição direta pelo voluntário após o envio.
- Controle de presença em cada ação de voluntariado.
- Escalas automáticas de atividades.
- Relatórios avançados e painéis estatísticos.
- Coleta de grau de escolaridade.
- Coleta de CEP.

## 5. Requisitos funcionais

### Formulário público

- **RF-001:** O sistema deve disponibilizar uma página pública por um único endereço compartilhável, sem exigir login.
- **RF-002:** O formulário deve coletar nome, sobrenome, data de nascimento, telefone com WhatsApp, e-mail opcional, endereço, frequência de disponibilidade, profissão opcional, habilidades opcionais, atividades de interesse e mês/ano opcionais de início das atividades na AFAPAN.
- **RF-003:** Bairro e cidade devem ser obrigatórios; rua, número, complemento e estado devem ser opcionais; CEP não deve ser solicitado.
- **RF-004:** O formulário deve solicitar somente a frequência pretendida de participação, sem perguntar dias da semana, turnos ou horários disponíveis.
- **RF-005:** O formulário deve permitir selecionar várias atividades de interesse.
- **RF-006:** O formulário deve apresentar separadamente as opções “Outras atividades”, com descrição, e “Ainda não sei, quero conhecer as opções”.
- **RF-007:** O formulário deve exigir uma confirmação de ciência sobre o uso dos dados pela AFAPAN.
- **RF-008:** O formulário deve exigir uma declaração de que a pessoa deseja continuar como voluntária e aceita ser contatada, inclusive para eventual inclusão em um novo grupo de WhatsApp.
- **RF-009:** Após um envio válido, o registro deve ser criado com a situação `Aguardando validação`.
- **RF-010:** Após o envio, o sistema deve apresentar confirmação clara e informar que a AFAPAN fará a validação.
- **RF-024:** Quando o voluntário for menor de 18 anos, o formulário deve solicitar nome, telefone e autorização do responsável.
- **RF-032:** O formulário público deve estar disponível no endereço fixo `/voluntariado/cadastro`, sem identificador de campanha exposto na URL.
- **RF-033:** A rota pública utiliza configuração própria; novo cadastro não se associa a campanha histórica.
- **RF-034:** Ausência de campanha não bloqueia cadastro; falha técnica preserva os dados e permite tentar novamente.
- **RF-035:** O formulário deve apresentar uma introdução acolhedora, explicando brevemente o papel da AFAPAN, a importância do voluntariado e a finalidade das perguntas.
- **RF-036:** O formulário deve coletar o que a pessoa espera da AFAPAN e como conheceu a associação.
- **RF-037:** O formulário deve perguntar se a pessoa é ou já foi voluntária em outra instituição sem fins lucrativos, com as opções `Sim, atualmente`, `Já fui, mas não sou mais` e `Não`.
- **RF-038:** O formulário deve permitir indicar por quais meios a pessoa acompanha a AFAPAN, aceitando múltipla seleção entre `Instagram`, `Facebook`, `Rádio, TV ou jornal`, `Site`, `WhatsApp` e `Não acompanho`.
- **RF-039:** O formulário deve permitir informar, opcionalmente, uma ideia de projeto que a pessoa gostaria de criar ou desenvolver na AFAPAN.
- **RF-040:** O formulário deve perguntar separadamente se a pessoa autoriza o uso de sua imagem para divulgação institucional da AFAPAN, permitindo as respostas `Autorizo` e `Não autorizo` sem impedir o cadastro em caso de recusa.
- **RF-041:** O formulário deve permitir que a pessoa conte, opcionalmente, sua história e seu vínculo com a AFAPAN.
- **RF-042:** O formulário deve exibir a fotografia institucional preparada em `/voluntarios-afapan-rosto-crianca-desfocado.png`, em posição de destaque e com o texto alternativo `Voluntários da AFAPAN reunidos`. A versão original, na qual o rosto da criança está visível, não deve ser publicada pelo sistema.
- **RF-043:** Datas completas digitadas ou exibidas ao público devem usar o padrão brasileiro `dd/mm/aaaa`; campos compostos apenas por mês e ano devem usar `MM/AAAA`.
- **RF-044:** Na tela interna de voluntários, a área de busca e filtros deve iniciar recolhida e ser aberta ou fechada por um controle identificado como `Filtros`.
- **RF-045:** Quando existirem filtros aplicados, o controle deve indicar visualmente a quantidade de filtros ativos, mesmo com a área recolhida.
- **RF-046:** Recolher a área de filtros não deve remover nem alterar os filtros aplicados; a remoção deve ocorrer somente por alteração explícita ou pela ação `Limpar filtros`.
- **RF-047:** O formulário público não deve apresentar espaço vazio acima do cabeçalho verde e deve manter distância visual clara entre os rótulos e os respectivos campos.
- **RF-048:** Rótulos obrigatórios devem aparecer em negrito e conservar o asterisco; rótulos não obrigatórios não devem apresentar a palavra `opcional`.
- **RF-049:** Telefones digitados no formulário público devem receber máscara brasileira, aceitar no máximo 11 dígitos nacionais e continuar sendo normalizados antes da persistência.
- **RF-050:** A seção de atividades deve oferecer uma ação para marcar ou desmarcar todas as opções.
- **RF-051:** A data de nascimento deve ser validada ao completar o valor ou ao sair do campo, apresentando imediatamente uma mensagem para datas inválidas ou futuras.
- **RF-052:** O e-mail deve permanecer não obrigatório; quando preenchido, deve ser validado ao sair do campo e durante a correção de um valor inválido.
- **RF-053:** O título e as informações do cabeçalho verde do formulário público devem aparecer centralizados horizontal e verticalmente, sem deslocamento causado pelo ícone.
- **RF-054:** A seção de endereço deve usar o título `Endereço`.
- **RF-055:** A descrição apresentada ao selecionar `Outras atividades` deve permanecer disponível, mas não deve ser obrigatória.
- **RF-056:** O catálogo anterior de atividades deve ser substituído no formulário pelo novo catálogo agrupado por área, sem a opção `Outras atividades`.
- **RF-057:** O grupo `Preservação da Mata Atlântica`, identificado pelo ícone 🌱, deve oferecer `Plantio de árvores nativas` e `Retirada de plantas exóticas invasoras`.
- **RF-058:** O grupo `Reciclagem`, identificado pelo ícone ♻️, deve oferecer `Coletas mensais e especiais de resíduos`, `Mutirões de limpeza de áreas públicas` e `Ecopontos`.
- **RF-059:** O grupo `Compostagem`, identificado pelo ícone 🌱, deve oferecer `Compostagem doméstica` e `Compostagem nas escolas`.
- **RF-060:** O grupo `Educação Ambiental`, identificado pelo ícone 🌎, deve oferecer `Oficinas de conscientização`, `Acompanhamento de turmas no projeto Caminhos dos Resíduos` e `Palestras e atividades educativas`.
- **RF-061:** O grupo `Projetos e Eventos`, identificado pelo ícone 🤝, deve oferecer `Apoio e organização de projetos e eventos` e `Comunicação e divulgação`.
- **RF-062:** A opção `Ainda não sei, quero conhecer as opções` deve aparecer separada dos grupos, e a ação `Marcar todas as atividades` deve selecionar ou desmarcar todas as opções do novo catálogo.
- **RF-063:** Não é necessário preservar os interesses cadastrados segundo o catálogo anterior; a migração pode remover esses registros e substituir a estrutura de validação se isso simplificar o modelo e evitar dívida técnica.

### Duplicidade e correção

- **RF-011:** O telefone com WhatsApp deve identificar unicamente o cadastro, considerando uma versão normalizada do número.
- **RF-012:** Se o telefone já estiver cadastrado, o formulário público não deve criar nem substituir o registro.
- **RF-013:** Na tentativa duplicada, o sistema deve orientar a pessoa a procurar a AFAPAN para corrigir ou atualizar seus dados.
- **RF-014:** A resposta de duplicidade não deve revelar outros dados pessoais já cadastrados.

### Gestão interna

- **RF-015:** Usuários autenticados da AFAPAN devem poder cadastrar um voluntário em nome dele quando houver necessidade de atendimento assistido.
- **RF-016:** A equipe deve conseguir listar, buscar, filtrar e visualizar os dados completos dos voluntários.
- **RF-017:** A equipe deve conseguir editar os dados de um voluntário, inclusive corrigir o telefone.
- **RF-018:** A equipe deve conseguir alterar a situação entre `Aguardando validação`, `Ativo`, `Sem confirmação` e `Inativo`.
- **RF-019:** A validação de um registro deve exigir uma ação explícita da equipe antes de alterar sua situação para `Ativo`.
- **RF-020:** A listagem deve permitir filtrar por situação, cidade, bairro, frequência de disponibilidade e atividades de interesse.
- **RF-021:** A equipe deve conseguir arquivar logicamente um cadastro sem apagar seu histórico.
- **RF-022:** A equipe deve conseguir consultar e restaurar cadastros arquivados.
- **RF-023:** O sistema deve registrar quem realizou e quando ocorreu cada criação assistida, edição, validação, mudança de situação, arquivamento e restauração.
- **RF-025:** Cadastros realizados diretamente pela equipe poderão ser salvos inicialmente como `Ativo`.
- **RF-026:** Cadastro aberto continuamente, sem prazo. Substituído por RF-001 da iniciativa permanente.
- **RF-027:** Campanhas antigas não alteram automaticamente situações. Substituído por RF-007 permanente.
- **RF-028:** A listagem principal deve apresentar telefone, idade e dia/mês do aniversário, preservando a data de nascimento completa no detalhamento interno.
- **RF-029:** Controle de prazo removido. A equipe acessa o link fixo conforme RF-003 permanente.
- **RF-030:** As orientações para correção devem apresentar o e-mail `afapan.ong@gmail.com` e o WhatsApp `(54) 9941-9286`.
- **RF-031:** A listagem principal deve exibir o mês e o ano de início das atividades quando essa informação tiver sido cadastrada.

## 6. Requisitos não funcionais

- **RNF-001:** A página pública deve funcionar adequadamente em celulares e computadores.
- **RNF-002:** O formulário deve usar linguagem simples, campos claramente identificados, áreas de toque confortáveis e tipografia legível.
- **RNF-003:** A navegação deve ser possível por teclado e os controles devem possuir nomes acessíveis.
- **RNF-004:** O formulário deve preservar os dados já informados quando houver erro de validação recuperável.
- **RNF-005:** Dados pessoais não devem ser expostos em URLs, mensagens de erro, logs de cliente ou respostas de duplicidade.
- **RNF-006:** Usuários anônimos devem poder somente enviar um novo formulário por uma operação pública de escopo mínimo; não devem consultar, alterar ou excluir cadastros.
- **RNF-007:** Consultas e alterações administrativas devem exigir uma sessão autenticada da AFAPAN e respeitar políticas RLS.
- **RNF-008:** Nenhuma chave de serviço ou segredo deve ser exposto no navegador.
- **RNF-009:** A normalização e a unicidade do telefone devem ser garantidas no banco, não apenas na interface.
- **RNF-010:** O envio público deve possuir proteção contra abuso e submissões automatizadas, definida no plano técnico.
- **RNF-011:** Novos comportamentos e correções devem possuir testes unitários automatizados.
- **RNF-012:** A interface deve evitar termos técnicos e etapas desnecessárias para o voluntário.
- **RNF-013:** A fotografia deve ser otimizada para a web, manter sua proporção, adaptar-se à largura da tela e não prejudicar o carregamento do formulário.
- **RNF-014:** O formulário deve dividir as perguntas em grupos curtos e visualmente claros, evitando uma página excessivamente cansativa em celulares.
- **RNF-015:** Campos de data devem apresentar máscara, exemplo ou seletor compatível com o padrão brasileiro, sem depender da apresentação regional do navegador.
- **RNF-016:** O controle de expansão dos filtros deve ser acessível por teclado, informar seu estado aberto ou fechado e manter foco visível.

## 7. Regras de negócio

- **RN-001:** Nome, sobrenome, data de nascimento, telefone com WhatsApp, bairro e cidade são obrigatórios.
- **RN-002:** E-mail, rua, número, complemento, estado, profissão, habilidades, observações e mês/ano de início das atividades são opcionais.
- **RN-003:** O CEP e o grau de escolaridade não serão coletados.
- **RN-004:** Menores de 18 anos podem ser cadastrados, mas nome, telefone e autorização do responsável são obrigatórios.
- **RN-005:** O telefone deve ser armazenado de forma normalizada e não pode estar associado a mais de um cadastro não arquivado.
- **RN-006:** O e-mail, quando informado, deve possuir formato válido, mas não precisa ser único.
- **RN-007:** Um envio público nunca substitui os dados de um telefone já cadastrado.
- **RN-008:** Correções posteriores ao envio público devem ser realizadas pela equipe da AFAPAN.
- **RN-009:** A situação inicial de todo envio público é `Aguardando validação`.
- **RN-010:** Somente a equipe autenticada pode marcar um voluntário como `Ativo`.
- **RN-011:** `Sem confirmação` identifica pessoas conhecidas pela AFAPAN que ainda não confirmaram interesse; `Inativo` identifica quem não deseja ou não pode continuar no momento.
- **RN-012:** Registros arquivados não devem aparecer na listagem padrão.
- **RN-013:** A pessoa pode selecionar mais de uma atividade de interesse.
- **RN-014:** As opções de frequência da primeira versão serão `Diariamente`, `Uma vez por semana`, `A cada 15 dias`, `Uma vez por mês` e `Eventualmente`.
- **RN-015:** O formulário não deve coletar dias da semana, turnos, horários ou observações adicionais de disponibilidade; a frequência será a única informação de disponibilidade solicitada.
- **RN-016:** A confirmação de ciência sobre o uso dos dados e a declaração de interesse devem ser registradas separadamente, com data, hora e versão do texto aceito.
- **RN-017:** O cadastro não adiciona automaticamente a pessoa a nenhum grupo de WhatsApp.
- **RN-018:** Cadastros arquivados serão preservados por prazo indeterminado e não aparecerão na listagem padrão.
- **RN-019:** Cadastros assistidos pela equipe poderão iniciar como `Ativo`, pois a confirmação ocorre durante o atendimento.
- **RN-020:** A idade exibida deve ser calculada a partir da data de nascimento; a listagem mostrará apenas idade e dia/mês do aniversário.
- **RN-021:** Controle de prazo removido pela revisão permanente aprovada.
- **RN-022:** Os canais oficiais para solicitar correção são o e-mail `afapan.ong@gmail.com` e o WhatsApp `(54) 9941-9286`.
- **RN-023:** Quando o início das atividades for informado, mês e ano devem ser preenchidos em conjunto, formar uma competência válida e não podem representar uma data futura.
- **RN-024:** Na listagem, o início das atividades deve ser apresentado como `MM/AAAA`; quando ausente, deve ser apresentado como `Não informado`.
- **RN-025:** A URL fixa não depende de campanha e novos cadastros não recebem vínculo histórico.
- **RN-026:** Como os links anteriores ainda não foram divulgados, não haverá obrigação de manter compatibilidade com URLs no formato `/voluntariado/<identificador>`.
- **RN-027:** A recusa da autorização de uso de imagem não impede a pessoa de atuar como voluntária nem de concluir o cadastro.
- **RN-028:** As respostas sobre expectativas, origem do contato, experiência anterior, canais de comunicação, ideia de projeto e história com a AFAPAN são dados de perfil e não alteram automaticamente a situação do voluntário.
- **RN-029:** No navegador, datas completas devem ser compreendidas e apresentadas em `dd/mm/aaaa`; no banco ou nas APIs elas poderão permanecer no formato técnico ISO, sem exposição desse formato ao usuário.
- **RN-030:** As perguntas sobre expectativas, como conheceu a AFAPAN, experiência anterior de voluntariado e canais pelos quais acompanha a associação são opcionais.
- **RN-031:** O desfoque do rosto da criança é uma medida de redução de identificação e não representa, por si só, autorização de uso da imagem das demais pessoas retratadas.
- **RN-032:** A preferência de abertura ou fechamento dos filtros não precisa ser preservada após sair ou recarregar a tela; em uma nova abertura da página, a área deve iniciar recolhida.

## 8. Textos obrigatórios do formulário

### Ciência sobre o uso dos dados

> Declaro que li e estou ciente de que a AFAPAN utilizará os dados informados neste formulário para organizar ações de voluntariado, manter contato comigo e administrar o cadastro de voluntários, conforme o aviso de privacidade apresentado.

### Interesse e autorização de contato

> Confirmo que desejo continuar participando como voluntário(a) da AFAPAN e autorizo o contato pelos canais informados, inclusive pelo WhatsApp, bem como minha inclusão em um novo grupo de voluntários ativos.

As duas confirmações devem ser apresentadas separadamente e devem ser aceitas para concluir o envio.

## 9. Atividades de interesse

- Plantio de mudas de árvores.
- Coleta de resíduos.
- Limpeza em áreas públicas.
- Retirada de plantas exóticas de parques.
- Mutirão de conscientização ambiental.
- Acompanhamento de turma Caminhos dos Resíduos.
- Compostagem doméstica na escola.
- Ecopontos nos bairros.
- Outras atividades, com descrição.
- Ainda não sei, quero conhecer as opções.

As opções poderão ser apresentadas em grupos amigáveis que relacionem as atividades aos projetos da AFAPAN, incluindo coletas mensais ou especiais, Compostando Juntos, Compostando nas Escolas, Regenera Mata Atlântica, organização de eventos e projetos, comunicação digital e produção de conteúdo para o site, sem perder as atividades específicas já definidas nesta seção.

## 10. Cenários e exceções

### Confirmação pelo voluntário

1. A AFAPAN compartilha o link único no grupo atual de WhatsApp.
2. A pessoa abre `/voluntariado/cadastro` sem realizar login.
3. O sistema carrega a configuração permanente e apresenta a introdução, a fotografia institucional autorizada e o formulário.
4. A pessoa preenche os dados pessoais, o perfil de vínculo, a disponibilidade e as atividades de interesse utilizando datas no padrão brasileiro.
5. Aceita separadamente as duas confirmações obrigatórias.
6. O sistema valida e salva o cadastro como `Aguardando validação`.
7. A equipe confere o telefone e decide se altera a situação para `Ativo`.

### Cadastro assistido

1. A pessoa fornece os dados à equipe por um canal de atendimento.
2. Um usuário autenticado cadastra o voluntário na área interna.
3. O sistema registra que a criação foi assistida e qual usuário a realizou.
4. A equipe define a situação adequada conforme a confirmação recebida.

### Tentativa duplicada

1. A pessoa envia um telefone já cadastrado.
2. O sistema não cria nem atualiza o cadastro.
3. A página informa apenas que já existe uma resposta para o telefone e orienta procurar a AFAPAN.

### Exceções

- Dados inválidos devem permanecer disponíveis para correção e não devem ser gravados.
- Falha de rede deve apresentar mensagem compreensível e evitar sucesso falso.
- Uma alteração administrativa concorrente deve ser detectada para evitar sobrescrever dados mais recentes.
- Telefone com formatação diferente, mas com os mesmos dígitos e código do país, deve ser reconhecido como duplicado.
- Se “Outras atividades” for selecionada, a descrição correspondente deve ser obrigatória.
- Ausência de campanha não impede cadastro. Falha técnica mantém os campos e apresenta mensagem recuperável.
- Uma data apresentada fora do padrão brasileiro deve ser indicada de forma clara para correção, preservando os demais dados preenchidos.

## 11. Critérios de aceite

- **CA-001:** Dado o link compartilhado, quando uma pessoa acessar a página, então deve conseguir iniciar o formulário sem autenticação.
- **CA-002:** Dado um formulário válido e um telefone ainda não cadastrado, quando a pessoa enviar, então o cadastro deve ser salvo como `Aguardando validação`.
- **CA-003:** Dado um telefone já cadastrado, quando houver novo envio público, então nenhum dado deve ser criado ou substituído e a pessoa deve ser orientada a procurar a AFAPAN.
- **CA-004:** Dado um endereço sem rua, número, complemento ou estado, quando bairro e cidade estiverem preenchidos, então o formulário deve permitir o envio.
- **CA-005:** Dado que uma das duas confirmações obrigatórias não foi aceita, quando houver tentativa de envio, então o cadastro deve ser bloqueado.
- **CA-006:** Dado um envio bem-sucedido, então o sistema deve armazenar separadamente os dois consentimentos, suas versões e o momento do aceite.
- **CA-007:** Dado um usuário anônimo, quando tentar consultar ou alterar cadastros pela API pública, então o acesso deve ser negado.
- **CA-008:** Dado um usuário autenticado, quando realizar um cadastro assistido válido, então o voluntário deve ser salvo e a autoria da operação registrada.
- **CA-009:** Dado um cadastro aguardando validação, quando a equipe confirmar sua identidade, então deve conseguir marcá-lo como `Ativo`.
- **CA-010:** Dado um voluntário ativo, quando a equipe editar disponibilidade, interesses ou dados pessoais, então os novos valores devem ser exibidos e a alteração deve ser auditada.
- **CA-011:** Dado um cadastro arquivado, quando a listagem padrão for aberta, então ele não deve aparecer; quando o filtro de arquivados for utilizado, deve poder ser consultado e restaurado.
- **CA-012:** Dado um telefone formatado de maneira diferente, quando os dígitos normalizados já existirem, então o sistema deve tratá-lo como duplicado.
- **CA-013:** Dado um acesso por celular, quando o formulário for preenchido, então todos os campos e ações essenciais devem permanecer legíveis e utilizáveis.
- **CA-014:** Dada uma pessoa com pouca familiaridade tecnológica, então o formulário deve poder ser concluído sem conta, senha, link individual ou termos técnicos.
- **CA-015:** Dado um menor de 18 anos, quando os dados ou a autorização do responsável não forem informados, então o envio deve ser bloqueado.
- **CA-016:** Dado o filtro por atividade, frequência de disponibilidade, cidade, bairro ou situação, então a listagem deve apresentar somente voluntários correspondentes.
- **CA-017:** Dada a seleção de “Outras atividades”, quando a descrição estiver vazia, então o envio deve ser bloqueado.
- **CA-018:** Dado um cadastro concluído, então nenhuma inclusão automática em grupo de WhatsApp deve ocorrer.
- **CA-019:** Dado um cadastro assistido pela equipe, quando houver confirmação durante o atendimento, então ele poderá ser salvo diretamente como `Ativo`.
- **CA-020:** Vencimento de campanha histórica não altera situação (CA-006 permanente).
- **CA-021:** Dado um cadastro arquivado, então ele deve permanecer armazenado e oculto da listagem padrão, sem exclusão automática por tempo.
- **CA-022:** Dada a listagem principal, então ela deve exibir telefone, idade e dia/mês do aniversário sem apresentar a data de nascimento completa.
- **CA-023:** Não há edição de prazo; link permanece acessível sem configuração de campanha (CA-003 permanente).
- **CA-024:** Dada uma tentativa pública duplicada ou uma orientação de correção, então o sistema deve apresentar o e-mail e o WhatsApp oficiais da AFAPAN.
- **CA-025:** Dado o formulário público, então os dois textos aprovados devem aparecer separadamente e exigir aceite individual.
- **CA-026:** Dado um cadastro com mês e ano válidos de início das atividades, quando ele for salvo, então a informação deve ser persistida e exibida como `MM/AAAA` na listagem.
- **CA-027:** Dado que somente o mês ou somente o ano foi preenchido, ou que a competência é futura, quando houver tentativa de salvar, então o sistema deve bloquear a operação com uma mensagem de validação.
- **CA-028:** Dado um cadastro sem início das atividades, quando ele for salvo e listado, então a ausência deve ser permitida e apresentada como `Não informado`.
- **CA-029:** A rota /voluntariado/cadastro mostra o formulário independentemente de campanha; cadastro aguardando validação e campaign_id nulo.
- **CA-030:** Ausência de campanha não impede abertura ou envio (CA-001 permanente).
- **CA-031:** Dado o formulário público, então sua introdução deve explicar de forma acolhedora quem é a AFAPAN, por que os dados são solicitados e como a pessoa pode colaborar.
- **CA-032:** Dado um campo de data completa, então o usuário deve visualizar e informar a data como `dd/mm/aaaa`; dado o início das atividades, deve visualizar e informar `MM/AAAA`.
- **CA-033:** Dada a resposta `Não autorizo` para uso de imagem, quando os demais campos obrigatórios estiverem válidos, então o cadastro deve ser permitido e a recusa armazenada.
- **CA-034:** Dadas as perguntas de perfil do formulário de referência, quando o cadastro for salvo e consultado internamente, então as respostas devem ser preservadas e exibidas no detalhamento do voluntário.
- **CA-035:** Dada a fotografia institucional preparada, quando o formulário for acessado em celular ou computador, então a imagem deve aparecer sem distorção, com o rosto da criança desfocado, texto alternativo e sem causar rolagem horizontal.
- **CA-036:** Dadas as novas perguntas de perfil, quando elas não forem respondidas e os demais campos obrigatórios estiverem válidos, então o cadastro deve poder ser concluído.
- **CA-037:** Dada a seção de disponibilidade do formulário, então ela deve apresentar somente a seleção de frequência e não deve exibir campos de dias da semana, turnos, horários ou observações.
- **CA-038:** Dada a abertura da tela de voluntários, então a área de busca e filtros deve aparecer recolhida e a listagem deve permanecer visível.
- **CA-039:** Dado o controle `Filtros`, quando o usuário acioná-lo, então a área deve alternar entre aberta e recolhida sem recarregar a página.
- **CA-040:** Dados filtros aplicados, quando a área for recolhida, então os resultados filtrados devem permanecer e o controle deve informar quantos filtros estão ativos.
- **CA-041:** Dados filtros aplicados, quando o usuário acionar `Limpar filtros`, então todos os filtros devem voltar aos valores iniciais e a indicação de filtros ativos deve desaparecer.
- **CA-042:** Dado o formulário público, então o cabeçalho verde deve iniciar no topo do card, sem faixa branca, e os rótulos devem ter espaçamento perceptível em relação aos campos.
- **CA-043:** Dados campos obrigatórios e não obrigatórios, então somente os obrigatórios devem ter rótulo em negrito com `*`, e nenhum rótulo deve conter `(opcional)`.
- **CA-044:** Dado um telefone digitado ou colado com DDD, então o campo deve exibir a máscara `(DD) 99999-9999`, descartar dígitos excedentes e preservar a normalização usada no envio.
- **CA-045:** Dada a ação `Marcar todas as atividades`, quando acionada, então todas as atividades devem ser selecionadas; quando acionada novamente, todas devem ser desmarcadas.
- **CA-046:** Dada uma data de nascimento completa inválida ou futura, então o campo deve apresentar o erro antes do envio do formulário; uma correção válida deve remover o erro.
- **CA-047:** Dado um e-mail vazio, então o formulário deve aceitá-lo; dado um e-mail preenchido em formato inválido, então o erro deve aparecer junto ao campo antes do envio e desaparecer após a correção.
- **CA-048:** Dado o cabeçalho verde, então o título e as informações da campanha devem ocupar o centro horizontal e vertical da área; o ícone deve permanecer à esquerda sem deslocar o texto.
- **CA-049:** Dada a seção que reúne bairro, cidade e demais dados de localização, então seu título deve ser `Endereço`.
- **CA-050:** Dada a seleção de `Outras atividades`, então a descrição adicional deve ser exibida sem asterisco e sua ausência não deve bloquear o cadastro.
- **CA-051:** Dado o formulário público, quando a seção de interesses for exibida, então as atividades devem aparecer nos cinco grupos aprovados, com seus ícones e textos correspondentes.
- **CA-052:** Dado o novo catálogo, então `Outras atividades` não deve ser oferecida e as novas opções devem ser aceitas pelo frontend, API e banco.
- **CA-053:** Dada a ação `Marcar todas as atividades`, então todas as opções dos cinco grupos e a opção independente devem ser selecionadas ou desmarcadas em conjunto.
- **CA-054:** Dada a migração do catálogo, então os interesses antigos podem ser removidos, mas voluntários, campanhas, consentimentos e demais dados não relacionados devem ser preservados.
- **CA-055:** Após a migração, então nenhuma restrição, tipo ou código legado específico do catálogo anterior deve permanecer em uso pela aplicação.

## 12. Dados e privacidade

### Dados coletados

- Identificação: nome, sobrenome e data de nascimento.
- Contato: telefone com WhatsApp e e-mail opcional.
- Endereço: bairro e cidade obrigatórios; rua, número, complemento e estado opcionais.
- Perfil de contribuição: profissão, habilidades, frequência de disponibilidade, atividades de interesse, início opcional das atividades na AFAPAN, expectativas, experiência anterior, canais pelos quais acompanha a associação, ideias de projetos e história de vínculo.
- Preferência de imagem: autorização ou recusa para uso da imagem em divulgação institucional.
- Governança: situação, origem do cadastro, consentimentos, datas e autoria das operações administrativas.

### Princípios e restrições

- Coletar somente os dados definidos nesta especificação e necessários às finalidades informadas.
- Informar, antes do envio, para que os dados serão utilizados e como a pessoa pode solicitar correção.
- Não tornar cadastros acessíveis publicamente.
- Não revelar a existência ou o conteúdo de um cadastro além da mensagem genérica de duplicidade.
- Restringir a consulta completa à equipe autenticada.
- Registrar a versão dos textos de consentimento para permitir rastreabilidade.
- Para menores, os dados e a autorização do responsável devem ser protegidos pelas mesmas regras de acesso aplicadas aos demais dados pessoais.
- Cadastros arquivados serão mantidos por prazo indeterminado por decisão da AFAPAN e permanecerão ocultos da listagem padrão.

## 13. Dependências e restrições

- Aplicação web atual da AFAPAN.
- Supabase para persistência, autenticação, RLS e operações transacionais.
- Existência de usuários autenticados responsáveis pela gestão interna.
- Manutenção do e-mail e do número de WhatsApp oficiais informados pela AFAPAN.
- O sistema não utilizará integração com WhatsApp nesta primeira versão.

## 14. Questões em aberto

- [x] **Q-001:** Exibir idade e dia/mês do aniversário na listagem; manter a data completa somente no detalhamento interno.
- [x] **Q-002:** Apresentar o e-mail `afapan.ong@gmail.com` e o WhatsApp `(54) 9941-9286`.
- [x] **Q-003:** O cadastro assistido poderá ser marcado diretamente como `Ativo`.
- [x] **Q-004:** O prazo padrão será de uma semana e qualquer usuário autenticado poderá alterá-lo.
- [x] **Q-005:** Após o prazo, a mudança para `Sem confirmação` será automática.
- [x] **Q-006:** A listagem principal exibirá telefone, idade e dia/mês do aniversário, além da identificação e situação necessárias à gestão.
- [x] **Q-007:** Cadastros arquivados serão mantidos por prazo indeterminado e não serão exibidos na listagem padrão.
- [x] **Q-008:** Menores exigirão nome, telefone e autorização do responsável.
- [x] **Q-009:** Os dois textos propostos foram aprovados e estão registrados na seção 8.
- [x] **Q-010:** A AFAPAN decidiu publicar a fotografia preparada com o rosto da criança desfocado, ciente de que não possui autorização expressa das demais pessoas retratadas e de que o desfoque não substitui essas autorizações.
- [x] **Q-011:** As perguntas sobre expectativas e como conheceu a AFAPAN serão opcionais.
- [x] **Q-012:** A pergunta sobre experiência anterior de voluntariado será opcional.
- [x] **Q-013:** A seleção dos meios pelos quais a pessoa acompanha a AFAPAN será opcional.

## 15. Aprovação

- [x] Revisão de 2026-10-01 das regras de negócio revisada
- [x] Novos critérios de aceite revisados
- [x] Novas questões em aberto respondidas
- [x] Ampliação do formulário e novo endereço público compreendidos
- [x] Revisão aprovada formalmente em 2026-10-01
