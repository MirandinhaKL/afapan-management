# Especificação — Correção do salvamento de campanha de voluntários

- Status: substituída pela iniciativa `../cadastro-voluntarios-permanente/specification.md`; não implementar a correção de campanha.
- Data: 2026-10-09.
- Origem: erro em produção ao salvar campanha, com resposta `upstream request timeout` na RPC `save_volunteer_campaign`.

Em 2026-10-09, a responsável dispensou o controle de campanhas e solicitou cadastro permanente. O diagnóstico abaixo permanece como registro histórico; a nova especificação está em preparação para aprovação.

## Objetivo e diagnóstico inicial

Permitir criar e editar campanhas de confirmação com retorno confiável, mantendo controle de concorrência e apenas uma campanha ativa.

A captura comprova timeout na solicitação, mas não determina se houve bloqueio no PostgreSQL, indisponibilidade da infraestrutura ou outro problema. A tela já exibe uma campanha ativa; o payload é necessário para distinguir criação de edição. A função local pode bloquear linhas ao desativar outras campanhas e editar a campanha selecionada. O gatilho local de atualização somente define o timestamp, sem recursão aparente.

Problema adicional confirmado no código local: após salvar, a interface define `updatedAt` com o horário do navegador, em vez da versão persistida pelo banco, podendo produzir conflito falso na próxima edição. Não está comprovado que esse problema explique o timeout.

## Escopo

Diagnosticar a RPC efetivamente instalada e esperas por bloqueios; corrigir o mecanismo responsável quando identificado; usar a versão real da campanha após salvamento; apresentar retorno compreensível para falha ou concorrência.

Não inclui executar a migração 005 do catálogo, apagar dados, encerrar sessões, publicar a aplicação ou alterar produção sem autorização explícita. Nenhuma correção será escolhida apenas a partir da mensagem genérica de timeout.

## Requisitos

- RF-001: criar e editar campanhas válidas, preservando nome, prazo, textos, versões e situação conforme informado.
- RF-002: manter apenas uma campanha ativa e impedir sobrescrita de edições concorrentes.
- RF-003: utilizar a versão persistida da campanha para edições posteriores, sem fabricar timestamp no cliente.
- RF-004: informar sucesso somente quando o salvamento estiver confirmado; diante de timeout, não reenviar automaticamente uma criação cujo resultado seja desconhecido.
- RF-005: em falhas, preservar os dados preenchidos e permitir recuperação sem mensagem técnica incompreensível ou espera indefinida decorrente de bloqueio.
- RNF-001: preservar autenticação, RLS, grants, dados existentes e isolamento de segredos.
- RNF-002: testar criação, edição sucessiva, concorrência e tratamento de falhas; executar testes relevantes e TypeScript.
- RNF-003: eventual alteração de banco deve ter migração incremental, impacto, compatibilidade, reversão e verificação documentados no plano aprovado.

## Critérios de aceite

- CA-001: uma criação válida recebe confirmação e reaparece com os valores persistidos.
- CA-002: duas edições consecutivas na mesma sessão funcionam quando não há alteração concorrente.
- CA-003: uma edição realmente desatualizada é rejeitada sem sobrescrever os valores mais recentes.
- CA-004: ativar uma campanha mantém a regra de no máximo uma ativa.
- CA-005: falha ou timeout não exibe sucesso falso nem dispara criação automática duplicada; os dados do formulário permanecem disponíveis.
- CA-006: se houver bloqueio confirmado, o comportamento de espera e recuperação definido no plano é verificado em ambiente autorizado.
- CA-007: nenhuma alteração fora do escopo ocorre; testes e TypeScript passam e limitações remotas são registradas.

## Riscos e validação

Um timeout no gateway não comprova rollback da operação. Repetições cegas podem criar ou alterar campanhas mais de uma vez. Locks e funções reais podem diferir do repositório; inspecionar produção antes de definir a correção de banco.

As consultas em `diagnostico-somente-leitura.sql` consultam metadados e esperas sem alterar dados, encerrar sessões ou revelar payloads pessoais. Uma consulta sem bloqueios depois do erro não descarta um bloqueio transitório ocorrido antes.

Validação remota depende do payload da chamada (campos `p_id` e `p_expected_updated_at`), status HTTP e inspeção do banco durante a solicitação. Não compartilhar tokens, cookies ou chaves de API.

## Aprovação

- [ ] Especificação aprovada pela responsável antes do plano técnico.
- [ ] Plano técnico e tarefas aprovados antes da implementação.
- [ ] Alterações remotas autorizadas separadamente, se necessárias.
