# Especificação — CRUD de campanhas Eco Drive

- **Status:** Aprovada
- **Responsável:** AFAPAN
- **Data:** 2026-09-04
- **Última atualização:** 2026-09-22

## 1. Contexto e problema

O módulo Eco Drive registra eventos mensais de coleta de resíduos recicláveis realizados em Farroupilha. Atualmente, o sistema permite cadastrar campanhas, listar informações resumidas e calcular indicadores das campanhas concluídas.

O módulo ainda não oferece uma operação completa de consulta detalhada, edição ou exclusão de campanhas. Isso impede corrigir dados informados incorretamente, revisar todos os materiais de uma campanha e administrar registros que não devam permanecer ativos.

## 2. Objetivo

Disponibilizar um CRUD completo para campanhas Eco Drive, permitindo criar, consultar, editar, arquivar e restaurar campanhas de forma segura, previsível, auditável e consistente com os indicadores e relatórios do módulo.

## 3. Usuários e partes interessadas

- Usuários autenticados responsáveis pela gestão do Eco Drive.
- Administradores da AFAPAN.

## 4. Estado atual

### Funcionalidades existentes

- Cadastro de campanha com nome, data, local, número de voluntários, status e observações.
- Cadastro dos sete materiais conhecidos.
- Separação entre materiais medidos em quilogramas e materiais contados por unidade.
- Listagem resumida das campanhas em ordem decrescente de data.
- Indicadores calculados somente a partir de campanhas concluídas.
- Validação de campos obrigatórios, números negativos e quantidades inteiras para materiais por unidade.

### Lacunas identificadas

- Não existe consulta detalhada de uma campanha.
- Não existe edição de campanha ou de seus materiais.
- Não existe exclusão ou arquivamento de campanha.
- A listagem não possui ações por campanha.
- Não há definição de concorrência ou comportamento para falhas parciais ao salvar campanha e materiais.
- Relatórios e exportações ainda não foram implementados.

## 5. Escopo

### Incluído

- Manter e aprimorar o cadastro de campanhas existente.
- Consultar os dados completos de uma campanha.
- Editar os dados gerais e as quantidades de materiais.
- Arquivar e restaurar campanhas sem apagar seu histórico.
- Registrar auditoria das operações de criação, edição, arquivamento e restauração.
- Atualizar a listagem e os indicadores após criação, edição, arquivamento ou restauração.
- Buscar, filtrar e paginar campanhas.
- Emitir relatórios em PDF e CSV a partir dos filtros selecionados.
- Exibir estados de carregamento, sucesso e erro nas operações.
- Confirmar ações destrutivas.
- Manter validações consistentes no cadastro e na edição.

### Fora do escopo desta primeira versão

- Cadastro dinâmico de novos tipos de materiais.
- Controle individual dos voluntários participantes.
- Registro do número de veículos participantes.
- Integração com balanças ou equipamentos externos.
- Envio de mensagens por WhatsApp relacionado ao Eco Drive.
- Exclusão física de campanhas pelo CRUD.
- Histórico navegável de versões; a auditoria armazenará os valores anteriores e novos, mas não oferecerá nesta versão uma interface de comparação entre versões.

## 6. Requisitos funcionais

### Criação

- **RF-001:** O sistema deve permitir criar uma campanha com nome, data do evento, local opcional, número de voluntários, status, observações e quantidades dos materiais coletados.
- **RF-002:** Ao criar uma campanha, o sistema deve salvar a campanha e todos os seus materiais como uma única operação lógica, sem deixar um cadastro parcial visível ao usuário.
- **RF-003:** Após a criação bem-sucedida, a nova campanha deve aparecer na listagem e os indicadores devem ser recalculados.

### Consulta

- **RF-004:** A listagem deve exibir nome, data, local, número de voluntários, total em quilogramas, total em unidades e status de cada campanha.
- **RF-005:** O usuário deve conseguir abrir uma visualização detalhada contendo todos os dados gerais, observações e quantidades de cada material.
- **RF-006:** A consulta detalhada deve distinguir visualmente materiais medidos em quilogramas dos materiais contados por unidade.
- **RF-007:** As campanhas devem continuar ordenadas da data mais recente para a mais antiga.
- **RF-008:** A listagem deve permitir busca por nome ou local e filtros por status, ano e intervalo de datas.
- **RF-009:** A listagem deve possuir paginação; o tamanho da página será definido no plano técnico.
- **RF-010:** Campanhas arquivadas não devem aparecer na listagem ativa, mas devem poder ser consultadas por um filtro específico.

### Edição

