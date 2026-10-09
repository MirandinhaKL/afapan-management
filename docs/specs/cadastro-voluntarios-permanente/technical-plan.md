# Plano técnico — Cadastro permanente de voluntários

- **Status:** Aprovado em 2026-10-09; implementação local autorizada.
- **Data:** 2026-10-09.
- **Especificação:** `./specification.md`, aprovada em 2026-10-09.
- **Tarefas:** `./tasks.md`.

## 1. Solução

Preservar a rota pública e as funcionalidades administrativas de voluntários, substituindo a dependência de campanha por configuração própria dos textos de consentimento. O endereço será sempre copiável e visível na tela interna. A nova RPC pública não consulta nem bloqueia campanhas e cria registros sem `campaign_id`.

Nenhuma dependência npm nova é prevista. A tabela histórica de campanhas e suas associações existentes permanecem. Não haverá prazo artificialmente distante, campanha oculta ou controle de ativação do formulário.

## 2. Configuração e consentimentos

Criar `public.volunteer_registration_settings` com um único registro identificado por `id = 1`, contendo `privacy_text`, `privacy_version`, `participation_text` e `participation_version`. Restrições exigirão identificador único e textos/versões não vazios. Não haverá coluna de prazo, campanha ou ativação.

Inicializar com os dois textos aprovados na especificação e versões `permanente-1`. A versão própria distingue novos aceites dos antigos, mesmo quando o texto de privacidade permanece igual. A configuração não terá editor na interface; mudanças futuras exigirão novo texto/versionamento e revisão correspondente.

A configuração do banco será a fonte dos textos exibidos e persistidos. Novos consentimentos serão gravados com texto, versão, origem e instante de aceite; aceites anteriores não serão atualizados.

O envio público incluirá as versões efetivamente apresentadas. A RPC comparará essas versões com a configuração atual; divergência retornará erro próprio de formulário desatualizado, sem gravar cadastro ou consentimentos. A interface preservará os dados e orientará atualizar os textos antes de enviar novamente. Não confiar em texto ou versão arbitrária fornecidos pelo cliente.

Na criação assistida, usar os textos/versões atuais da mesma configuração, preservando a confirmação recebida durante o atendimento e o registro da autorização do responsável. Edições não criarão nem reescreverão aceites antigos.

## 3. Página pública e API

- Criar `GET /api/volunteers/form`, retornando apenas os quatro campos públicos de configuração, sem dados de campanhas, identificadores de voluntários ou segredos.
- A consulta usará o cliente de servidor com acesso limitado à configuração e resposta sem cache compartilhado para evitar versões obsoletas dos textos.
- `app/voluntariado/cadastro/page.tsx` consultará essa API e tratará falhas técnicas de carregamento, sem mensagem de período encerrado.
- `VolunteerPublicForm` receberá configuração própria em vez de `campaign`. Remover nome de campanha e `Responda até`; usar identificação institucional de cadastro permanente e a declaração de interesse aprovada.
- Manter campos, fotografia preparada, máscaras, validações, resumo de erros, responsável, consentimentos e confirmação de recebimento.
- `POST /api/volunteers/submit` preservará validação de domínio, honeypot, HMAC, limite atual de tentativas e mensagens genéricas de duplicidade/falha.
- O POST chamará `submit_permanent_volunteer_registration(jsonb,text,text)`. O payload terá versões de consentimento, mas não identificador ou dados de campanha.
- Falha, timeout ou configuração indisponível não causará sucesso falso ou repetição automática de criação.
- A rota antiga `/api/volunteers/campaign/active` deixará de consultar campanhas e processar expiração. Retornará erro de atualização necessária para páginas antigas, sem criar campanha ou fabricar prazo. A aplicação nova não a utilizará.

## 4. Gestão interna e contratos

- Retirar de `VolunteersPage` estado de campanha, diálogo, botão, resumo, consultas e salvamento de campanha.
- Exibir endereço absoluto baseado na origem atual e na rota fixa, evitando copiar o domínio errado em testes/homologação. Inicializar a origem somente no navegador para evitar divergência de renderização.
- Mostrar o endereço completo como link de abertura e manter `Copiar link` disponível, inclusive quando a listagem falhar.
- Reutilizar `copyTextToClipboard`, com mensagem acessível de sucesso/falha; a alternativa manual usará o endereço visível, não a barra da página administrativa.
- Preservar filtros recolhidos, paginação, detalhes, cadastro assistido, edição, validação, arquivamento e restauração.
- Remover `VolunteerCampaign`, funções administrativas de campanha e diálogo não utilizado do código em uso. Manter `campaignId` somente como dado histórico, sem torná-lo requisito ou usá-lo no novo envio.
- Remover testes das regras de campanha substituídas e incorporar cenários equivalentes do fluxo permanente; preservar testes dos demais comportamentos.

