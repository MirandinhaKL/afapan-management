# Especificação — Importação de turma de compostagem

**Status** - Aprovada para planejamento técnico  
**Data** — 2026-11-12

## Contexto e objetivo

Cadastrar em lote os inscritos na 10ª turma de compostagem a partir da planilha de respostas do Google Forms. A equipe deve conseguir revisar e confirmar a importação pela tela de turmas, com gravação no Supabase e vínculo ao destino selecionado. O mesmo fluxo deve servir para turmas futuras que usem o mesmo formulário.

O projeto mantém os dados cadastrais em `participantes` e os vínculos em `participantes_turmas`. O modelo versionado também mantém uma referência textual de turma no cadastro. As respostas da inscrição e o CPF não têm campos no cadastro de compostagem identificado no repositório.

## Requisitos funcionais

- **RF-001** — Na tela **Compostagem → Turmas**, permitir que a equipe autorizada selecione obrigatoriamente uma turma existente antes de carregar um CSV exportado da planilha do Google Forms. Para a primeira importação, a equipe criará a 10ª turma pelo cadastro de turmas e a selecionará como destino.
- **RF-002** — Identificar as oito colunas pelo cabeçalho, independentemente da ordem. Aceitar acentos e espaços periféricos nos títulos. Informar cabeçalhos obrigatórios ausentes ou ambíguos. Colunas adicionais são ignoradas e linhas vazias são descartadas.
- **RF-003** — Exibir a turma selecionada, a quantidade de inscrições, as linhas válidas, os erros e avisos por número de linha e campo, e a previsão de novos cadastros, novos vínculos e inscrições já importadas. Oferecer cancelamento e substituição do arquivo. A prévia não grava dados.
- **RF-004** — Exigir nome e e-mail em cada linha. Telefone, endereço, geração atual de resíduos e intenção de participar são opcionais. Células vazias ou compostas apenas por espaços nesses campos são tratadas como ausência de informação. Habilitar a confirmação quando houver ao menos uma linha válida. Após a confirmação, salvar somente as linhas válidas conforme o mapeamento e vincular seus participantes à turma. Exibir o total de cadastros novos, vínculos novos, inscrições já importadas e linhas pendentes, com o número da linha e o motivo de cada pendência. Avisos de CPF permitem a gravação da linha. Atualizar a lista de participantes e o total exibido na turma.
- **RF-005** - Usar o e-mail normalizado como chave de correspondência. Quando houver um único cadastro correspondente, reutilizá-lo e preservar seus dados cadastrais e vínculos anteriores. Se houver mais de um cadastro correspondente, e-mails duplicados no arquivo ou nome divergente do cadastro encontrado, sinalizar conflito para revisão. Reenvio da mesma inscrição para a mesma turma mantém um único vínculo. Uma inscrição posterior com conteúdo divergente para o mesmo participante e turma exige revisão e preserva o registro anterior.
- **RF-006** — Preservar data da resposta, geração de resíduos e intenção no contexto da inscrição na turma. Salvar o CPF informado para o Termo de Compromisso por prazo indeterminado, sem exclusão automática por tempo decorrido ou assinatura do termo. Se estiver ausente ou em formato incompatível, exibir um aviso na prévia e importar a inscrição sem CPF.

## Mapeamento da planilha

| Cabeçalho | Uso e regra proposta |
| --- | --- |
| Timestamp | Data e hora da resposta. Interpretar como mês/dia/ano conforme o exemplo informado, no horário de Brasília (America/Sao_Paulo). Manter separado da data de criação do cadastro. |
| Email Address | E-mail do participante. Remover espaços periféricos, validar formato e comparar sem distinção entre maiúsculas e minúsculas. |
| Nome Completo: | Remover espaços periféricos e preservar acentos. Usar o primeiro trecho separado por espaço em branco como nome e todo o texto restante como sobrenome. Se houver apenas um trecho, preencher o nome e deixar o sobrenome em branco. |
| CPF: (essa informação será utilizada apenas para o Termo de Compromisso, que será assinado por você no dia da capacitação) | CPF para o Termo de Compromisso. Tratar como texto para preservar zeros à esquerda. Remover a máscara quando houver e salvar valores com 11 dígitos. Valores vazios ou incompatíveis geram aviso e não impedem a importação. |
| Celular (Whatsapp): | Telefone do participante. Aceitar números com DDD e números locais de nove dígitos. Para números locais, sugerir o DDD 54 na prévia e permitir que a equipe confirme ou ajuste o DDD antes de gravar. |
| Endereço completo (Rua, número, bairro, cep): | Preservar o endereço informado em texto. O arquivo tem um único campo livre e pode omitir bairro, CEP ou cidade. |
| Qual a sua geração atual de resíduos? | Preservar a opção selecionada como resposta da inscrição. |
| Qual seria a sua intenção em participar deste programa? | Preservar a resposta livre, inclusive pontuação e quebras de linha. |