- **RF-011:** O usuário deve conseguir abrir a edição a partir da campanha selecionada.
- **RF-012:** O formulário de edição deve ser preenchido com os valores atualmente salvos.
- **RF-013:** O usuário deve conseguir editar os dados gerais, o status, as observações e todas as quantidades de materiais, respeitando as mesmas validações do cadastro.
- **RF-014:** Campanhas concluídas podem ser editadas sem reabertura, mantendo o registro de auditoria.
- **RF-015:** A atualização da campanha e de seus materiais deve ocorrer como uma única operação lógica, sem deixar dados parcialmente atualizados.
- **RF-016:** Após uma edição bem-sucedida, a listagem, o detalhamento e os indicadores devem refletir os novos valores sem exigir recarregamento completo da página.
- **RF-017:** Fechar ou cancelar a edição não deve salvar modificações.

### Arquivamento e restauração

- **RF-018:** O usuário deve conseguir iniciar o arquivamento a partir da campanha selecionada.
- **RF-019:** Antes do arquivamento, o sistema deve apresentar confirmação identificando claramente a campanha afetada.
- **RF-020:** Cancelar a confirmação deve preservar a campanha sem qualquer alteração.
- **RF-021:** Após o arquivamento, a campanha deve deixar de participar da listagem ativa e dos indicadores, mas seus dados devem permanecer armazenados.
- **RF-022:** O usuário deve conseguir consultar campanhas arquivadas e restaurá-las mediante confirmação.
- **RF-023:** Após a restauração, a campanha deve voltar à listagem ativa e aos indicadores conforme seu status.
- **RF-024:** Uma falha no arquivamento ou restauração deve preservar o estado anterior e apresentar uma mensagem compreensível.

### Auditoria

- **RF-025:** O sistema deve registrar auditoria na criação, edição, arquivamento e restauração de campanhas.
- **RF-026:** Cada auditoria deve registrar a campanha, a ação, o usuário autenticado, a data e hora e os valores anteriores e novos aplicáveis.
- **RF-027:** Os registros de auditoria não devem ser alteráveis pelo CRUD de campanhas.

### Relatórios

- **RF-028:** O usuário deve conseguir exportar relatórios em PDF e CSV.
- **RF-029:** O relatório deve respeitar os filtros aplicados na listagem.
- **RF-030:** O relatório deve apresentar as campanhas, materiais, totais por peso e unidade, número de voluntários e indicadores do período selecionado.
- **RF-031:** O relatório deve identificar o período e os filtros utilizados em sua geração.

### Feedback e consistência

- **RF-032:** Todas as operações devem indicar quando estão em andamento e impedir envios duplicados enquanto aguardam resposta.
- **RF-033:** O sistema deve apresentar confirmação de sucesso e mensagem de erro nas operações de criação, edição, arquivamento e restauração.
- **RF-034:** Se os dados tiverem sido modificados ou arquivados por outra sessão, o sistema deve evitar apresentar sucesso falso e deve recarregar ou orientar a atualização dos dados.

## 7. Requisitos não funcionais