## 5. Migração do banco

Preparar localmente `006-permanent-volunteer-registration.sql` nesta pasta, dentro de transação:

1. Criar configuração, restrições, RLS e permissões; inserir os textos/versões iniciais sem sobrescrever silenciosamente eventual configuração existente.
2. Criar a nova RPC pública permanente com `SECURITY DEFINER`, `search_path` vazio e referências qualificadas.
3. Reutilizar a gravação transacional dos campos de perfil, frequência, interesses e responsável, retirando apenas a consulta/associação de campanha e substituindo a origem dos textos de consentimento. Garantir situação pública inicial fixa `aguardando_validacao` e `campaign_id` nulo, independentemente do payload.
4. Manter normalização/unicidade de telefone, restrições existentes, auditoria e histórico. Validar aceites e versões antes de gravar. A operação inteira deve reverter em erro.
5. Atualizar `save_assisted_volunteer(uuid,timestamptz,jsonb)` para usar os novos textos na criação, preservando autenticação, concorrência, situações administrativas, vínculos históricos e comportamento de edição.
6. Substituir `process_expired_volunteer_campaigns()` por função sem efeitos, retornando zero. Preservar temporariamente a assinatura para que chamadas antigas não alterem situações ou interrompam outros fluxos. A função não deve limpar tentativas nem alterar campanhas.
7. Revogar a execução operacional da RPC antiga de cadastro com campanha e da RPC de salvamento de campanha para os papéis da aplicação, preservando suas definições como histórico/reversão. Conferir todas as assinaturas existentes no ambiente, sem remover funções por `cascade`.
8. Criar a função específica de limpeza e remover o agendamento antigo de expiração, caso instalado. Não instalar extensão de agendamento automaticamente.

A migração não executará `DELETE` ou atualização em massa de voluntários, interesses, campanhas, consentimentos, disponibilidade, histórico ou auditoria; não removerá a coluna `campaign_id`, sua chave estrangeira, tabela histórica ou índices.

### Catálogo e instalação nova

006 independe da exclusão de interesses de 005: não redefine catálogo, remove descrições ou altera restrições de atividades. As gravações permanentes usam somente `volunteer_id` e `atividade`, compatíveis com a estrutura pós-004 e com a estrutura pós-005, desde que os valores enviados pertençam ao catálogo instalado.

A aplicação local já usa o novo catálogo. Antes de publicar, verificar a restrição e o catálogo reais do ambiente. Se 005 estiver pendente, registrar o impedimento da publicação coerente do catálogo; obter autorização separada para essa iniciativa, sem executá-la implicitamente ou publicar uma aplicação que envie códigos rejeitados pelo banco.

Para instalação nova, documentar 001 como base histórica e 006 como migração necessária do fluxo permanente. Não reaplicar 001 ao banco existente. Reconciliar instruções antigas para não instalar novamente 002 após 006. Caso 005 seja executada posteriormente, 006 deverá ser reaplicada em seguida ou suas definições conciliadas, pois 005 redefine a RPC assistida com os consentimentos anteriores. A reaplicação de 006 deve preservar dados/configuração.

## 6. Segurança e RLS

- Configuração: RLS habilitada, sem acesso direto de `anon` ou `authenticated`; o servidor lê a configuração por `service_role`. As RPCs administrativas autorizadas acessam os textos internamente.
- Nova RPC pública: revogar execução de `PUBLIC`, `anon` e `authenticated`; conceder apenas a `service_role`. O navegador continua enviando somente pela API de servidor.
- RPC assistida: manter execução para `authenticated`, verificando `auth.uid()`; sem execução anônima.
- Função de limpeza: execução apenas para `service_role` e execução administrativa do agendador; sem escrita pública direta.
- Preservar as políticas RLS e os grants existentes das tabelas de dados pessoais. Nenhuma chave de serviço será incluída em código cliente, resposta pública ou `NEXT_PUBLIC_*`.
- Antes de orientar execução remota, apresentar finalidade, efeitos, riscos e consultas de verificação.

## 7. Limpeza das tentativas temporárias

Criar `purge_old_volunteer_submission_attempts()`, idempotente, excluindo somente tentativas com `criado_em < now() - interval '24 hours'` e retornando quantidade removida. Isso mantém a retenção já prevista, sem afetar a janela de uma hora do limite ou qualquer dado permanente.

