# Validação local — Estatísticas de voluntários

Data: 2026-10-15. Plano aprovado e implementação local T-001 a T-005 concluída. T-006 (publicação/verificação remota) não executada.

## Verificações

- Suíte completa: **27 arquivos, 171 testes aprovados** (`npm.cmd test -- --maxWorkers=2`).
- TypeScript: `tsc --noEmit --incremental false` aprovado. Executado separadamente porque o build do projeto ignora essa etapa.
- Build local de produção: aprovado; nenhuma publicação realizada.
- Layout: preview estático do componente real, com CSS do build e números fictícios. Chrome headless em 390 px e 1440 px: conteúdo com largura igual ao viewport, sem overflow horizontal. Cards empilhados no celular e três colunas no computador. Capturas inspecionadas visualmente; não representam consulta a dados reais nem validação da tela autenticada remota.
- Nenhuma escrita de banco, migração, alteração de RLS/grants, dependência instalada ou exposição de service_role.

## Rastreabilidade

| Critério | Evidência local | Limitação remota |
| --- | --- | --- |
| CA-001 | Teste de ativos/aguardando com situações variadas e arquivado excluído | Comparar totais no banco real autorizado |
| CA-002 | Início no ano atual versus criação em outro ano; início antigo/ausente/parcial/mês inválido; duas origens e situações variadas; fronteira São Paulo às 03:00 UTC | Conferir qualidade dos campos de início efetivamente cadastrados |
| CA-003 | Head/count exact com 1.205 registros simulados; filtros de cidade e paginação não recarregam nem restringem cards | Performance e contagem real não medidas |
| CA-004 | Integração após cadastro novo, edição, mudança de situação, arquivamento/restauração; falha na mutação não simula atualização; teste de resposta obsoleta | Cadastros de outra sessão entram no próximo carregamento, sem realtime |
| CA-005 | Skeleton sem zero falso, vazio confirmado, erro parcial/count inválido, repetição por teclado e listagem/exportação disponíveis quando indicadores falham | Falhas de rede reais não provocadas |
| CA-006 | getUser antes/depois, troca de sessão rejeitada, RLS existente preservada; estados acessíveis e capturas responsivas inspecionadas | Permissões efetivas e tecnologias assistivas reais pendentes |
| CA-007 | Suíte completa, TypeScript e build aprovados; evidências registradas | Publicação/smoke test dependem de autorização |

## Decisões e limites

- Card anual usa exclusivamente `inicio_atividades_ano` e mês válido em `inicio_atividades_mes`. Não usa criado_em; valores ausentes não são inferidos nem preenchidos automaticamente. Origem e situação não restringem esse card, arquivamento restringe todos.
- Contagens são três consultas paralelas protegidas pela sessão/RLS; podem observar instantes diferentes. Não há snapshot transacional. Os três números podem se sobrepor.
- Ano é derivado em America/Sao_Paulo. Tela aberta verifica virada a cada minuto e ao voltar à aba, recarrega no novo ano e cancela efeitos antigos. Limpeza de timer e listeners testada.
- Estatísticas têm estado separado da listagem. Revisão após mutação bem-sucedida invalida números anteriores até novo resultado; erro na consulta não desfaz uma mutação já concluída.
- Testes de seletor Radix exigiram simular APIs de pointer capture/scroll no jsdom; os métodos originais são restaurados após cada teste. Nenhum mock foi adicionado à aplicação.

## Próxima etapa remota

Após autorização, conferir totais com conta real, registros arquivados e dados de início conhecidos; validar permissões efetivas, erros e apresentação na tela completa. Publicar a versão somente com autorização específica. Não há SQL a executar nesta iniciativa. Reversão: remover componente/consulta/gatilhos de revisão; dados não foram alterados.
