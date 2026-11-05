# Conecta AFAPAN — Horas complementares e certificados

Data inicial: 2026-10-23. Revisão com resposta da PO: 2026-10-28. Status: regras confirmadas consolidadas e continuidade autorizada para planejamento; propostas complementares P-001 a P-010 e plano aprovados para implementação local em 2026-11-03. Operações remotas, envio real e emissão real não autorizados. Referência visual: journeys.md e os dois vídeos enviados; acesso autenticado ao MVP não foi validado pela ferramenta.

Nome sugerido pela PO: **Conecta AFAPAN**. Proposta de parceria com universidades para participação de estudantes em projetos socioambientais em troca de horas complementares. Catálogo detalhado e etapas em programa-conecta-afapan.md. Esclarecimentos dos áudios em po-audios-summary.md e diretrizes em decisions.md; a dúvida da transcrição sobre anexos foi resolvida por resposta escrita da PO: comprovação obrigatória. A mensagem “certo, podemos seguir” autoriza avançar no planejamento das regras confirmadas. As escolhas de fechamento estão identificadas como propostas no plano técnico; não há autorização de implementação ou operações remotas.

## Objetivo e escopo

Incorporar ao gerenciador AFAPAN um módulo para receber atividades de alunos, analisar horas complementares, gerar certificado e enviar o PDF assinado por e-mail, com consulta pública por código. Usar identidade visual e autenticação interna do gerenciador; não criar um segundo login administrativo apenas para reproduzir o MVP.

Jornadas públicas: registro de atividade e consulta de autenticidade. Jornada administrativa: fila, detalhe/histórico, aprovação/recusa, download, assinatura externa, upload e envio/reenvio. Arquivos e dados do MVP não serão migrados automaticamente; eventual importação requer escopo e autorização próprios.

## Requisitos funcionais propostos

### Revisão de correções do formulário público — 2026-11-04

- **RF-019 — Espaçamento:** manter separação visual confortável entre cada rótulo e seu campo, inclusive nos campos em grade e campos condicionais.
- **RF-020 — Validação de e-mail:** validar formato e tamanho no navegador e no servidor. Mensagens identificam o campo e preservam os dados digitados.
- **RF-021 — Máscaras:** formatar CPF como `000.000.000-00` e WhatsApp em formato brasileiro durante a digitação. Aceitar colagem e normalizar para dígitos antes de validar e persistir.
- **RF-022 — Envio:** o botão “Enviar para validação” submete pela jornada normal, indica processamento, impede envios concorrentes e confirma somente após persistência. Falhas em banco, reserva de anexos ou armazenamento devem ser informadas sem limpar o formulário, permitindo nova tentativa.

Critérios de aceite desta revisão:

- **CA-019:** espaçamento consistente entre rótulos e controles.
- **CA-020:** e-mail inválido é indicado no formulário e rejeitado também pela API.
- **CA-021:** máscaras aceitam digitação e colagem; payload contém valores normalizados e compatíveis com validação de servidor.
- **CA-022:** envio válido percorre upload e gravação, confirma após persistência; falhas preservam os campos e permitem retentativa.

