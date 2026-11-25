# Plano técnico da importação de turmas de compostagem

**Status** - Aprovado para implementação local

## Aplicação

- Integrar o diálogo a `components/tabs/turmas-tab.tsx` e reutilizar em `components/compostagem-page.tsx` o carregamento de turmas e participantes após a confirmação. Usar seleção obrigatória de turma existente, upload, prévia com contadores e pendências por linha, ajuste de DDD e confirmação das linhas válidas. Cancelar ou substituir o arquivo invalida a prévia. **RF-001 a RF-004, CA-001 a CA-003**
- Adicionar rotas internas de prévia e confirmação em `app/api/compostagem/importacoes`. Validar o token Supabase no servidor, seguindo o padrão de sessão usado em `lib/conecta/internal-server.ts`. Conferir permissão também na confirmação. Validar tamanho e quantidade de linhas antes do processamento, com limites iniciais propostos de 1 MiB e 1.000 inscrições. Aceitar CSV UTF-8 com BOM opcional e usar um parser com suporte a aspas escapadas, vírgulas, CRLF e campos multilinha. Informar o número da linha física em que o registro começa. Rejeitar estrutura ilegível antes da prévia. **RF-002, RF-003, RNF-001, RNF-003, CA-002, CA-003, CA-006**
- Concentrar o mapeamento em um módulo de domínio testável. Aplicar a divisão de nome e sobrenome, a data em `America/Sao_Paulo`, a normalização de e-mail, o tratamento de CPF como texto e a confirmação de DDD por linha. Preservar endereço e respostas livres. Detectar duplicidades de e-mail no próprio arquivo antes de classificar as linhas. Para comparar com cadastros existentes, usar o nome completo recomposto com espaços normalizados e comparação sem distinção de maiúsculas, preservando acentos. **RF-002 a RF-006, CA-002 a CA-004, CA-007, CA-008**
- Manter o arquivo apenas durante o fluxo. A confirmação reenvia o CSV e os DDDs revisados. Vincular a prévia à pessoa autenticada, turma, conteúdo e classificação das linhas por comprovante assinado e temporário, sem incluir dados pessoais legíveis no comprovante. Recalcular a classificação no servidor. Se uma linha válida passar a exigir revisão ou mudar o cadastro a ser vinculado, devolver nova prévia para confirmação. Reenvio idêntico após uma gravação bem-sucedida informa os itens já importados. Usar respostas sem cache e mensagens de erro sem dados pessoais. **RF-003 a RF-005, RNF-001 a RNF-003, CA-003 a CA-006**

## Supabase

| Área | Proposta |
| --- | --- |
| Participantes | Adicionar `sobrenome` anulável. Manter cadastros manuais e antigos compatíveis. Ajustar a apresentação para compor nome e sobrenome quando houver e revisar edição, buscas, exportações e mensagens que usam o nome. Para um novo participante importado, preencher a referência legada `turma` com o nome da turma selecionada e gravar o vínculo em `participantes_turmas`. |
| Vínculo e inscrição | Reutilizar a restrição única de participante e turma. Criar tabela de inscrições importadas com chave única por vínculo, data da resposta e respostas do formulário. Guardar o CPF textual nessa tabela e limitar o acesso. Um vínculo manual já existente pode receber sua primeira inscrição importada. Uma inscrição idêntica não gera outra gravação. Se a inscrição divergir, preservar a anterior e indicar revisão. Comparar todos os dados normalizados da inscrição mediante impressão digital protegida calculada no servidor, inclusive campos cadastrais que não foram sobrescritos no cadastro existente. |
| Correspondência | Consultar por e-mail normalizado com índice não único para preservar cadastros legados. Incluir registros inativos e tratar a correspondência com cadastro inativo como pendência para revisão, pois a lista de turma filtra participantes ativos. Validar a turma novamente na gravação. |
| Transação | Usar uma função PostgreSQL chamada por RPC para gravar o subconjunto confirmado. Revalidar a classificação dentro da transação antes de escrever. Serializar confirmações e proteger a busca seguida de inserção contra gravações concorrentes do cadastro manual. Validar em banco local a estratégia proposta de travar escritas em participantes e vínculos durante a reclassificação e gravação, com ordem fixa, duração curta e tratamento de contenção. Qualquer falha técnica reverte cadastros, vínculos e inscrições do lote. |
| Permissão de importação | O esquema versionado permite atualização do próprio perfil e dá permissões amplas nas tabelas existentes. Não usar o campo `profiles.role` como fonte única sem verificar sua proteção. Proposta para revisão: concessão explícita de importação gerenciada no servidor, por usuário, em tabela com RLS e sem escrita pelo cliente. Autorizar na prévia e na confirmação. Restringir a execução da RPC à credencial de servidor. |
| Acesso ao CPF | Habilitar RLS na tabela de inscrições e impedir acesso direto de `anon` e `authenticated`. Disponibilizar consulta específica por inscrição para qualquer usuário autenticado, por rota de servidor com token validado e seleção mínima de colunas. Mascarar CPF na prévia. Omitir CPF integral de listagens, exportações comuns, logs e erros. Não configurar expiração automática. |

