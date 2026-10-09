# Implantação controlada do catálogo de atividades

Data: 2026-10-08. T-024 e T-025; RF-056 a RF-063; CA-051 a CA-055.

> Complemento aprovado em 2026-10-09: 005 redefine a RPC assistida. Aplicar/reaplicar 006 depois de 005 para manter consentimentos permanentes; 006 preserva configuração existente. A autorização da implementação local permanente não autoriza executar 005. Após 006, a RPC pública em uso é submit_permanent_volunteer_registration; a antiga tem execução revogada.

## Estado e finalidade

A implementação local substitui o catálogo por doze atividades distribuídas em cinco grupos, mais a opção independente `ainda_nao_sei`. A migração `005-volunteer-activity-catalog.sql` ainda não foi executada. Sua execução depende de autorização explícita da responsável.

Efeitos: excluir todas as linhas de `public.volunteer_interests`, remover `outra_descricao`, substituir a restrição de atividades e atualizar as RPCs pública e assistida. A tabela, chave primária, chave estrangeira, índice, RLS e políticas são preservados. Voluntários, campanhas, disponibilidade, consentimentos, histórico e auditoria não são apagados. A transação reverte todas essas operações se falhar antes do commit.

A exclusão dos interesses é irreversível sem backup, conforme decisão aprovada de dispensar sua preservação. Não há compatibilidade entre os catálogos antigo e novo; aplicação e banco precisam ser publicados em uma janela coordenada. A migração não é destinada a reaplicações depois de novos cadastros: uma nova execução apagaria novamente os interesses.

## Ordem de implantação — somente após autorização

1. Conferir o ambiente alvo e a aplicação prévia de 001, 003 e 004. Registrar contagens de voluntários, campanhas, disponibilidade, consentimentos, histórico e auditoria e capturar definições de constraints, índices, políticas e permissões das RPCs. Se a decisão de dispensar os interesses mudar, exportá-los antes da execução.
2. Preparar a nova versão da aplicação e reservar uma janela sem cadastros ou edições administrativas. Suspender operacionalmente novos envios e edições durante a janela coordenada. O cadastro permanente não possui controle de ativação de campanha.
3. Executar 005 integralmente, sem retirar `begin` ou `commit`. Não reaplicar 001 ao ambiente existente.
4. Executar as consultas de verificação comentadas ao final de 005. Confirmar ausência de `outra_descricao`, restrição com os treze códigos aprovados, chave primária e estrangeira preservadas, índice de atividade preservado e RLS habilitada com as mesmas políticas.
5. Confirmar que as RPCs `submit_volunteer_registration(jsonb,text,text)` e `save_assisted_volunteer(uuid,timestamptz,jsonb)` gravam somente `volunteer_id` e `atividade`. Conferir `SECURITY DEFINER`, `search_path` vazio e grants: pública apenas para `service_role`; assistida para `authenticated`, sem execução anônima.
6. Comparar as contagens de dados preservados antes de qualquer teste de fumaça. Os interesses devem estar vazios imediatamente após a migração. Conferir eventuais assinaturas legadas de RPC existentes no ambiente: a aplicação utiliza somente as duas assinaturas acima.
7. Após autorização específica, aplicar/reaplicar 006 e conferir o roteiro de cadastro permanente antes de publicar a aplicação. Validar os fluxos abaixo antes de compartilhar o link.

## Testes de fumaça e segurança pendentes

- Cadastro público com telefone de teste autorizado e opções de grupos diferentes: recebe confirmação, permanece aguardando validação e aparece com os rótulos novos no detalhe.
- Cadastro assistido com opções de grupos diferentes; editar, salvar e conferir os interesses. Conferir também consentimentos e auditoria.
- Marcar todas seleciona os treze códigos, incluindo a opção independente; remover uma seleção desmarca o controle de seleção total; desmarcar todas limpa a lista.
- Filtrar por uma atividade nova e conferir o resultado. Nenhuma opção antiga ou descrição de outras atividades deve aparecer.
- Enviar código antigo/desconhecido deve ser rejeitado pela API; em teste transacional autorizado, a restrição do banco também deve rejeitá-lo.
- Conferir ausência de acesso direto anônimo aos interesses/voluntários e de execução anônima das RPCs; conferir consultas autenticadas pelas políticas existentes.
- Comparar registros preservados e verificar ausência de atividades fora da lista aprovada após os testes.

## Reversão

Antes do commit, uma falha provoca rollback automático. Depois do commit, interromper novamente envios e edições antes de reverter estrutura e aplicação.

A reversão estrutural precisa remover a restrição nova, restaurar `outra_descricao text` e restaurar a restrição antiga com os dez valores anteriores a partir da versão do arquivo 001 anterior a esta revisão. Se já houver interesses do catálogo novo, decidir previamente como tratá-los: a restrição antiga não aceitará esses valores. Não executar exclusão ou conversão adicional sem autorização específica.

Reaplicar as definições das duas RPCs de 003 e manter o comportamento de descrição facultativa de 004. Restaurar a versão anterior da aplicação, conferir grants/RLS e repetir os testes de fumaça antes de reabrir o cadastro. Isso não recupera os interesses apagados por 005; a recuperação só seria possível com exportação ou backup anterior.

## Validação local

- Suíte Vitest: 98 testes em 19 arquivos aprovados.
- TypeScript sem emissão: aprovado.
- Build de produção: aprovado. A verificação de tipos foi executada separadamente, pois o build do projeto omite essa etapa.
- Testes estáticos de SQL conferem catálogo, gravações, transação declarada e escopo de exclusão, sem executar PostgreSQL.
- Execução SQL, permissões reais, preservação efetiva dos dados e testes após publicação permanecem pendentes de autorização e ambiente remoto.