- **RF-001:** oferecer link público para registrar atividade, sem exigir login do aluno, com nome completo, CPF, data de nascimento completa (para conferência na solicitação de reenvio), WhatsApp, instituição, curso, e-mail, Instagram opcional, atividade, data e relato. Os demais campos são propostos como obrigatórios, sujeitos à aprovação.
- **RF-002:** substituir o catálogo do MVP pela proposta da PO: Compostando Juntos (10 h), Compostando nas Escolas (12 h), Marketing A — redes sociais (7 h), Marketing B — materiais educativos/institucionais (16 h), Eco Drive (5 h por ação), Caminhos dos Resíduos (5 h por visita), Oficinas/palestras/eventos/mutirões (12 h) e Visitas técnicas (descrição e horas informadas pelo voluntário e conferidas pela equipe, sem carga fixa). Preservar etapas e distribuição em programa-conecta-afapan.md. Cargas são sugeridas por tarefa; apresentar checklist e somar apenas as tarefas efetivamente realizadas e reconhecidas na análise. Exemplo confirmado: primeira tarefa de Compostando nas Escolas rende 6 h; todas rendem 12 h. O aluno marca as tarefas realizadas e a equipe pode revisar, desmarcar entregas não realizadas e corrigir erros antes de aprovar. Não aplicar automaticamente o teto genérico de 10 h do MVP.
- **RF-003:** validar CPF, formatos de telefone/e-mail, data e dados obrigatórios no servidor e na interface. Propor rejeitar atividade futura. Confirmar recebimento apenas após persistência; falhas preservam os campos e não indicam envio de certificado.
- **RF-004:** criar solicitação Pendente e permitir registrar outra atividade. Cada solicitação identifica projeto/modalidade e execução; confirmar se as tarefas podem abranger período de vários dias. Registros adicionais do aluno compõem seu histórico. Não substituir solicitações anteriores pelo novo envio.
- **RF-005:** na gestão interna, apresentar número de pendências, busca por nome/CPF, paginação e estados Pendentes, Aprovadas sem envio, Certificados enviados, Recusadas e Todas. Mostrar ficha, dados do aluno e histórico de solicitações, com total de horas aprovadas na mesma categoria.
- **RF-006:** permitir aprovação e recusa por equipe autorizada, registrando autor, data/hora e decisão. Motivo de recusa obrigatório proposto e comunicado por e-mail. Aprovação registra a soma das horas das tarefas realizadas e reconhecidas, com checklist e memória da distribuição aplicada; em Visitas técnicas, confere e aprova a carga informada conforme RF-017. Preservar o que o aluno declarou e o que a equipe revisou, com autoria e justificativa das mudanças. Não conceder o projeto inteiro por execução parcial. Não impor teto acumulado por aluno, modalidade, ano ou programa: novas participações válidas podem somar horas sem limitação acumulada. Preservar a carga por tarefa/execução e impedir duplicação da mesma participação, inclusive em concorrência. Qualquer usuário cadastrado, habilitado e autenticado no gerenciador pode operar o módulo, incluindo analisar, aprovar/recusar, conferir/anexar certificados e enviar/reenviar. Não restringir a quatro aprovadores nem exigir papel exclusivo. Cadastro de voluntário ou formulário público não equivale a conta de usuário interno.
- **RF-007:** gerar PDF de certificado somente para atividade aprovada, com marca/nome AFAPAN, nome/CPF do aluno, instituição/curso, atividade, data, carga horária, local/data de emissão, identificação do signatário e código/link de autenticidade. Certificados devem separar categorias, conforme orientação da PO; consolidar participações da mesma categoria em uma emissão ainda depende de decisão. Texto e identificação do signatário precisam de aprovação; não copiar nomes de pessoas dos exemplos como configuração definitiva.
- **RF-008:** permitir baixar o PDF para assinatura externa no gov.br, conforme fluxo demonstrado, e anexar o PDF resultante. Não automatizar acesso ao gov.br nem criar assinatura em nome de alguém. Conferência de arquivos fica com o aprovador responsável; mecanismo de confirmação e eventual verificação criptográfica ainda devem ser definidos. Upload por si só não comprova validade criptográfica.
- **RF-009:** enviar ao e-mail da solicitação o PDF anexado pela equipe, com resumo da atividade e link de autenticidade. Preservar os bytes do documento assinado, sem reformatá-lo. Registrar tentativa, resultado do provedor, horário e responsável; permitir reenvio explícito sem criar certificado/código adicional para a mesma emissão. Não indicar entrega na caixa postal apenas porque o provedor aceitou o envio.
- **RF-010:** disponibilizar consulta pública pelo código, inclusive link direto do e-mail/certificado. Retornar dados mínimos para conferir o documento, sem expor CPF integral, telefone, e-mail ou histórico. A PO pede atividade, data e carga horária, sem CPF completo ou dados pessoais totais. Prefere representação pública simples de aprovado/rejeitado; momento da publicação do código, demais campos e política para emissão incorreta precisam de decisão. O resultado da consulta não é demonstrado nos vídeos. Download assinado não é público. Além do acesso administrativo, o solicitante pode pedir reenvio por e-mail informando CPF e data de nascimento, conforme RF-018.
- **RF-011:** distinguir decisão da atividade e estado de envio. Falha de e-mail não desfaz aprovação nem produz envio concluído falso; é recuperável. Ações repetidas não devem duplicar aprovação, certificado ou disparos por clique involuntário.
- **RF-012:** manter aluno/solicitações neste módulo sem alterar automaticamente o cadastro de voluntários. Eventual vínculo/obrigatoriedade de voluntário cadastrado depende de confirmação da responsável, antes do plano técnico.

