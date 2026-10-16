# Validação local — Exportação de voluntários

Revisão RF-012: removidas as oito colunas CSV solicitadas e seus valores; Criação preservada. Testes conferem duas linhas com mesmo número de colunas do cabeçalho e preservação dos campos no modelo PDF. 13 testes relevantes e TypeScript aprovados. Nenhuma mudança no banco, PDF ou publicação. Essa revisão substitui as afirmações históricas abaixo de que todos os campos administrativos permanecem no CSV.

Revisão RF-011: seção administrativa retirada somente do PDF, mantida no CSV. 12 testes relevantes aprovados e TypeScript aprovado. Exemplo fictício regenerado (seis páginas), renderizado e inspecionado; extração confirma ausência de campos administrativos e preservação do fim do relato e rodapé. A equivalência de campos dos formatos descrita nas evidências originais abaixo passa a ter essa exceção intencional. Sem publicação ou mudança no banco.

Revisão visual posterior: botão Exportar compartilhado com Compostagem, menu PDF/CSV e notificações no cabeçalho, substituindo bloco separado. CA-010 coberto por teste de botão único/menu e navegação por teclado. Revalidação: 25 arquivos, 150 testes aprovados; TypeScript aprovado. Sem alteração dos geradores ou publicação; o build e a inspeção PDF abaixo referem-se à implementação anterior a este ajuste visual.

Data: 2026-10-15. Plano aprovado e tarefas locais T-001 a T-006 executadas. T-007 permanece pendente de autorização e acesso remoto.

## Evidências

- Suíte completa: 25 arquivos, 149 testes aprovados (`npm.cmd test -- --maxWorkers=2`).
- TypeScript: `tsc --noEmit --incremental false`, aprovado separadamente do build.
- Build de produção local aprovado, sem publicação. Nenhuma dependência adicionada.
- PDF real gerado no Chrome headless com os mesmos módulos do produto, jsPDF instalado e dados exclusivamente fictícios. Renderização com pypdfium2 e inspeção das imagens; extração estrutural com pypdf.
- Exemplo com quatro voluntários gera seis páginas A4: Ana na página 1, Bia na 2, Carlos nas 3 a 5 (relato extenso/URL longa/responsável) e Dora na 6. Marcador final do relato presente na página 4; campos administrativos seguem na 5. Todas as fichas seguintes começam em nova página. Dois cadastros curtos ocupam duas páginas.
- Inspeção: nome e marca AFAPAN proporcionais, seções organizadas, relato legível com acentos/emojis, rodapé numerado, nenhuma declaração jurídica adicionada. Recursos de marca existentes; sem fontes externas ou envio a serviços de geração.
- Consulta simulada com 501 registros e lotes limitados pelo servidor; falhas e mudanças em relações impedem retorno parcial. Geração visual real conferida com quatro registros e relato de 65 parágrafos. Não foi estabelecido limite universal de volume/memória para navegadores.

## Rastreabilidade

| Critério | Evidência local | Limite remoto |
| --- | --- | --- |
| CA-001 | getUser antes e depois da leitura; testes sem sessão/expiração; RLS preservada e nenhum service_role | Conferir papéis reais e políticas implantadas |
| CA-002 | Cursor, mais de 500 registros, lote menor que limite, exclusão de arquivados e coleta sem filtros | Conferir contagem real autorizada |
| CA-003 | Modelo único de campos usado por CSV/PDF; sem defaults fictícios da listagem | Conferir amostra de registros reais autorizados |
| CA-004 | CSV com aspas, delimitador, quebras e emoji; PDF renderizado com relatos e emojis | Aparência de glifos depende das fontes disponíveis no sistema |
| CA-005 | PDF verdadeiro renderizado; escapes CSV, neutralização de fórmulas e zeros com marcador textual | Importadores CSV variam; confirmar fluxo de importação utilizado pela equipe |
| CA-006 | Testes de data civil e nome do arquivo com America/Sao_Paulo; instante no rodapé | Conferir no navegador publicado |
| CA-007 | Testes de teclado, quantidade, trava, vazio, erro de leitura e falha do PDF sem download parcial | Download efetivamente salvo depende do navegador/usuário |
| CA-008 | 149 testes, TypeScript/build, revisão sem operações de escrita ou mudança de RLS | Validação com papéis reais e publicação não executadas |
| CA-009 | PDF real de seis páginas, casos curtos e continuação; marca, margens e rodapé inspecionados | Impressão física e leitores usados pela equipe ainda não conferidos |

## Compatibilidade e limites

- CSV usa UTF-8 com BOM, ponto e vírgula e campos entre aspas. Apóstrofo inicial protege texto/fórmulas e telefones/IDs/números de endereço; esse marcador pode ficar visível em importadores que não o interpretam. A interface orienta importar esses campos como texto. O formato CSV não permite garantir a inferência de tipos de todos os aplicativos.
- Conferência duplicada lê todos os campos e relações para detectar alterações observáveis. Mudanças posteriores à última conferência são possíveis; não é snapshot transacional.
- Linhas com caracteres além das fontes latinas padrão são renderizadas localmente com fontes do sistema e incorporadas em alta resolução. Essas linhas não são pesquisáveis/extraíveis como texto; os demais campos permanecem textuais. Emojis comuns foram validados no Chrome/Windows, sem promessa de cobertura universal para todo símbolo em todo sistema operacional.
- Nenhum arquivo pessoal foi enviado, persistido remotamente ou colocado em pasta pública. Artefato de exemplo contém apenas dados fictícios e está fora da pasta public.
- A primeira regressão da tela falhou por novo import não mockado; corrigido isolamento do teste. A inclusão de outra região de status exigiu atualizar os testes de cópia para identificar sua mensagem; nenhum cenário foi removido.

## Verificação após publicação autorizada

Conferir exportação CSV/PDF na sessão real, incluindo base maior que uma página e lista com filtros ativos; conferir que arquivados ficam fora mesmo quando visíveis na tela. Abrir e imprimir PDFs, importar CSV com campos de texto e verificar leitura de acentos/relatos/telefones. Conferir negação a anônimos e manutenção das políticas. A exportação não exige migração de banco. Reversão: remover os controles/módulos novos; nenhum dado precisa ser restaurado.
