# Especificação — Cadastro e confirmação de voluntários AFAPAN

- **Status:** Aprovada
- **Responsável:** AFAPAN
- **Data:** 2026-09-28
- **Última atualização:** 2026-09-29

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
- **RF-002:** O formulário deve coletar nome, sobrenome, data de nascimento, telefone com WhatsApp, e-mail opcional, endereço, disponibilidade, profissão opcional, habilidades opcionais, atividades de interesse e mês/ano opcionais de início das atividades na AFAPAN.
- **RF-003:** Bairro e cidade devem ser obrigatórios; rua, número, complemento e estado devem ser opcionais; CEP não deve ser solicitado.
- **RF-004:** O formulário deve permitir selecionar vários dias da semana, turnos e uma frequência pretendida, além de observações opcionais sobre disponibilidade.
- **RF-005:** O formulário deve permitir selecionar várias atividades de interesse.
- **RF-006:** O formulário deve apresentar separadamente as opções “Outras atividades”, com descrição, e “Ainda não sei, quero conhecer as opções”.
- **RF-007:** O formulário deve exigir uma confirmação de ciência sobre o uso dos dados pela AFAPAN.
- **RF-008:** O formulário deve exigir uma declaração de que a pessoa deseja continuar como voluntária e aceita ser contatada, inclusive para eventual inclusão em um novo grupo de WhatsApp.
- **RF-009:** Após um envio válido, o registro deve ser criado com a situação `Aguardando validação`.
- **RF-010:** Após o envio, o sistema deve apresentar confirmação clara e informar que a AFAPAN fará a validação.
- **RF-024:** Quando o voluntário for menor de 18 anos, o formulário deve solicitar nome, telefone e autorização do responsável.

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
- **RF-020:** A listagem deve permitir filtrar por situação, cidade, bairro, disponibilidade e atividades de interesse.
- **RF-021:** A equipe deve conseguir arquivar logicamente um cadastro sem apagar seu histórico.
- **RF-022:** A equipe deve conseguir consultar e restaurar cadastros arquivados.
- **RF-023:** O sistema deve registrar quem realizou e quando ocorreu cada criação assistida, edição, validação, mudança de situação, arquivamento e restauração.
- **RF-025:** Cadastros realizados diretamente pela equipe poderão ser salvos inicialmente como `Ativo`.
- **RF-026:** A campanha de confirmação deve possuir prazo padrão de uma semana.
- **RF-027:** Encerrado o prazo, cadastros ainda não confirmados devem ser alterados automaticamente para `Sem confirmação`.
- **RF-028:** A listagem principal deve apresentar telefone, idade e dia/mês do aniversário, preservando a data de nascimento completa no detalhamento interno.
- **RF-029:** Qualquer usuário autenticado da AFAPAN deve poder alterar o prazo da campanha de confirmação.
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
- **RN-013:** A pessoa pode selecionar mais de uma atividade, mais de um dia da semana e mais de um turno.
- **RN-014:** As opções de frequência da primeira versão serão `Eventual`, `Semanal`, `Quinzenal` e `Mensal`.
- **RN-015:** Os turnos disponíveis serão `Manhã`, `Tarde` e `Noite`, sem exigência de horário exato.
- **RN-016:** A confirmação de ciência sobre o uso dos dados e a declaração de interesse devem ser registradas separadamente, com data, hora e versão do texto aceito.
- **RN-017:** O cadastro não adiciona automaticamente a pessoa a nenhum grupo de WhatsApp.
- **RN-018:** Cadastros arquivados serão preservados por prazo indeterminado e não aparecerão na listagem padrão.
- **RN-019:** Cadastros assistidos pela equipe poderão iniciar como `Ativo`, pois a confirmação ocorre durante o atendimento.
- **RN-020:** A idade exibida deve ser calculada a partir da data de nascimento; a listagem mostrará apenas idade e dia/mês do aniversário.
- **RN-021:** Todos os usuários autenticados possuem permissão para alterar o prazo da campanha.
- **RN-022:** Os canais oficiais para solicitar correção são o e-mail `afapan.ong@gmail.com` e o WhatsApp `(54) 9941-9286`.
- **RN-023:** Quando o início das atividades for informado, mês e ano devem ser preenchidos em conjunto, formar uma competência válida e não podem representar uma data futura.
- **RN-024:** Na listagem, o início das atividades deve ser apresentado como `MM/AAAA`; quando ausente, deve ser apresentado como `Não informado`.

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

## 10. Cenários e exceções

### Confirmação pelo voluntário

1. A AFAPAN compartilha o link único no grupo atual de WhatsApp.
2. A pessoa abre a página sem realizar login.
3. Preenche os dados, disponibilidade e atividades de interesse.
4. Aceita separadamente as duas confirmações obrigatórias.
5. O sistema valida e salva o cadastro como `Aguardando validação`.
6. A equipe confere o telefone e decide se altera a situação para `Ativo`.

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
- **CA-016:** Dado o filtro por atividade, disponibilidade, cidade, bairro ou situação, então a listagem deve apresentar somente voluntários correspondentes.
- **CA-017:** Dada a seleção de “Outras atividades”, quando a descrição estiver vazia, então o envio deve ser bloqueado.
- **CA-018:** Dado um cadastro concluído, então nenhuma inclusão automática em grupo de WhatsApp deve ocorrer.
- **CA-019:** Dado um cadastro assistido pela equipe, quando houver confirmação durante o atendimento, então ele poderá ser salvo diretamente como `Ativo`.
- **CA-020:** Dado o encerramento do prazo de uma semana, quando existirem cadastros ainda não confirmados, então eles devem ser alterados automaticamente para `Sem confirmação`.
- **CA-021:** Dado um cadastro arquivado, então ele deve permanecer armazenado e oculto da listagem padrão, sem exclusão automática por tempo.
- **CA-022:** Dada a listagem principal, então ela deve exibir telefone, idade e dia/mês do aniversário sem apresentar a data de nascimento completa.
- **CA-023:** Dado qualquer usuário autenticado, quando alterar o prazo da campanha, então o novo prazo deve ser salvo e utilizado no processamento automático.
- **CA-024:** Dada uma tentativa pública duplicada ou uma orientação de correção, então o sistema deve apresentar o e-mail e o WhatsApp oficiais da AFAPAN.
- **CA-025:** Dado o formulário público, então os dois textos aprovados devem aparecer separadamente e exigir aceite individual.
- **CA-026:** Dado um cadastro com mês e ano válidos de início das atividades, quando ele for salvo, então a informação deve ser persistida e exibida como `MM/AAAA` na listagem.
- **CA-027:** Dado que somente o mês ou somente o ano foi preenchido, ou que a competência é futura, quando houver tentativa de salvar, então o sistema deve bloquear a operação com uma mensagem de validação.
- **CA-028:** Dado um cadastro sem início das atividades, quando ele for salvo e listado, então a ausência deve ser permitida e apresentada como `Não informado`.

## 12. Dados e privacidade

### Dados coletados

- Identificação: nome, sobrenome e data de nascimento.
- Contato: telefone com WhatsApp e e-mail opcional.
- Endereço: bairro e cidade obrigatórios; rua, número, complemento e estado opcionais.
- Perfil de contribuição: profissão, habilidades, disponibilidade, atividades de interesse e início opcional das atividades na AFAPAN.
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

## 15. Aprovação

- [x] Regras de negócio revisadas
- [x] Critérios de aceite revisados
- [x] Questões em aberto respondidas
- [x] Escopo e itens excluídos compreendidos
- [x] Especificação aprovada formalmente em 2026-09-29