- **RF-013:** exigir anexo de comprovação da atividade, admitindo foto, print, arquivo ou vídeo conforme conteúdo produzido, além do relato previsto. Solicitação sem comprovação não pode ser concluída. Extensões técnicas, quantidade máxima e tamanho serão definidos na revisão/plano; obrigatoriedade foi confirmada pela PO. Arquivos do aluno são evidências distintas do PDF assinado anexado pela equipe.
- **RF-014:** rejeitar duplicidade de aluno/data/categoria conforme orientação da PO; participações em dias distintos são possíveis. Definir categoria versus modalidade e identificação por CPF. Solicitação recusada pode passar por nova validação após correção, preservando histórico e sem criar duplicidade artificial; definir quem corrige e como acessa a solicitação com segurança.
- **RF-015:** disponibilizar cadastro de novas modalidades no catálogo pela área administrativa, por usuários autorizados, sem exigir alteração de código, nova publicação ou SQL manual a cada inclusão. A lista da PO é o catálogo inicial, não uma lista fechada. Permitir definir nome, descrição, enquadramento no projeto/categoria e tarefas com suas cargas horárias, conforme a regra de checklist aprovada; prever modalidade de preenchimento livre conforme Visitas técnicas em RF-017. Após salvar uma modalidade válida, disponibilizá-la para novas solicitações. Gestão do catálogo disponível a qualquer usuário interno cadastrado, habilitado e autenticado, conforme esclarecimento da responsável.
- **RF-016:** preservar a definição de modalidade, tarefas e horas utilizada em cada solicitação/emissão. Inclusão ou futura alteração no catálogo não deve recalcular tarefas, horas aprovadas ou certificados anteriores. O catálogo administrável pertence ao Conecta AFAPAN e não altera automaticamente o catálogo de interesses dos voluntários nem os módulos de Compostagem/Eco Drive.

- **RF-017:** em Visitas técnicas, o voluntário informa livremente o que foi realizado e quantas horas realizou, com comprovação obrigatória. A equipe confere a veracidade e pode ajustar erros antes da aprovação, preservando declaração original e revisão. As 12 h da proposta inicial não constituem carga fixa nem teto automático dessa modalidade. Valores permitidos, precisão/unidade e limites técnicos devem ser definidos no plano sem impor uma carga fixa não autorizada.

- **RF-018:** oferecer solicitação pública de reenvio de certificado por CPF e data de nascimento completa. Conferir os dados no servidor e, quando correspondentes a registro elegível, reenviar o certificado assinado existente somente ao e-mail já registrado na solicitação. Não permitir informar outro destinatário, alterar cadastro, emitir novo certificado, consultar histórico ou baixar arquivo diretamente por esse formulário. Não reenviar documento invalidado ou ainda sem versão assinada elegível. O fluxo mantém documento/código e registra tentativa/resultado; não promete entrega efetiva na caixa postal.

## Requisitos não funcionais

- **RNF-001:** autenticação/autorização interna e RLS com acesso mínimo; CPF e documentos pessoais não disponíveis em listas públicas ou buckets públicos. Segredos e envio de e-mail somente no servidor. Fluxo público com proteção contra abuso e sem enumeração por CPF.
- **RNF-002:** limites e validação de upload do PDF assinado e das evidências (imagem/vídeo/arquivo), armazenamento privado, downloads administrativos autorizados e ausência de conteúdo ativo executado pela aplicação. Limites de tamanho e tratamento de arquivos incorretos serão definidos no plano após aprovação do comportamento.
- **RNF-003:** responsividade e acessibilidade em celular/computador; formatos brasileiros; estados de carregamento, erro e repetição compreensíveis, preservando dados digitados.
- **RNF-004:** registrar histórico de decisões, geração, upload e tentativas de envio sem incluir dados sensíveis em logs técnicos. Nenhuma credencial fornecida no chat deverá ser copiada para arquivos da iniciativa ou código.
- **RNF-005:** testes unitários/integrados das regras, concorrência e ausência de teto acumulado, permissões, duplicidades, falhas e recuperação de e-mail/upload; PDF real renderizado e inspecionado; TypeScript e build. Validações remotas identificadas separadamente.
- **RNF-006:** alterações de schema/RLS/armazenamento, compatibilidade, migração e reversão devem constar no futuro plano técnico. Nenhuma migração, publicação ou disparo de e-mail remoto automático nesta fase.