## Requisitos não funcionais

- **RNF-001** — Validar permissão na prévia e na confirmação. Restringir a operação à equipe com permissão de gestão de turmas e participantes. Permitir a consulta ao CPF por qualquer usuário autenticado do sistema, com a finalidade informada no formulário. Mascarar CPF na prévia e excluir valores integrais de logs, mensagens de erro, listagens gerais e exportações comuns.
- **RNF-002** — Gravar as linhas válidas em uma única operação e revertê-la integralmente em caso de falha técnica. Revalidar na confirmação. Se uma linha antes válida passar a exigir revisão, atualizar a prévia para nova confirmação. Impedir vínculos duplicados em confirmações concorrentes.
- **RNF-003** — Preservar o cadastro manual, os vínculos anteriores e o monitoramento de baldes. Usar dados fictícios em testes e documentação. Descartar o arquivo após o processamento, sem arquivá-lo no sistema.

## Critérios de aceite

- **CA-001** — Sem selecionar uma turma, a pessoa autorizada não consegue prosseguir com a importação. Ao selecionar a 10ª turma e carregar um CSV válido, ela pode revisar e confirmar o lote. A tela mostra a prévia e, após a confirmação, os participantes aparecem na turma com a contagem correta. **RF-001 a RF-004**
- **CA-002** — Um CSV com colunas reordenadas, acentos, respostas com vírgulas ou quebras de linha e endereços incompletos preserva os dados. Uma data como `10/2/2026 12:05:55` é interpretada como 2 de outubro de 2026 no horário de Brasília. Para um telefone local, a prévia sugere o DDD 54 e a gravação usa o DDD confirmado. **RF-002, RF-003, RF-006**
- **CA-003** — Cabeçalho obrigatório ausente impede a leitura do arquivo. Nome ou e-mail vazio, e-mail inválido ou telefone local informado sem DDD confirmado deixam pendente somente a linha afetada. Se telefone, endereço, geração de resíduos ou intenção de participar estiverem em branco, a linha pode ser importada com esses campos vazios. A tela indica a coluna ou a linha e o campo a corrigir. Se todas as linhas estiverem pendentes, ou se a pessoa cancelar, o banco permanece intacto. **RF-002, RF-003, RNF-002**
- **CA-004** — Um cadastro existente com correspondência única é vinculado à nova turma e mantém seus dados e vínculos anteriores. Reimportações idênticas e confirmações concorrentes mantêm um único vínculo. Correspondências ambíguas ou inscrições divergentes ficam pendentes de revisão. As demais linhas válidas são gravadas. Após corrigir as pendências, a equipe pode reenviar apenas as linhas corrigidas ou o arquivo completo, sem duplicar os vínculos já gravados. **RF-005, RNF-002, RNF-003**
- **CA-005** — Uma falha durante a gravação deixa o lote sem cadastros, vínculos ou respostas parciais. Uma nova tentativa após resolver a falha importa o lote uma única vez. **RF-004, RNF-002**
- **CA-006** — Uma pessoa sem permissão não consegue consultar a prévia nem confirmar a importação. Qualquer usuário autenticado consegue consultar o CPF salvo. O CPF integral não aparece nas listagens comuns, logs ou erros. **RF-006, RNF-001**

- **CA-007** — Uma inscrição com CPF ausente ou em formato incompatível exibe um aviso e pode ser importada sem CPF. Um CPF em formato compatível é salvo como texto e permanece disponível após a assinatura do termo, sem expiração automática. **RF-006, RNF-001**
- **CA-008** - Na prévia e no novo cadastro, o nome completo ` Ana   Lúcia da Silva ` é dividido em nome `Ana` e sobrenome `Lúcia da Silva`. Um nome com apenas um trecho preenche somente o nome. **RF-003, RF-004**

## Linhas pendentes e falhas de gravação

