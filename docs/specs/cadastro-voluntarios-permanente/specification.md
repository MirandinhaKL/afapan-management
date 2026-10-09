# Especificação — Cadastro permanente de voluntários AFAPAN

- **Status:** Aprovada em 2026-10-09; plano aprovado e implementação local preparada.
- **Data:** 2026-10-09.
- **Responsável:** AFAPAN.
- **Origem:** A responsável informou que voluntários devem poder se cadastrar em qualquer período e que precisa apenas acessar e compartilhar o link do formulário.
- **Referência:** `../cadastro-voluntarios/specification.md`, com substituições indicadas abaixo.

## 1. Objetivo

Disponibilizar o cadastro de novos voluntários continuamente, sem exigir criação de campanha, data/hora limite ou ativação. Na gestão interna, oferecer acesso direto ao link e uma ação de cópia.

Em produção, o endereço será `https://gestao.afapan.com.br/voluntariado/cadastro`. A rota existente será preservada.

## 2. Contexto

Atualmente o formulário consulta uma campanha ativa, exibe prazo e associa o cadastro à campanha. A gestão interna exige campanha ativa para copiar o link. Existe ainda um processamento de campanhas expiradas que pode alterar voluntários para `Sem confirmação`.

A responsável dispensou essa lógica antes de prosseguir com a correção do timeout de `save_volunteer_campaign`. Corrigir o salvamento de campanhas deixa de ser o objetivo; o novo fluxo não depende dessa operação.

## 3. Escopo

### Incluído

- Acesso e envio público em qualquer período, sem campanha ou janela de inscrição.
- Link fixo acessível e copiável na tela interna de voluntários.
- Retirada do botão, diálogo e resumo de campanha da interface interna.
- Retirada de prazo, nome de campanha e estado ativa/inativa do formulário público.
- Retirada da dependência de campanha nas operações de cadastro em uso.
- Desativação do processamento de expiração e de seu agendamento, caso exista no ambiente.
- Preservação de voluntários, campanhas históricas, vínculos existentes, interesses, consentimentos, auditoria e histórico.
- Textos adequados a novos interessados e registro dos consentimentos independentemente de campanha.

### Fora do escopo

- Login para o voluntário, edição pública posterior ou inclusão automática em WhatsApp.
- Eliminação de registros históricos de campanhas ou alteração em massa das situações atuais.
- Remoção de datas pessoais ou operacionais: nascimento, início das atividades, datas de aceite, criação e atualização permanecem.
- Nova tela de configuração de inscrições, calendário ou controle de abertura/fechamento.
- Execução da migração 005 do catálogo ou qualquer outra operação remota sem autorização específica.

## 4. Requisitos funcionais

- **RF-001:** O formulário deve abrir em `/voluntariado/cadastro`, sem login, em qualquer data e horário, independentemente de existir campanha, de sua situação ou de seu prazo.
- **RF-002:** Um envio válido deve criar um voluntário como `Aguardando validação`, sem exigir campanha ou associá-lo automaticamente a uma campanha histórica.
- **RF-003:** A tela interna deve apresentar uma ação `Copiar link` disponível sem configuração prévia e o endereço completo do formulário, com opção de abri-lo.
- **RF-004:** A cópia deve informar sucesso somente após copiar; se falhar, deve manter o endereço visível para cópia manual. Nenhuma consulta ou gravação de campanha deve ser necessária.
- **RF-005:** A interface interna não deve apresentar botão `Campanha`, diálogo de campanha, prazo ou indicadores de campanha ativa/inativa.
- **RF-006:** O formulário público deve apresentar o título institucional e a finalidade do cadastro, sem nome de campanha ou mensagem `Responda até`.
- **RF-007:** A expiração de uma campanha histórica não deve alterar situações de voluntários nem bloquear novos cadastros. O processamento automático por prazo e o respectivo agendamento devem deixar de operar.
- **RF-008:** Os textos de ciência sobre uso dos dados e de interesse/autorização de contato devem continuar separados, obrigatórios e registrados com texto, versão, data e hora, sem depender de campanha.
- **RF-009:** As validações, bloqueio de telefone duplicado, autorização de responsável para menores, frequência, catálogo de interesses e campos de perfil existentes devem continuar funcionando.
- **RF-010:** Cadastros, situações e registros históricos existentes devem ser preservados. Não haverá reclassificação automática dos voluntários já marcados como `Sem confirmação`.
- **RF-011:** Cadastro assistido, edição, validação pela equipe, filtros, arquivamento e restauração devem continuar disponíveis.
- **RF-012:** Uma falha técnica deve apresentar mensagem compreensível, preservar os dados digitados e não informar sucesso falso; não deve ser descrita como encerramento de período de inscrição.

## 5. Requisitos não funcionais

- **RNF-001:** Manter RLS, autenticação administrativa, proteção contra abuso, privacidade e segredos somente no servidor.
- **RNF-002:** Manter acessibilidade, funcionamento em celular e computador, máscaras e formatos brasileiros dos campos de data e telefone.
- **RNF-003:** Cobrir os novos comportamentos e regressões aplicáveis com testes unitários; executar testes relevantes, suíte completa, TypeScript e build antes da implantação.
- **RNF-004:** O plano técnico deverá registrar impacto no banco, políticas RLS, migração, compatibilidade entre aplicação e banco, estratégia de reversão e verificações remotas.
- **RNF-005:** Preservar todos os dados do módulo nesta iniciativa. A autorização anterior para substituir interesses pertence exclusivamente à iniciativa do catálogo e não autoriza exclusões nesta mudança.
- **RNF-006:** Registrar limitações de ambiente e não declarar validação remota concluída sem evidências.