- **RNF-007:** CPF e nascimento são dados de identificação, não credenciais fortes. Reenvio público deve usar resposta genérica equivalente para combinação inexistente, divergente ou inelegível, sem revelar existência, nome, e-mail, número de certificados ou motivo específico. Definir limites por origem e destinatário/solicitação, intervalo mínimo entre envios, deduplicação e proteção contra automação; não registrar CPF/nascimento em URL ou logs técnicos. A confirmação pública indica solicitação recebida, não comprova envio. Não disparar e-mails por mera consulta GET.

- **RNF-008:** não excluir dados ou arquivos do Conecta AFAPAN. Preservar solicitações, revisões, comprovantes, certificados e auditoria. Expirar acesso, arquivar ou invalidar sem apagar. Não incluir ação ou rotina de exclusão no módulo.

## Critérios de aceite

- **CA-001** (RF-001 a RF-004): aluno preenche dados válidos, escolhe categoria/data e descreve a atividade; solicitação persiste como Pendente com projeto/modalidade, tarefas e carga sugerida separados da carga aprovada. Erro não simula sucesso e preserva preenchimento.
- **CA-002** (RF-005): equipe autenticada pesquisa nome/CPF e encontra solicitações nas abas corretas, com detalhe e histórico. Anônimo não acessa essas informações.
- **CA-003** (RF-006): aprovação registra autor/horário e soma de tarefas reconhecidas, atualiza estado e permite acumular novas participações sem teto por aluno/modalidade/ano/programa, sem duplicar a mesma participação em concorrência. Validar exemplo de 6 h por uma tarefa e 12 h pelo conjunto em Compostando nas Escolas. Recusa exige motivo conforme regra aprovada e mantém histórico, com e-mail independente do sucesso da decisão.
- **CA-004** (RF-007, RF-008): aprovado permite baixar PDF com informações corretas e código; pendente/recusado não permite emissão. PDF é legível e sem cortes; assinatura ocorre externamente, sem representação automatizada da pessoa signatária.
- **CA-005** (RF-008, RF-009, RNF-002): somente equipe autorizada anexa PDF válido da solicitação, confirma a conferência aprovada e envia o documento sem modificar seus bytes. Arquivo inválido/inadequado é rejeitado sem perder o anterior.
- **CA-006** (RF-009, RF-011): sucesso do provedor é registrado; falha mantém certificado pronto para nova tentativa. Reenvio explícito mantém documento/código e gera histórico, sem duplicidade por duplo clique.
- **CA-007** (RF-010, RNF-001): código válido permite conferir somente informações públicas aprovadas; código inexistente não revela dados. Download do documento assinado não se torna público implicitamente.
- **CA-008** (RF-012): registrar horas não altera voluntário, situação, interesses ou consentimentos existentes. Vínculo entre módulos segue a decisão a aprovar.
- **CA-009** (RNF-003 a RNF-006): testes, TypeScript/build e inspeção visual do certificado aprovados; limitações e resultados remotos documentados antes da conclusão integral.

- **CA-010** (RF-002, RF-006): checklist considera somente tarefas reconhecidas na solicitação, sem repetir uma mesma etapa na soma; cargas seguem a distribuição do catálogo aplicado. Revisão de catálogo não reescreve horas já aprovadas.
- **CA-011** (RF-013, RF-014): duplicidade é rejeitada de acordo com chave aprovada; correção de recusa permite reanálise com histórico. Comprovação por anexo é obrigatória, sem exposição pública, com limites técnicos a definir.
- **CA-012** (RF-015, RF-016): usuário autorizado cadastra nova modalidade com suas informações e tarefas/horas, e ela fica disponível para novas solicitações sem deploy ou SQL manual. Usuário não autorizado não pode cadastrar modalidades. Registros e certificados anteriores permanecem com a definição e horas originalmente utilizadas.