**Rastreabilidade** - RF-004 a RF-006, RNF-001 a RNF-003, CA-001 e CA-004 a CA-008.

## Migração, compatibilidade e reversão

Versionar o SQL na pasta da iniciativa seguindo as iniciativas anteriores. Antes da aplicação remota, conferir em modo somente leitura as colunas, restrições, políticas e privilégios reais, além da disponibilidade da credencial de servidor sem expô-la. Testar em Supabase local com dados fictícios, incluindo permissões, concorrência, falha no meio do lote e cadastros legados.

Configurar `COMPOSTAGEM_IMPORT_SECRET` exclusivamente no servidor, com valor aleatório de pelo menos 32 bytes, igual entre instâncias. O segredo protege os comprovantes e as assinaturas usadas para reconhecer reimportações. Uma troca exige estratégia de compatibilidade com as assinaturas existentes. A concessão inicial de acesso usa o UUID do usuário confirmado pela responsável pela operação.

A migração é aditiva e dispensa regravação de cadastros existentes. Aplicar primeiro o banco e depois a aplicação. Em caso de reversão, desabilitar o fluxo e reverter a aplicação, preservando as inscrições e os CPFs já gravados. A remoção de estruturas só deve ocorrer após revisão da existência de dados e autorização específica. A versão anterior pode exibir somente o primeiro nome dos cadastros feitos pela importação, pois ainda não compõe o sobrenome.

Após aplicação autorizada, verificar permissões e restrições no ambiente remoto e conferir na prévia da 10ª turma os conflitos com cadastros existentes. Confirmar o lote real somente com autorização para a gravação.

## Validação

### Telefone compartilhado nas turmas históricas

**Status** - Plano aprovado. Migração criada, com validação em PostgreSQL pendente.

- Criar a migração `003` para atualizar a função de importação depois da `002`. Para inscrições sem e-mail, procurar uma correspondência exata por nome completo e telefone normalizados. Reutilizar uma correspondência única mesmo quando o telefone for compartilhado. Se nenhuma correspondência exata existir e o nome coincidir com um cadastro, indicar revisão. Se apenas o telefone coincidir, permitir um novo cadastro.
- Na prévia do arquivo, encaminhar para revisão linhas de mesmo nome no fluxo sem e-mail e permitir linhas com nomes diferentes que compartilhem o telefone. Manter a identificação de reenvios pela assinatura e reavaliar a correspondência sob o bloqueio já utilizado pela confirmação.
- Preservar a assinatura histórica, as permissões da função e as políticas RLS. A migração substitui a função, sem alterar os registros existentes. A reversão restaura a definição da função na migração `002` e preserva os vínculos gravados.
- Validar em PostgreSQL com dados fictícios o telefone compartilhado no arquivo e no banco, a correspondência exata única e múltipla, o nome coincidente com telefone divergente, e o reenvio após confirmação. Conferir a prévia da 2ª Turma no ambiente autorizado. **RF-010, RF-011, CA-014, CA-016**

