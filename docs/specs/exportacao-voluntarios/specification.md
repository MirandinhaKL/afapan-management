# Exportação dos cadastros de voluntários

- Data: 2026-10-13.
- Revisão do PDF: 2026-10-15, confirmada pela responsável.
- Status: aprovada pela responsável em 2026-10-15; plano aprovado e implementação local autorizada; publicação pendente.
- Origem: responsável aprovou o formulário e revisou a exportação para CSV e PDF, excluindo registros arquivados.

## Objetivo e escopo

Permitir que a equipe exporte todos os voluntários não arquivados pela gestão interna, em CSV ou PDF, independentemente da página, filtros ou situação. CSV terá uma linha por voluntário. PDF apresentará os mesmos dados em fichas legíveis por voluntário, com continuação em outras páginas quando necessário. Não haverá exportação Excel nesta iniciativa.

Cada voluntário deve iniciar em uma nova página A4. A ficha deve ocupar uma página sempre que o conteúdo couber com legibilidade; relatos extensos podem continuar em páginas adicionais, identificadas com o nome do voluntário e “continuação”. Não compartilhar a página entre voluntários nem cortar respostas para forçar uma página única.

O PDF terá apresentação institucional profissional: nome e logotipo da AFAPAN no cabeçalho, título do relatório, seções organizadas, margens e hierarquia tipográfica consistentes e rodapé com paginação. Não incluir razão social, CNPJ, endereço jurídico, declarações legais, assinaturas ou dados institucionais não fornecidos. A responsável solicitou somente nome e logotipo para a identificação institucional. A imagem utilizada como logotipo deve ser a marca real da AFAPAN, preservando proporções; não usar arquivos placeholder como marca.

O escopo é uma fotografia dos dados cadastrais atuais. Não inclui cópia integral do banco, credenciais, registros de tentativas públicas, logs de auditoria ou histórico detalhado de alterações e consentimentos. Esses últimos não são campos cadastrais e exigiriam estrutura própria de exportação. Revisão solicitada pela responsável: PDF omite a seção Informações administrativas (situação, origem, criação, atualização e campanha histórica); esses dados permanecem no CSV. Essa exceção prevalece sobre a equivalência de campos descrita nos requisitos originais abaixo.

## Requisitos

- **RF-001:** oferecer exportação CSV e PDF na tela interna de voluntários, somente para usuários autenticados e autorizados a consultar esses cadastros.
- **RF-002:** incluir todos os voluntários não arquivados acessíveis à equipe, nas quatro situações existentes, sem aplicar filtros da tela ou restringir à página visível. Excluir arquivados mesmo quando o filtro da tela os mostrar. Não contornar as políticas de acesso existentes.
- **RF-003:** ambos os formatos devem conter os mesmos registros e campos, com rótulos em português e ordem por nome, sobrenome e identificador. CSV usa colunas; PDF organiza os campos em fichas, sem comprimir todos os dados em uma tabela larga.
- **RF-004:** incluir identificação do registro, nome, sobrenome, nascimento, telefone, e-mail, endereço completo, profissão, habilidades/experiências, início na AFAPAN, frequência, atividades de interesse, experiência de voluntariado, canais de comunicação, ideia de projeto, autorização de imagem, história/trajetória, dados e autorização do responsável, situação, origem, criação e atualização. Incluir também expectativas e descoberta da associação quando existentes em registros históricos, mesmo que retiradas do formulário público, e o identificador de campanha histórica quando existente.
- **RF-005:** usar rótulos compreensíveis para opções, preservar textos longos, acentos, emojis, aspas e quebras de linha; reunir múltiplas atividades/canais em uma célula CSV ou grupo de itens na ficha PDF, sem duplicar voluntários. Campos ausentes ficam vazios no CSV e são identificados como não informados no PDF; autorização recusada e não informada devem ser distinguíveis.
- **RF-006:** CSV em UTF-8 com BOM, separador ponto e vírgula e escape correto de delimitadores, aspas e quebras de linha. PDF deve ser um arquivo .pdf real em A4, com identificação da AFAPAN, data/hora de geração, quantidade de voluntários e páginas numeradas. Textos longos devem continuar em novas páginas sem cortes, sobreposição ou truncamento. Fontes e recursos devem suportar os caracteres dos cadastros. Telefones, identificadores e números de endereço devem preservar zeros; o CSV deve evitar conversões indesejadas na abertura em planilhas.
- **RF-007:** formatar nascimento como dd/mm/aaaa e início das atividades como MM/AAAA. Datas/horas operacionais devem explicitar o fuso adotado no cabeçalho ou na descrição do arquivo; usar America/Sao_Paulo. Nome do arquivo deve identificar voluntários, formato e data/hora de geração.
- **RF-008:** mostrar andamento, impedir exportações simultâneas e informar conclusão com quantidade exportada. Em falha, não disponibilizar arquivo parcial nem informar sucesso; permitir tentar novamente. Sem registros, informar ausência de dados.
- **RF-009:** PDF com uma ficha iniciada em página própria para cada voluntário, cabeçalho com nome e logotipo da AFAPAN e seções de identificação/contato, participação/perfil, relato e informações administrativas. Dados de responsável aparecem quando aplicáveis. Usar uma página quando suficiente; continuação identificada quando necessária, sem reduzir excessivamente a fonte nem truncar conteúdo. Identificação institucional limitada a nome e logotipo, sem informações jurídicas não fornecidas.
- **RF-010:** revisão visual solicitada pela responsável: utilizar no cabeçalho de Voluntários o botão Exportar com ícone e menu PDF/CSV do mesmo componente usado em Compostagem, junto às ações de cópia e cadastro. Retirar o bloco separado de exportação. Preservar todos os não arquivados, trava, progresso acessível e mensagens visíveis por notificações.
- **RF-011:** retirar do PDF a seção Informações administrativas e todos os seus campos. Preservar os mesmos campos no CSV e manter cabeçalho e rodapé do relatório, incluindo data de geração e paginação. Não alterar dados persistidos.
- **RF-012:** revisão posterior do CSV: excluir Identificador, Nome do responsável, Telefone do responsável, Autorização do responsável, Situação, Origem, Atualização (America/Sao_Paulo) e Campanha histórica. Manter Criação (America/Sao_Paulo), os demais campos e o PDF como está. Essa revisão substitui a preservação desses campos no CSV prevista anteriormente, sem alterar dados persistidos.

