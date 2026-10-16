# Plano técnico — Exportação de voluntários

Data: 2026-10-15. Especificação aprovada; plano e tarefas aprovados pela responsável em 2026-10-15, com implementação local autorizada.

## Arquitetura e segurança

Implementar exportação no navegador pela tela interna `components/volunteers-page.tsx`, usando a sessão Supabase já autenticada e as políticas SELECT existentes de volunteers, volunteer_availability e volunteer_interests. Validar sessão antes de iniciar, propagar erro de autenticação e não gerar download se ela expirar durante a leitura. RLS continua sendo o controle efetivo; ocultar o botão não substitui autorização.

Sem endpoint público, service_role, upload ou armazenamento remoto do arquivo. Nenhuma migração, alteração de schema, função, grant ou RLS prevista. Se faltar permissão no ambiente, registrar o impedimento; não ampliar políticas implicitamente. Nenhuma chamada de escrita faz parte da exportação. Reversão: retirar os controles e módulos de exportação; dados permanecem intactos.

Criar módulos específicos de exportação de voluntários em vez de alterar silenciosamente os exportadores genéricos usados por outros módulos. Reaproveitar jsPDF já instalado, com importação dinâmica na ação PDF para não carregar o gerador junto da listagem.

## Leitura completa e consistência

Adicionar consulta dedicada em `lib/volunteer-queries.ts`, sem receber filtros da tela nem reaproveitar sua paginação. Aplicar sempre `arquivado_em IS NULL`, buscando voluntários e relações sem joins internos que excluam cadastros sem interesses/disponibilidade.

Ler em lotes de até 500 registros, com cursor por id, ordem crescente por id e condição id maior que o último lido. Continuar até resposta vazia, inclusive se o servidor retornar menos que o tamanho solicitado. Detectar cursor sem avanço, IDs repetidos e erros intermediários; abortar sem download. Não depender do limite padrão do Supabase. Ordenar o conjunto final por nome, sobrenome e id, com comparação pt-BR consistente entre os formatos.

Capturar data/hora de início e manter um manifesto de id/atualizado_em de cada registro. Ao terminar a leitura, repetir a consulta de manifesto dos não arquivados e comparar IDs e versões; divergência informa que os dados mudaram e pede nova tentativa, sem arquivo parcial. Isso detecta mudanças observáveis no período, mas não garante snapshot transacional nem bloqueia alterações posteriores à conferência. Não anunciar fotografia transacional. Relações devem ser lidas na mesma consulta de cada voluntário; verificar em testes que seus fluxos normais atualizam a versão do cadastro. Caso essa premissa não se sustente, definir verificação adicional das relações antes de concluir, sem alterar o banco sem revisão.

Mostrar progresso por etapas e quantidade lida, sem percentual fictício. Não impor corte silencioso ao número de registros. O volume máximo viável no navegador será registrado com evidência; falha de memória ou geração deve resultar em mensagem e nenhuma confirmação falsa.

## Modelo comum e campos

Revisão RF-011 autorizada: manter o modelo de dados comum e filtrar a seção Informações administrativas somente ao renderizar o PDF. CSV continua utilizando o conjunto completo. Cabeçalho e rodapé do relatório permanecem. Sem migração ou alteração dos registros.

Criar definição única e ordenada de campos para CSV e PDF, conforme RF-004. Separar valores brutos, rótulos e formatação para que ambos produzam os mesmos dados. Usar propriedades opcionais como ausentes, nunca inventar frequência, aceite ou resposta. O mapeamento atual da listagem contém defaults; a exportação precisa mapear ausência explicitamente, sem modificar o comportamento existente da listagem.

Não exportar privacyAccepted/participationAccepted derivados do mapper da tela: esses flags não representam uma consulta de consentimentos históricos e estão fora do conjunto de campos aprovado. Manter autorização de imagem e do responsável conforme efetivamente persistidas, distinguindo false, true e null.

Interesses e canais múltiplos em ordem estável, com rótulos; preservar códigos legados desconhecidos em vez de descartá-los. Datas civis formatadas sem deslocamento de dia por timezone. Instantes operacionais com Intl em America/Sao_Paulo e fuso indicado. Nome `afapan-voluntarios-AAAA-MM-DD-HHmmss.csv/pdf`, usando o mesmo instante de geração para nome e cabeçalho.

## CSV

Revisão RF-012 autorizada: filtrar as oito colunas explicitamente listadas na especificação antes da serialização, aplicando a mesma seleção a cabeçalho e linhas. Não alterar modelo comum ou filtro PDF. Preservar criação e proteção de fórmulas/zeros/escapes. Sem alteração do banco.

Serialização pura com UTF-8/BOM, ponto e vírgula, CRLF entre registros, todos os campos entre aspas e aspas internas duplicadas. Preservar quebras de linha no texto. Neutralizar entradas que possam virar fórmula, incluindo prefixos =, +, -, @, tabulação e controles/espaços antes desses caracteres. Não usar fórmulas como ="telefone" para preservar zeros.