### Importação temporária de turmas antigas

**Status** - Plano aprovado para implementação

- Adicionar a configuração de servidor `COMPOSTAGEM_IMPORT_HISTORICO`, desativada por padrão. Ler o valor na prévia e na confirmação e incluir o modo no comprovante para invalidá-lo se a configuração mudar. Exibir na prévia quando o modo histórico estiver ativo.
- Manter os cabeçalhos do CSV. No modo histórico, representar e-mail e data ausentes como `null`. Validar normalmente valores preenchidos. Manter o fluxo atual de identificação por e-mail e a assinatura das inscrições existentes com e-mail.
- Sem e-mail, procurar correspondência única pelo nome completo normalizado e telefone normalizado. Se houver correspondência parcial ou múltipla, encaminhar para revisão. Sem telefone, exigir confirmação explícita do novo cadastro na prévia. Guardar uma chave derivada da assinatura da inscrição histórica e vinculada à turma para reconhecer reenvios idênticos, inclusive sem telefone. Tratar linhas idênticas na mesma prévia como duplicadas. Revalidar identidade e chave dentro da transação existente para evitar duplicidades concorrentes.
- Criar uma migração versionada para aceitar `NULL` em `participantes.email`, registrar a chave histórica com unicidade por turma e atualizar a função de importação. A data já aceita `NULL`. Manter o acesso ao armazenamento restrito ao servidor e conservar as permissões de importação e as políticas RLS atuais.
- Revisar listagens, formulários, buscas e exportações para aceitar cadastros históricos sem e-mail e manter as regras dos cadastros manuais. Aplicar primeiro a migração validada em ambiente de teste e publicar a aplicação com o modo desligado. Após as importações, desligar o modo para restaurar a obrigatoriedade. Manter a nulabilidade para preservar os registros históricos. Antes de qualquer reversão da aplicação, verificar se a versão de destino consegue ler esses registros.
- Validar a prévia da primeira campanha em ambiente autorizado, com o modo ativo, e confirmar com dados fictícios os cenários de ausência, valores inválidos, correspondência ambígua, reenvio, concorrência e desligamento entre prévia e confirmação. **RF-009, RF-010, RNF-006, CA-013 a CA-015**

### Exibição da intenção de participar

**Status** - Plano para aprovação

- Usar o ID da turma selecionada e o ID do participante ao abrir seus detalhes. Buscar a resposta somente enquanto o diálogo estiver aberto. Cancelar ou ignorar respostas de consultas anteriores ao fechar o diálogo ou mudar a seleção.
- Criar uma rota de leitura autenticada no servidor. Validar os dois UUIDs e, com a sessão do usuário, verificar se ele consegue ler o participante e seu vínculo com a turma. Somente após essa verificação, usar o cliente de servidor existente para consultar `intencao` pelo ID do vínculo autorizado. Retornar somente a intenção, sem cache. A permissão de importação não é necessária para consultar os detalhes.
- Exibir **Intenção de participar** no diálogo, preservando as quebras de linha. Usar **Não informada** quando faltar inscrição importada ou resposta. Em caso de falha, indicar que a resposta não pôde ser carregada e manter os demais dados visíveis.
- A consulta usa a coluna existente e mantém as políticas RLS e os privilégios do Supabase. O fluxo é compatível com cadastros anteriores à importação. A reversão consiste em retirar a rota e a exibição na aplicação.
- Validar com testes da rota e do diálogo, TypeScript e conferência da resposta na turma selecionada. **RF-008, RNF-005, CA-011, CA-012**

Executar Vitest nos módulos de domínio, rotas e diálogo, a suíte de regressão e `tsc --noEmit`. Exercitar em banco local a migração, a matriz de acesso, a transação e a concorrência. Cobrir todos os critérios de aceite conforme a lista de tarefas. Registrar resultados e dependências de validação remota antes da conclusão.