Se `pg_cron` já existir, cancelar somente o job conhecido de expiração e agendar a limpeza separada, verificando se há outro job que invoque a função antiga. Não remover jobs de outros módulos. A função antiga sem efeitos protege contra chamadas residuais.

Sem agendador, a API executará a limpeza antes de contabilizar/gravar uma nova tentativa válida. Esse fallback também será usado com agendador, tornando o controle independente de sua disponibilidade. Falha na limpeza será tratada como erro técnico antes de gravar voluntário; não haverá fallback que altere situações.

## 8. Validação e rastreabilidade

| Evidência | Critérios |
| --- | --- |
| Página e API de configuração sem consultar campanhas; campanhas ausentes, inativas ou vencidas não interferem | CA-001, CA-002, CA-004 |
| Cadastro público com campaign_id nulo, situação fixa, textos/versões corretos; versão desatualizada rejeitada sem gravação | CA-002, CA-005 |
| Link visível, abertura, cópia moderna, alternativa e falha; sem consulta de campanha, mesmo com falha da listagem | CA-003, CA-004, CA-011 |
| Domínio e API: duplicidade, validações, menor, honeypot, limites, mensagens sem dados pessoais | CA-007, CA-010 |
| Formulário e API: falha técnica mantém valores, não repete criação nem confirma sucesso | CA-010 |
| Cadastro assistido, edição, filtros, validação, arquivamento e restauração | CA-009 |
| Revisão estática do SQL e execução controlada: ausência de exclusão de dados permanentes, função antiga sem efeitos, limpeza limitada | CA-006, CA-008 |
| PostgreSQL autorizado: migração, RLS, grants, consentimentos, unicidade, rollback e agendamento | CA-005, CA-006, CA-007, CA-008, CA-012 |
| Testes completos, TypeScript, build, teclado, celular e teste de fumaça após publicação | CA-011, CA-012 |

Testes estáticos não substituem execução PostgreSQL. Registrar separadamente implementação local, verificação de banco e validação após publicação. Comparar contagens e amostras de registros históricos antes e depois da migração, antes de cadastrar dados de teste.

## 9. Implantação e compatibilidade

1. Concluir implementação, testes e preparo de SQL/verificação/reversão locais.
2. Após autorização remota específica, inspecionar definições reais, versões do catálogo, permissões e jobs; capturar configuração, definições de RPCs e contagens históricas para comparação/reversão.
3. Preparar a nova versão e combinar uma janela curta de manutenção, sem envios públicos ou alterações administrativas. Conferir jobs/execuções de expiração já em andamento antes de aplicar a alteração; não encerrar sessões automaticamente.
4. Aplicar 006 transacionalmente e verificar configuração, RPCs, grants, RLS, ausência de jobs de expiração e integridade dos dados.
5. Publicar a aplicação somente com catálogo compatível e migração permanente validada. Páginas antigas que dependam de campanha precisarão ser recarregadas; não manter uma campanha fictícia para compatibilidade.
6. Testar formulário público, versões/consentimentos, duplicidade, cadastro assistido, link/copiar, filtros e ausência de controles de campanha; conferir funcionamento sem campanhas ativas.
7. Liberar o fluxo e registrar evidências. A aprovação do plano não constitui autorização para SQL remoto, publicação ou exclusão de interesses.

## 10. Reversão

Antes do commit, falha em 006 reverte suas operações. Após commit, uma reversão deve ser coordenada com aplicação e tráfego: restaurar definições/grants capturados das RPCs e aplicação anterior, mantendo todos os novos voluntários e consentimentos.

Não apagar configuração, cadastros com `campaign_id` nulo ou aceites `permanente-1`; a aplicação anterior pode precisar de ajuste para preservar esses registros. Campanhas antigas e seus vínculos estarão intactos.

A reversão da aplicação não autoriza reativar o job/função de expiração que altera situações, pois isso retomaria uma regra dispensada pela responsável. Tal retorno exige autorização de negócio explícita. A limpeza temporária pode permanecer independente.

Não executar rollback destrutivo ou comandos que encerrem sessões sem autorização.

## 11. Aprovação

- [x] Especificação aprovada.
- [x] Arquitetura, impacto no banco, compatibilidade e reversão aprovados em 2026-10-09.
- [x] Tarefas e validação aprovadas.
- [x] Implementação local T-001 a T-006 autorizada pela mensagem “aprovado”.
- Operações remotas e publicação continuam dependentes de autorização específica.