- **RNF-001:** O CRUD deve funcionar em telas de computador e dispositivos móveis sem ocultar campos ou ações essenciais.
- **RNF-002:** Campos, botões, diálogos e mensagens devem possuir nomes acessíveis e permitir navegação por teclado.
- **RNF-003:** Operações no banco devem respeitar as políticas RLS das tabelas `eco_drive_campaigns`, `eco_drive_materials` e da futura tabela de auditoria.
- **RNF-004:** Nenhuma operação do CRUD deve utilizar ou expor a chave `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- **RNF-005:** Alterações na persistência devem evitar estados parciais entre campanha e materiais.
- **RNF-006:** Os comportamentos novos ou alterados devem possuir testes unitários automatizados.
- **RNF-007:** Os indicadores devem ser derivados de uma única regra de cálculo compartilhada, evitando divergências entre listagem, detalhes e relatórios.
- **RNF-008:** Quantidades em quilogramas devem preservar até uma casa decimal; quantidades por unidade devem permanecer inteiras.
- **RNF-009:** Todos os usuários autenticados possuem as mesmas permissões no módulo Eco Drive; usuários não autenticados não podem consultar nem modificar seus dados.
- **RNF-010:** A auditoria deve obter a identidade do usuário pela sessão autenticada, sem aceitar identificadores informados pelo navegador como fonte de confiança.

## 8. Regras de negócio

- **RN-001:** Nome da campanha e data do evento são obrigatórios; o local é opcional.
- **RN-002:** O número de voluntários deve ser um número inteiro maior ou igual a zero.
- **RN-003:** Quantidades de materiais não podem ser negativas.
- **RN-004:** Materiais medidos em quilogramas podem possuir até uma casa decimal.
- **RN-005:** Materiais medidos por unidade devem aceitar somente números inteiros.
- **RN-006:** Campo de material vazio deve ser tratado como quantidade zero.
- **RN-007:** Os materiais principais são tampinhas de garrafa, cartelas de remédios vazias e esponjas de cozinha. Embalagens de torta PET, embalagens laminadas, isopor e outros continuam disponíveis como materiais adicionais.
- **RN-008:** Esponjas de cozinha são contabilizadas por unidade; os demais materiais atuais são contabilizados em quilogramas.
- **RN-009:** Os status permitidos nesta versão são `Planejada` e `Concluída`.
- **RN-010:** Somente campanhas concluídas participam dos totais coletados, itens por unidade e total de voluntários.
- **RN-011:** O total de campanhas contabiliza campanhas planejadas e concluídas que permaneçam ativas.
- **RN-012:** Ao mudar uma campanha de `Concluída` para `Planejada`, seus materiais e voluntários devem deixar de contribuir imediatamente para os indicadores.
- **RN-013:** Ao mudar uma campanha de `Planejada` para `Concluída`, seus materiais e voluntários devem passar a contribuir imediatamente para os indicadores.
- **RN-014:** Cada campanha deve possuir no máximo um registro para cada tipo de material.
- **RN-015:** Pode existir mais de uma campanha no mesmo mês e ano, sem bloqueio ou aviso de duplicidade.
- **RN-016:** Campanhas arquivadas não participam dos indicadores nem dos relatórios padrão, salvo quando o filtro incluir explicitamente registros arquivados.
- **RN-017:** Todos os usuários autenticados podem consultar, criar, editar, arquivar, restaurar e exportar campanhas.
- **RN-018:** Quando o local não for informado, a interface e os relatórios devem apresentar `Não informado` em vez de um campo vazio.

## 9. Cenários e exceções

### Cenário principal de consulta

1. O usuário acessa o módulo Eco Drive.
2. O sistema carrega as campanhas e os indicadores.
3. O usuário seleciona uma campanha.
4. O sistema exibe os dados gerais, observações e todos os materiais.

### Cenário principal de edição

1. O usuário seleciona a ação de editar.
2. O sistema abre o formulário preenchido com os valores salvos.
3. O usuário altera os campos desejados.
4. O sistema valida os dados.
5. O sistema salva campanha e materiais.
6. A interface e os indicadores são atualizados.

### Cenário principal de arquivamento

1. O usuário seleciona a ação correspondente.
2. O sistema apresenta uma confirmação com o nome e a data da campanha.
3. O usuário confirma.
4. O sistema registra a auditoria, arquiva a campanha e atualiza listagem e indicadores.

### Cenário principal de restauração

1. O usuário filtra as campanhas arquivadas.
2. O usuário seleciona a ação de restaurar.
3. O sistema solicita confirmação.
4. O sistema registra a auditoria, restaura a campanha e atualiza listagem e indicadores.

### Exceções

- Dados inválidos devem permanecer no formulário para correção e não devem ser enviados ao banco.
- Falha ao salvar materiais não deve resultar em campanha aparentemente atualizada apenas pela metade.
- Falha de rede deve manter o formulário aberto com os valores digitados sempre que for seguro fazê-lo.
- Campanha alterada ou arquivada por outra sessão deve gerar mensagem clara em vez de sucesso falso.
- Quantidade fracionada em material por unidade deve ser rejeitada.
- Valores negativos devem ser rejeitados no cadastro e na edição.

## 10. Critérios de aceite

- **CA-001:** Dado um formulário válido, quando o usuário salvar uma nova campanha, então a campanha e os sete materiais devem ser persistidos e exibidos na listagem.
- **CA-002:** Dada uma campanha cadastrada, quando o usuário abrir seus detalhes, então todos os dados gerais, observações e materiais devem corresponder aos valores persistidos.
- **CA-003:** Dada uma campanha cadastrada, quando o usuário abrir a edição, então todos os campos devem iniciar preenchidos com os valores atuais.
- **CA-004:** Dada uma alteração válida, quando o usuário salvar a edição, então campanha, materiais, listagem, detalhes e indicadores devem refletir os novos valores.
- **CA-005:** Dada uma edição aberta, quando o usuário cancelar, então nenhum valor deve ser alterado no banco ou na listagem.
- **CA-006:** Dado qualquer campo numérico negativo, quando o usuário tentar salvar, então a operação deve ser bloqueada com mensagem de validação.
- **CA-007:** Dada uma quantidade fracionada para material por unidade ou para voluntários, quando o usuário tentar salvar, então a operação deve ser bloqueada.
- **CA-008:** Dada uma campanha selecionada, quando o usuário iniciar o arquivamento, então uma confirmação deve identificar a campanha antes de qualquer alteração.
- **CA-009:** Dada uma confirmação cancelada, então a campanha e os indicadores devem permanecer inalterados.
- **CA-010:** Dado um arquivamento confirmado e bem-sucedido, então a campanha deve sair da listagem ativa e deixar de participar dos indicadores, preservando seus dados.
- **CA-011:** Dada uma falha em qualquer operação, então a interface deve comunicar o erro, impedir sucesso falso e preservar um estado recuperável.
- **CA-012:** Dada uma mudança de status entre `Planejada` e `Concluída`, então os indicadores devem ser recalculados de acordo com as regras RN-010 a RN-013.
- **CA-013:** Dado um usuário não autenticado, quando tentar acessar diretamente os dados do Eco Drive pela API pública, então as políticas RLS devem impedir leitura e alteração.
- **CA-014:** Dada uma tela estreita, quando o CRUD for utilizado, então campos e ações essenciais devem continuar acessíveis.
- **CA-015:** Dada uma campanha sem local, quando o formulário válido for salvo, então a campanha deve ser persistida e exibida sem erro.
- **CA-016:** Dada uma campanha concluída, quando ela for editada, então os dados e indicadores devem ser atualizados e a auditoria deve identificar usuário, data/hora e valores anteriores/novos.
- **CA-017:** Dada uma campanha arquivada, quando a listagem ativa for carregada, então ela não deve aparecer nem contribuir para os indicadores.
- **CA-018:** Dada uma campanha arquivada, quando o filtro de arquivadas for utilizado, então ela deve poder ser consultada e restaurada.
- **CA-019:** Dada uma campanha restaurada, então ela deve retornar à listagem ativa e aos indicadores conforme seu status.
- **CA-020:** Dado um conjunto de filtros, quando o usuário exportar PDF ou CSV, então o relatório deve conter somente as campanhas correspondentes e informar os filtros utilizados.
- **CA-021:** Dado qualquer usuário autenticado, quando acessar o módulo, então ele deve poder executar todas as operações do CRUD; sem autenticação, todas devem ser bloqueadas pelas políticas RLS.
- **CA-022:** Dadas campanhas em quantidade superior ao tamanho de página, quando a listagem for exibida, então o usuário deve conseguir navegar entre as páginas preservando busca e filtros.

## 11. Dados e privacidade

### Dados tratados

- Nome, data, local, status e observações da campanha.
- Número agregado de voluntários.
- Quantidades agregadas dos materiais coletados.
- Identificador do usuário autenticado responsável pelas operações auditadas.
- Valores anteriores e novos das alterações auditadas.

### Restrições

- O CRUD não deve registrar dados pessoais individuais de voluntários nesta versão.
- O acesso direto às tabelas deve permanecer restrito a usuários autenticados pelas políticas RLS.
- As observações não devem ser usadas para armazenar informações pessoais desnecessárias.

## 12. Dependências e restrições

- Supabase e tabelas `eco_drive_campaigns` e `eco_drive_materials`.
- Relação entre materiais e campanha com exclusão em cascata já existente.
- As políticas RLS devem permitir as operações do Eco Drive a qualquer usuário autenticado e bloquear usuários anônimos.
- A coluna `local` atualmente é obrigatória no banco e deverá aceitar valor nulo após migração.
- O arquivamento e a auditoria exigirão alterações no esquema do banco.
- A implementação atual salva campanha e materiais em duas solicitações; o plano técnico deverá definir como garantir atomicidade lógica ou transacional.
- Os indicadores existentes devem continuar compatíveis com dados históricos.

## 13. Decisões consolidadas

- [x] **Q-001 — Remoção:** campanhas serão arquivadas, preservadas para consulta e poderão ser restauradas.
- [x] **Q-002 — Campanhas concluídas:** podem ser editadas, com registro de auditoria.
- [x] **Q-003 — Permissões:** não haverá divisão por perfil; todos os usuários autenticados poderão executar todas as operações.
- [x] **Q-004 — Relatórios:** PDF e CSV fazem parte do CRUD e respeitarão os filtros da listagem.
- [x] **Q-005 — Duplicidade mensal:** mais de uma campanha pode existir no mesmo mês e ano.
- [x] **Q-006 — Consulta detalhada:** o formato de apresentação será definido no plano técnico.
- [x] **Q-007 — Listagem:** terá busca, filtros por status, ano e intervalo de datas, filtro de arquivadas e paginação.
- [x] **Q-008 — Local:** será opcional.
- [x] **Q-009 — Auditoria:** registrará ação, usuário, data/hora e valores anteriores e novos.

## 14. Aprovação

- [x] Regras de negócio revisadas
- [x] Critérios de aceite revisados
- [x] Questões em aberto respondidas
- [x] Escopo e itens excluídos compreendidos
- [x] Especificação aprovada pelo responsável em 2026-09-22