A prévia indica quais linhas serão gravadas e quais precisam de revisão. Se um e-mail corresponder a dois cadastros, por exemplo, essa linha fica pendente até a equipe resolver a correspondência. As linhas válidas podem ser confirmadas na mesma importação.

Uma falha técnica durante a gravação exige reverter a operação em andamento para evitar, por exemplo, que um participante seja cadastrado sem o vínculo com a turma. Os avisos de CPF não impedem a gravação.

## Validação do CSV da 10ª turma

O arquivo tem as oito colunas esperadas e 39 inscrições com nome preenchido, e-mail em formato compatível e data no formato previsto. Não foram encontrados e-mails repetidos no arquivo. Sete telefones locais precisam de confirmação do DDD na prévia. Treze CPFs geram aviso por formato incompatível com a regra de 11 dígitos após remoção da máscara. A validação do arquivo não incluiu consulta a cadastros existentes no Supabase.

## Ajuste visual do diálogo de importação

### Correção da leitura do endereço

O carregamento dos participantes deve preservar endereço, bairro, cidade, estado e CEP retornados pelo banco, permitindo sua exibição no detalhamento e na edição. O endereço livre do CSV permanece integral no campo endereço. A correção atua no mapeamento de leitura. Validar com teste de regressão da consulta de participantes da turma e com o teste existente do CSV. O principal risco é apresentar dados incompletos caso algum campo seja novamente omitido no mapeamento.

Durante a confirmação, exibir indicador animado e o texto “Salvando inscrições…”, mantendo os controles desabilitados. Após o servidor retornar a gravação concluída, exibir confirmação de sucesso em destaque. Em caso de falha, apresentar o erro e permitir nova tentativa. Validar com resposta assíncrona controlada no teste do diálogo e verificação do TypeScript. O risco de antecipar a mensagem de sucesso é tratado condicionando sua exibição ao retorno de gravação do servidor.

- **Objetivo** - Facilitar a identificação da janela e a leitura do campo de arquivo.
- **Comportamento esperado** - Exibir um ícone decorativo de upload ao lado do título e separar o botão nativo de seleção do estado vazio ou do nome do arquivo.
- **Risco** - A apresentação do seletor nativo pode variar entre navegadores, especialmente em telas estreitas.
- **Validação** - Conferir o seletor com e sem arquivo e executar o teste existente do diálogo para verificar o fluxo de seleção e confirmação.

## Separação do endereço do CSV

**Status** - Proposta para aprovação

- **RF-007** - Separar o endereço livre nos campos existentes de endereço, bairro, cidade, UF e CEP. Manter o logradouro e o número da casa juntos no campo endereço. Reconhecer rótulos como `rua`, `número`, `nº`, `bairro`, `cidade`, `UF` e `CEP`, sem exigir acentos ou maiúsculas. Retirar os rótulos dos valores extraídos, preservando o tipo de logradouro e os números que fazem parte do nome da via.
- **RNF-004** - Manter o texto original disponível para revisão. Campos ausentes ou ambíguos ficam sem valor inferido e geram aviso quando precisarem de revisão, permitindo a importação da inscrição.
- **CA-009** - A entrada fictícia `Rua: das Flores, número: 320, bairro: Centro, cidade: Farroupilha, UF: RS, CEP: 95170-000` preenche o endereço com `Rua das Flores, 320` e os campos de bairro, cidade, UF e CEP com seus respectivos valores. A entrada `Rua 15 de Novembro, 320` preserva os dois números no campo endereço. **RF-007, RNF-004**
- **CA-010** - Para a 10ª turma, a revisão propõe separar endereços que ainda estejam em texto livre. Preservar campos já preenchidos e encaminhar divergências para revisão. A correção não cria novos participantes ou vínculos. **RF-007, RNF-004**

## Intenção de participar nos detalhes do participante

O card **Intenção de participar** aparece logo abaixo de **Endereço**. Conferir a ordem dos cards no diálogo.

**Status** - Aprovada para planejamento técnico

- **RF-008** - Exibir o campo **Intenção de participar** nos detalhes do participante, com a resposta da inscrição vinculada à turma selecionada. Preservar as quebras de linha. Se a inscrição ou a resposta estiver ausente, mostrar **Não informada**. Em caso de falha na consulta, indicar que a resposta não pôde ser carregada.
- **RNF-005** - Permitir a consulta apenas a usuários autenticados com acesso aos detalhes do participante. Limitar a resposta da consulta à intenção da inscrição correspondente.
- **CA-011** - Ao abrir os detalhes de um participante vinculado a duas turmas com respostas diferentes, o diálogo mostra a resposta da turma selecionada. Ao trocar de turma ou participante, o diálogo não exibe a resposta da seleção anterior. **RF-008, RNF-005**
- **CA-012** - Uma inscrição sem resposta ou um cadastro sem inscrição importada exibe **Não informada**. Uma falha na consulta apresenta uma mensagem de erro e mantém os demais dados do participante disponíveis. **RF-008**