## Requisitos não funcionais

- **RNF-001:** preservar autenticação, RLS e privacidade; não adicionar acesso anônimo nem expor service_role no cliente. A exportação é somente leitura e não altera cadastros, consentimentos ou histórico.
- **RNF-002:** proteger campos de texto fornecidos pelo usuário contra interpretação como fórmulas ao abrir em planilhas, sem executar conteúdos de células.
- **RNF-003:** não depender do limite padrão de linhas do Supabase nem da paginação da interface. Buscar toda a base não arquivada autorizada com ordem determinística; estratégias de leitura e alterações concorrentes serão definidas no plano.
- **RNF-004:** ações utilizáveis por teclado, com estado de andamento acessível, sem bloquear permanentemente os demais controles.
- **RNF-005:** criar testes de recuperação dos registros elegíveis, formatos, conteúdo e falhas; validar TypeScript e build. Renderizar e inspecionar PDF de teste com textos extensos e caracteres variados, conferindo paginação e legibilidade. Registrar verificações dependentes de ambiente real antes da conclusão.

## Critérios de aceite

- **CA-001** (RF-001, RNF-001): equipe autorizada consegue escolher CSV ou PDF; usuário anônimo não consegue exportar dados.
- **CA-002** (RF-002, RNF-003): com mais registros que uma página ou lote de consulta, filtros ativos e voluntários arquivados, ambos os arquivos incluem todos os não arquivados autorizados uma única vez e nenhum arquivado, mesmo quando a tela exibir somente arquivados.
- **CA-003** (RF-003, RF-004): CSV e PDF apresentam os mesmos campos e voluntários, inclusive textos históricos; CSV em colunas e PDF em fichas legíveis.
- **CA-004** (RF-005, RF-006): textos com acentos, emojis, aspas, ponto e vírgula e quebras de linha são preservados; múltiplas atividades não duplicam linhas; ausente/recusado são distinguíveis.
- **CA-005** (RF-006, RNF-002): PDF abre como arquivo válido, com textos completos, páginas numeradas e sem sobreposição ou cortes; CSV é importável; telefones, zeros e identificadores são preservados; conteúdo potencialmente interpretável como fórmula no CSV é tratado como texto.
- **CA-006** (RF-007): datas e nome do arquivo seguem os formatos definidos, com fuso identificado para datas/horas operacionais.
- **CA-007** (RF-008, RNF-004): andamento e quantidade são informados; tentativas simultâneas são impedidas; erro não gera arquivo parcial; base vazia tem mensagem própria.
- **CA-008** (RNF-001, RNF-005): exportação não modifica dados nem reduz políticas; testes, TypeScript e build passam, com limitações documentadas.
- **CA-009** (RF-009, RF-006): PDF de exemplo com dois voluntários de conteúdo curto apresenta uma ficha por página; relato extenso gera continuação identificada, e o próximo voluntário começa em nova página. Nome e logotipo da AFAPAN aparecem sem distorção, seções e rodapé permanecem legíveis e não há dados jurídicos inventados ou placeholders.
- **CA-010** (RF-010, RF-008): cabeçalho apresenta um único botão Exportar com ícone e opções Exportar PDF/Exportar CSV; menu utilizável por teclado. Durante exportação, botão indica Exportando e fica desabilitado; falhas e resultados continuam informados, sem bloco adicional na página.
- **CA-011** (RF-011): PDF não contém seção administrativa, situação, origem, criação/atualização cadastral ou campanha histórica. CSV conserva esses campos; os demais dados e o rodapé PDF são preservados. RF-003/RF-004 e CA-003 passam a considerar essa diferença intencional entre formatos.
- **CA-012** (RF-012): CSV não apresenta as oito colunas removidas nem seus valores; cabeçalhos e linhas permanecem alinhados. Coluna Criação e demais colunas mantidas; campos do responsável e identificador continuam no PDF conforme o escopo anterior.

## Riscos e validação

Principais riscos: base incompleta por paginação/limite de consulta, inclusão indevida de arquivados, duplicação por relações, conversão de telefone em número no CSV, execução de fórmulas, cortes ou caracteres ausentes no PDF e mudanças concorrentes durante leitura. O plano técnico deverá definir mitigação proporcional ao volume e não poderá prometer uma fotografia transacional sem mecanismo que a garanta. Downloads contêm dados pessoais já acessíveis à equipe; não publicar arquivos em links públicos.

## Aprovação

- [x] Especificação aprovada pela responsável em 2026-10-15, pela mensagem “aprovado”.
- Plano técnico e tarefas aprovados em 2026-10-15; implementação local autorizada. Ver validation.md para evidências e limites remotos.