CSV não possui tipagem: testar uma estratégia de proteção textual para telefone, identificadores e número do endereço sem prometer controle universal de todos os leitores de planilha. Registrar o mecanismo aplicado e fornecer orientação de importação como texto quando necessário. Testes devem conferir conteúdo bruto e importação, evitando proteção dupla ou perda de dados. Gerar Blob/download apenas depois da coleta e serialização completas; liberar object URLs após uso.

## PDF institucional

Gerador dedicado de fichas A4 em retrato, margens de aproximadamente 14 mm, texto de corpo em torno de 10 pt, hierarquia de seções e cores institucionais. Cabeçalho com a marca utilizada no sistema e nome AFAPAN; título “Relatório de voluntários”. Não reutilizar o subtítulo institucional não confirmado que existe no exportador genérico. Sem dados jurídicos, assinatura ou declaração inventada.

O componente `AfapanLogo` atual usa símbolo de folha e nome AFAPAN. Reproduzir essa identificação já utilizada no sistema, sem inventar nova marca; inspecionar também `public/afapan-favicon-master.png` antes de decidir qual recurso local representa melhor a marca. Nunca utilizar placeholder. Preservar proporção do símbolo.

Cada voluntário começa em nova página. Seções: identificação/contato, participação/perfil, relatos e informações administrativas; responsável quando aplicável. Reservar áreas fixas de cabeçalho/rodapé e medir cada linha antes de desenhar. Campos curtos podem compartilhar duas colunas; relatos usam largura inteira. Manter rótulo junto à primeira linha da resposta, quebrar palavras extensas e URLs e continuar relatos sem truncamento. Página adicional repete nome do voluntário e “continuação”. Após gerar, adicionar paginação “Página X de Y”, instante de geração e total de voluntários. Dois cadastros curtos devem caber em duas páginas sem fonte excessivamente pequena.

Antes de implementar o layout final, provar suporte de acentos, emojis e Unicode: fontes padrão de jsPDF não bastam. Preparar fontes locais licenciadas com cobertura adequada e fallback para símbolos/emoji, incorporados ao PDF e sem transmitir relatos a serviços externos. Para glifos coloridos sem suporte vetorial, permitir renderização local por trecho para imagem, com medidas consistentes e validação de extração do restante do texto. Não substituir caracteres por “?” nem remover emojis silenciosamente. Registrar origem/licença dos recursos adicionados. Se algum caractere não puder ser preservado, tratar como falha explícita de geração até resolver; não declarar CA-004 validado.

Não instalar nova dependência de runtime sem necessidade demonstrada. Fontes e eventual recurso adicional deverão ser avaliados durante a prova local, com compatibilidade e licença documentadas. Renderizar um PDF real e inspecionar páginas como imagens antes de considerar o gerador pronto.

## Interface e falhas

Revisão visual autorizada após a implementação: reutilizar `ExportButton` usado em Compostagem no cabeçalho, removendo o bloco de exportação. Adicionar prop opcional disabled ao componente compartilhado com default false e nome acessível inclusive em celular. Progresso e resultados aparecem por notificações Sonner e em região status para leitores de tela; descrição de importação CSV acompanha a notificação de sucesso. Formatos e escopo dos dados permanecem iguais.

Adicionar ação “Exportar” com opções “CSV” e “PDF” e informação curta “Todos os voluntários não arquivados”. Independente de filtros, página atual e lista vazia por filtro. Ambos os formatos compartilham trava de exportação, inclusive proteção imediata contra duplo clique antes de re-render. Expor andamento em região status; manter navegação e filtros disponíveis. Mensagens específicas para base sem registros, sessão expirada, mudanças concorrentes e falha de geração. Informar quantidade e que o download foi iniciado; o navegador não comprova que o arquivo foi efetivamente salvo em disco.

## Validação e compatibilidade

Testes de consulta com mais de um lote, limite de servidor menor que o solicitado, arquivados, relações ausentes, filtros ignorados, erro intermediário, sessão expirada e manifesto alterado. Testes de mapeamento para todos os campos, null/false, datas civis/instantes, rótulos legados e textos extensos. Testes de CSV com caracteres especiais, zeros e fórmulas. PDF com verificações estruturais, texto e inspeção visual real, não apenas mocks.

Fixtures fictícias: dois cadastros curtos; relato de várias páginas; palavras longas; acentos/emoji; responsável; datas e campos vazios; páginas com todos os campos preenchidos. Validar início em nova página, continuação, cabeçalho/logotipo, rodapé, margens e ausência de sobreposição. Integrar testes de UI para teclado, progresso, trava, falha, ausência de dados e download somente completo. Preservar testes existentes; executar suíte relevante, suíte completa, TypeScript e build. Registrar evidências em validation.md, sem dados pessoais reais nos artefatos.

Verificação com papéis reais e smoke test de download em ambiente publicado dependem de acesso/autorização específicos. Não publicar, migrar ou modificar serviço externo como parte da implementação local. Especificação permanece referência para CA-001 a CA-009.

## Aprovação

- [x] Plano técnico e tarefas aprovados para implementação local em 2026-10-15.
- [ ] Publicação/verificações remotas autorizadas separadamente.