### Largura do seletor de turma

Alinhar o seletor à largura do card **Total de baldes** nas grades de quatro colunas. Em telas menores, ambos ocupam a largura disponível. Conferir o alinhamento nos dois layouts e observar se nomes longos de turmas cabem no seletor.

## Importação temporária de turmas antigas

**Status** - Aprovada para planejamento técnico

- **RF-009** - Permitir temporariamente a importação de inscrições históricas com e-mail, data da resposta ou ambos em branco. Manter os cabeçalhos do CSV, o nome obrigatório e as validações de formato para e-mails e datas preenchidos. Registrar os dados ausentes sem gerar valores fictícios.
- **RF-010** - Manter a correspondência por e-mail quando informado. Sem e-mail, propor a correspondência pelo nome completo normalizado e pelo telefone normalizado em conjunto, quando ambos estiverem disponíveis. Tratar coincidências parciais e múltiplas como pendências para revisão. Sem telefone, permitir cadastro novo mediante revisão explícita na prévia e reconhecer o reenvio da mesma inscrição para a mesma turma.
- **RNF-006** - Habilitar o modo histórico por configuração de servidor, desativada por padrão. Ao desativar, voltar a exigir e-mail e data nas novas importações e preservar os registros históricos. Revalidar o modo ao confirmar a prévia.
- **CA-013** - No modo histórico, o CSV da primeira campanha pode ser revisado com e-mail e data em branco. Erros em valores preenchidos continuam sinalizados. **RF-009**
- **CA-014** - A reimportação idêntica na mesma turma não duplica participantes ou vínculos. Correspondências ambíguas permanecem pendentes. **RF-010**
- **CA-015** - Com o modo histórico desativado, o importador volta a exigir os dois campos, inclusive ao confirmar uma prévia histórica aberta. Os registros históricos continuam disponíveis para consulta. **RF-009, RNF-006**

O esquema versionado exige e-mail em participantes e já aceita data de resposta ausente nas inscrições. O plano técnico deve tratar a compatibilidade dos consumidores de e-mail e a estratégia de reversão sem preencher os registros históricos com dados fictícios.

### Telefone compartilhado nas turmas históricas

**Status** - Aprovada para planejamento técnico

- **RF-011** - Permitir o mesmo telefone em inscrições históricas com nomes completos normalizados diferentes, no mesmo arquivo ou em cadastros existentes. Usar a combinação de nome e telefone para vincular um cadastro existente. Encaminhar para revisão nomes coincidentes com telefone divergente e correspondências múltiplas pela combinação.
- **CA-016** - Duas inscrições com nomes distintos e telefone idêntico podem gerar dois vínculos distintos. Reimportar o arquivo preserva os vínculos sem criar duplicidades. Uma correspondência única por nome e telefone reutiliza o cadastro correto mesmo quando outros participantes compartilham o telefone. **RF-010, RF-011**

## Limites e decisões para aprovação

O primeiro uso é a 10ª turma. A proposta é exportar a planilha como CSV e enviar o arquivo pelo sistema. Sincronização com o Google Forms, geração ou assinatura do termo, envio de mensagens e criação de datas de monitoramento ficam fora do escopo.

- [x] Criar a 10ª turma pelo cadastro de turmas antes da importação.
- [x] Validar o CSV da 10ª turma como arquivo de entrada.
- [x] Interpretar a data no formato mês/dia/ano, usar o horário de Brasília e sugerir DDD 54.
- [x] Importar as linhas válidas e deixar pendentes apenas as que precisam de revisão.
- [x] Aprovar a correspondência por e-mail.
- [x] Armazenar o CPF quando informado em formato compatível, disponibilizar a consulta a usuários autenticados e tratar pendências de CPF como aviso.
- [x] Permitir a importação de linhas com telefone, endereço, geração de resíduos ou intenção de participar em branco.
- [x] Manter o CPF importado por prazo indeterminado, sem exclusão automática.
- [x] Aprovar a especificação para iniciar o planejamento técnico.