- **CA-013** (RF-002, RF-006): aluno seleciona tarefas e equipe revisa entregas/erros; cálculo usa tarefas reconhecidas e histórico distingue declaração original da revisão.
- **CA-014** (RF-013, RF-017): envio sem anexo é rejeitado. Visitas técnicas permite descrição e horas declaradas, sem atribuir automaticamente 12 h; equipe confere e revisa antes da aprovação.

- **CA-015** (RF-006, RF-014): um aluno com 10 h já aprovadas no Eco Drive pode receber mais 5 h por uma nova ação válida em outra data, totalizando 15 h. O mesmo vale ao longo do ano e do programa, sem teto acumulado; tentativa de registrar novamente a mesma participação continua sujeita ao bloqueio de duplicidade.

- **CA-016** (RF-006, RF-015): qualquer conta interna habilitada e autenticada pode analisar, enviar e gerir modalidades, sem lista exclusiva de quatro aprovadores. Visitante e voluntário sem conta interna não recebem essas permissões.
- **CA-017** (RF-018, RNF-007): CPF/nascimento correspondentes permitem solicitar reenvio ao e-mail previamente cadastrado, preservando bytes/código do certificado. Dados divergentes ou documento inelegível não geram envio e produzem a mesma resposta pública genérica, sem download ou alteração de destinatário. Repetição abusiva é limitada e não gera disparos duplicados.

- **CA-018** (RNF-008): retirada de modalidade, expiração de sessão/link ou invalidação de emissão não excluem dados nem arquivos. Interface, APIs e jobs do módulo não oferecem exclusão.

## Definições pendentes e propostas de fechamento

O plano técnico apresenta propostas P-001 a P-010 para resolver as lacunas abaixo. Aprovar o plano inclui aprovar essas escolhas ou informar ajustes; não tratá-las como respostas anteriores da PO. Signatário e configuração do remetente são gates de homologação, sem valores inventados.

1. Resolvido: não haverá limite acumulado de horas. Novas participações em datas diferentes podem gerar novos créditos após validação; manter bloqueio de duplicidade da mesma participação.
2. Uma solicitação de projeto/checklist pode reunir tarefas feitas em vários dias? Qual data ou período deve constar nela e no certificado?
3. Evidências obrigatórias e visitas livres estão definidas. Falta definir limites técnicos de upload e como o aluno corrige relato/anexos após recusa.
4. Quem pode solicitar: qualquer aluno ou somente voluntário já cadastrado? Há seleção/inscrição prévia nas parcerias? Não inferir elegibilidade pelos cursos apenas indicados para Marketing.
5. Resolvido: qualquer usuário interno cadastrado, habilitado e autenticado pode analisar, anexar, enviar e administrar o catálogo. Não há lista exclusiva de quatro aprovadores.
6. Certificado por participação ou consolidado por categoria? Qual nome/cargo do signatário e texto? Manter conferência humana do PDF ou exigir validação criptográfica?
7. Emissão incorreta: se nome/horas saírem errados e o aluno já recebeu o PDF, quem pode invalidá-lo, corrigir e reenviar? Como o código antigo deve responder na consulta? Preferência por rótulos simples não resolve esse comportamento.
8. Consulta pública: confirmar atividade/data/horas, eventual nome ou CPF parcial e momento em que o código se torna consultável. Definido: download administrativo e formulário público de solicitação de reenvio por CPF/nascimento, sem download direto. Detalhar escolha quando houver vários certificados e tratamento de registros legados sem nascimento, sem expor listagem pública nem inferir dados pessoais.
9. Selecionar turma/ação/visita dos módulos existentes ou informar livremente? Qual remetente/serviço de e-mail? Avaliar eventual migração separadamente. Preservação sem exclusão confirmada em DEC-026.
10. Gestão do catálogo resolvida: todos os usuários internos habilitados/autenticados. Confirmar o enquadramento de projeto/categoria para novas modalidades.

## Aprovação

- [ ] Pendências essenciais resolvidas e especificação aprovada pela responsável.
- Planejamento técnico e tarefas preparados após autorização para seguir. Implementar somente após aprovação do plano e propostas P-001 a P-010. Publicação/migração e envio de mensagens reais exigem autorização específica.