## 6. Regras de negócio e textos

1. O cadastro fica aberto continuamente; não haverá campanha oculta, prazo artificialmente distante ou ativação usada como requisito de inscrição.
2. `Aguardando validação` continua sendo a situação inicial do cadastro público; somente a equipe poderá torná-lo `Ativo`.
3. `Sem confirmação` permanece para registros históricos e classificação manual pela equipe, sem mudança automática por passagem do tempo.
4. A remoção do controle de data/hora se refere ao prazo de inscrição. Datas pessoais, registros de consentimento e metadados de auditoria permanecem.
5. Novos consentimentos devem utilizar textos versionados próprios do formulário permanente; consentimentos antigos não serão reescritos.
6. Texto proposto para a declaração de interesse, adequado a novos voluntários:

> Confirmo que desejo participar como voluntário(a) da AFAPAN e autorizo o contato pelos canais informados, inclusive pelo WhatsApp, bem como minha inclusão no grupo de voluntários ativos.

7. O texto de ciência sobre uso dos dados permanece:

> Declaro que li e estou ciente de que a AFAPAN utilizará os dados informados neste formulário para organizar ações de voluntariado, manter contato comigo e administrar o cadastro de voluntários, conforme o aviso de privacidade apresentado.

8. Não será criada uma nova interface para editar esses textos nesta iniciativa. Seu armazenamento e versionamento serão definidos no plano técnico.

## 7. Critérios de aceite

- **CA-001** (`RF-001`, `RF-006`): sem nenhuma campanha cadastrada, abrir a rota mostra o formulário e permite preencher e enviar; não exibe prazo.
- **CA-002** (`RF-001`, `RF-002`): campanhas históricas inativas ou vencidas não impedem o cadastro e não recebem associação automática de novos voluntários.
- **CA-003** (`RF-003`, `RF-004`): a equipe consegue abrir e copiar o endereço completo sem criar/ativar campanha; sucesso e falha de cópia são informados corretamente e o endereço permanece disponível.
- **CA-004** (`RF-005`, `RF-006`): as interfaces interna e pública não apresentam os controles ou informações de campanha removidos.
- **CA-005** (`RF-002`, `RF-008`): um cadastro público válido é salvo como `Aguardando validação` com os dois consentimentos e suas versões, textos e instantes de aceite.
- **CA-006** (`RF-007`, `RF-010`): o vencimento de uma campanha antiga não altera situações; não existe agendamento operante para essa transição.
- **CA-007** (`RF-009`, `RNF-001`): telefone duplicado é rejeitado sem substituir cadastro ou revelar dados; menores continuam exigindo responsável e autorização; proteção contra abuso permanece.
- **CA-008** (`RF-010`, `RNF-005`): migração preserva cadastros, interesses, consentimentos e histórico, incluindo associações históricas de campanhas, sem mudar situações existentes.
- **CA-009** (`RF-011`): os fluxos administrativos existentes continuam funcionando sem carregar ou salvar campanha.
- **CA-010** (`RF-012`): uma falha recuperável mantém os valores preenchidos, mostra mensagem adequada e não exibe confirmação de envio.
- **CA-011** (`RNF-002`): link, cópia e formulário são utilizáveis por teclado e em telas móveis.
- **CA-012** (`RNF-001`, `RNF-003`, `RNF-006`): testes, TypeScript e build passam; evidências remotas de RPCs, RLS, agendamento e preservação são registradas antes da conclusão integral.

## 8. Substituição das regras anteriores

Após aprovação desta revisão, os requisitos `RF-026`, `RF-027`, `RF-029`, `RF-033` e `RF-034` da especificação de cadastro-voluntarios deixam de exigir campanha, prazo, ativação ou fechamento de inscrições. `RF-032` mantém o endereço fixo. `RF-008` passa a usar a declaração de interesse adequada a novos voluntários.

As decisões anteriores `DEC-010`, `DEC-011` e a dependência de campanha ativa em `DEC-020` serão substituídas. Cenários e critérios antigos que exigem campanha, prazo ou expiração serão reconciliados no planejamento, preservando os demais requisitos.

A especificação de correção de salvamento de campanha fica substituída por esta iniciativa; o diagnóstico de timeout permanece apenas como registro histórico.

## 9. Riscos e validação

- Remover só a interface não resolve a dependência da RPC; aplicação e banco precisam ser alinhados.
- Um agendamento antigo ainda habilitado pode continuar alterando voluntários. Conferir sua presença no ambiente e impedir essa transição faz parte da validação.
- O processamento atual de expiração também limpa tentativas antigas de envio. A proteção contra abuso e a manutenção desses registros temporários não devem ser perdidas; a solução será definida no plano.
- A campanha atualmente fornece os textos de consentimento. O novo fluxo deve garantir a correspondência entre texto exibido e texto/versão registrados sem alterar aceites antigos.
- Histórico e dados de campanhas existentes serão preservados; o plano deverá definir como retirar as dependências operacionais sem apagá-los.
- A migração do novo catálogo tem seu próprio estado de implantação. O plano deverá considerar a versão real do banco, sem executar a migração 005 implicitamente.

## 10. Aprovação

- [x] Especificação revisada e aprovada pela responsável em 2026-10-09, pela mensagem “Aprovado”.
- Planejamento técnico e tarefas preparados após a aprovação; plano aprovado em 2026-10-09.
- Implementação local autorizada; operações remotas e publicação continuam pendentes de autorização específica.
