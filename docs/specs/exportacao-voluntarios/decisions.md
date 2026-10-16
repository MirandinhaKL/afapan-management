# Decisões — Exportação de voluntários

- **DEC-001:** responsável revisou os formatos de CSV/Excel para CSV/PDF. Excel fora do escopo.
- **DEC-002:** incluir todos os voluntários não arquivados, sem dependência dos filtros ou paginação; excluir arquivados em ambos os formatos.
- **DEC-003:** PDF com uma ficha por voluntário, iniciada em página própria. Continuação identificada permitida para texto extenso; não cortar respostas.
- **DEC-004:** identificação institucional limitada a nome e logotipo da AFAPAN. Não inventar dados jurídicos.
- **DEC-005:** a mensagem “aprovado” de 2026-10-15 aprova a especificação revisada e autoriza preparar o plano técnico e as tarefas. Implementação aguarda aprovação do plano; publicação não está autorizada.
- **DEC-006 — Técnica aprovada:** geração local na sessão autenticada e consultas protegidas pelas políticas existentes, sem migração ou service_role.
- **DEC-007 — Técnica aprovada:** leitura em lotes com cursor e verificação final de manifesto; consistência observável, sem promessa de snapshot transacional.
- **DEC-008 — Técnica aprovada:** módulo próprio de CSV/PDF para voluntários, sem alterar comportamento dos exportadores genéricos. Prova de fontes/Unicode e inspeção visual do PDF precedem conclusão.
- **DEC-009 — Técnica aprovada:** manter dados cadastrais históricos disponíveis nos registros elegíveis; não exportar consentimentos fictícios derivados de defaults do mapper da listagem.

- **DEC-010 — Aprovação do plano:** mensagem “aprovado” de 2026-10-15 autoriza T-001 a T-006 locais. Publicação e verificações remotas continuam pendentes de autorização.
- **DEC-011 — Consistência:** conferência final compara todos os campos e relações lidos, não apenas atualizado_em; protege alterações de relações que não atualizam o registro pai. Não há snapshot transacional.
- **DEC-012 — Recursos do PDF:** usar a marca real em public/afapan-favicon-master.png. Textos latinos utilizam fonte padrão do gerador; linhas com Unicode adicional são desenhadas em canvas local com fontes do sistema e incorporadas como imagens. Nenhuma fonte ou dependência nova foi instalada; texto dessas linhas pode não ser pesquisável. Acentos latinos seguem como texto.
- **DEC-013 — CSV:** campos textuais sensíveis à conversão e entradas potencialmente interpretadas como fórmula recebem apóstrofo inicial. O arquivo conserva esse marcador explicitamente; leitores CSV puros podem mostrá-lo. Não usar fórmulas para forçar formato.

- **DEC-014 — Revisão visual autorizada:** responsável solicita Exportar semelhante à tela de Compostagem. Reutilizar o componente existente no cabeçalho com PDF/CSV, substituindo bloco separado, sem mudança nos dados ou geradores. Ajuste visual com especificação resumida, testes e TypeScript, sem banco ou publicação.

- **DEC-015 — Omissão administrativa no PDF:** responsável solicita retirar a seção mostrada na captura. Situação, origem, datas cadastrais e campanha histórica permanecem no CSV, sendo omitidas somente na apresentação PDF. Data de geração e paginação do relatório não fazem parte da seção removida e são mantidas.

- **DEC-016 — Colunas CSV:** responsável solicita remover oito colunas do CSV: identificador, nome/telefone/autorização do responsável, situação, origem, atualização e campanha histórica. Criação não foi solicitada para exclusão e permanece. PDF e registros persistidos não mudam. Substitui a parte de DEC-015 que mantinha todas essas colunas no CSV.
