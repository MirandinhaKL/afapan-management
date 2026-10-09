# Plano técnico — Cadastro e confirmação de voluntários AFAPAN

- **Status:** Revisão do catálogo aprovada e implementada localmente; execução e validação remotas pendentes
- **Aprovação anterior:** 2026-09-29
- **Especificação:** `./specification.md`
- **Última atualização:** 2026-10-01
- **Aprovação da revisão:** 2026-10-01
- **Autorização para implementar T-022 a T-025:** confirmada pela responsável em 2026-10-08 nesta solicitação, sem autorização para migração remota.

## 1. Resumo da solução

O módulo será dividido em duas superfícies:

1. uma página pública, acessada pelo endereço fixo `/voluntariado/cadastro`, para o voluntário preencher o formulário sem login; a campanha ativa será localizada internamente;
2. uma página interna no painel atual para usuários autenticados cadastrarem, validarem, consultarem, editarem, arquivarem e restaurarem voluntários.

O envio público passará por uma rota de API do Next.js e por uma função transacional do PostgreSQL. O navegador público não terá acesso direto às tabelas. O telefone será normalizado e terá unicidade garantida no banco. Auditoria, consentimentos e mudanças de situação serão persistidos separadamente.

## 2. Impacto no sistema atual

- **Navegação:** novo item `Voluntários` no menu autenticado.
- **Página pública:** substituir a rota com token por `app/voluntariado/cadastro/page.tsx`; os links de teste antigos não serão preservados.
- **APIs:** endpoint público para consultar a campanha ativa, sem token na URL, e endpoint para enviar o formulário associado à campanha resolvida no servidor.
- **Frontend interno:** listagem, filtros, detalhes, cadastro assistido, edição, validação, arquivamento e restauração.
- **Banco:** novas tabelas, índices, funções, gatilhos de auditoria e políticas RLS.
- **Automação:** processamento periódico de campanhas expiradas.
- **Configuração:** novo segredo de servidor para produzir identificadores irreversíveis usados no controle de abuso.
- **Dependências:** nenhuma biblioteca npm adicional prevista.
- **Ativo visual:** fotografia preparada em `public/voluntarios-afapan-rosto-crianca-desfocado.png`, otimizada para web durante a implementação.

## 3. Modelo de dados proposto

### `volunteer_campaigns`

- Identificação, nome, prazo, situação e textos/versionamento do formulário.
- Autoria e datas de criação e atualização.
- Apenas uma campanha poderá estar ativa para o formulário público por vez, com restrição ou RPC transacional que impeça ambiguidade.
- O token legado deixará de fazer parte do contrato público; como o módulo ainda está em testes, não será necessária rota de compatibilidade.

### `volunteers`

- Nome, sobrenome, data de nascimento e contato.
- Telefone original e telefone normalizado.
- Endereço com bairro e cidade obrigatórios e demais campos opcionais.
- Profissão, habilidades e situação.
- Expectativas sobre a AFAPAN, forma como conheceu a associação, experiência anterior de voluntariado, canais de comunicação, ideia de projeto e história de vínculo, todos opcionais.
- Autorização opcional de uso de imagem com três estados possíveis: não respondido, autorizado ou não autorizado.
- Mês e ano opcionais de início das atividades na AFAPAN, armazenados em colunas numéricas separadas.
- Origem `publico` ou `assistido` e campanha associada quando aplicável.
- Dados do responsável e confirmação de autorização quando menor de idade.
- Metadados de validação, arquivamento, criação e atualização.
- Índice único parcial para telefone normalizado em cadastros não arquivados.

### `volunteer_availability`

- Relação individual com o voluntário.
- Somente frequência, restrita aos códigos estáveis `diaria`, `semanal`, `quinzenal`, `mensal` e `eventual`.
- Colunas locais anteriores de dias, turnos e observações serão removidas do script ainda não publicado; se a migração já tiver sido aplicada em algum ambiente, a correção será aditiva e deixará de utilizar essas colunas antes de eventual remoção posterior.

### `volunteer_interests`

- Relação de múltiplas atividades por voluntário.
- Código da atividade e descrição obrigatória para `outras`.
- Restrição de unicidade por voluntário e atividade.

### `volunteer_consents`

- Um registro para cada confirmação obrigatória.
- Tipo, versão, texto ou hash verificável do texto e momento do aceite.
- Identificação de cadastro público ou assistido.

### `volunteer_status_history` e `volunteer_audit_log`

- Histórico imutável de mudanças de situação.
- Auditoria de criação, edição, validação, arquivamento e restauração.
- Usuário autenticado quando a operação for interna; origem pública quando aplicável.
- Valores anteriores e novos nas operações administrativas relevantes.

### `volunteer_public_submission_attempts`

- Controle temporário de tentativas por telefone normalizado e identificador irreversível da origem da requisição.
- Retenção curta, prevista inicialmente em 24 horas.
- Não armazenará o endereço IP em texto aberto.

## 4. Regras de domínio compartilhadas

- Tipos e constantes ficarão em `lib/volunteers.ts`.
- Normalização de telefone aceitará a formatação digitada, removerá caracteres e padronizará país/DDD antes da unicidade.
- Cálculo de idade ocorrerá a partir da data de nascimento e da data corrente, com teste para aniversário ainda não ocorrido no ano.
- Validação de menor exigirá nome, telefone e autorização do responsável.
- Início das atividades aceitará somente mês e ano preenchidos em conjunto, com competência não futura.
- Disponibilidade aceitará somente uma frequência predefinida, apresentada como `Diariamente`, `Uma vez por semana`, `A cada 15 dias`, `Uma vez por mês` ou `Eventualmente`.
- Datas completas serão digitadas e exibidas como `dd/mm/aaaa`, validadas por parser próprio e convertidas para ISO somente nos contratos internos e na persistência.
- Mês e ano continuarão no padrão visual `MM/AAAA` e serão convertidos para as colunas numéricas já previstas.
- Campos de perfil incorporados do formulário de referência serão opcionais e aceitarão ausência sem bloquear o cadastro.
- A autorização de uso de imagem aceitará `true`, `false` ou `null`; `false` e `null` não impedirão o cadastro.
- `outras` exigirá descrição; `ainda_nao_sei` não exigirá.
- Regras do cliente, API e banco deverão produzir o mesmo resultado de negócio.

## 5. Fluxo público

1. O link compartilhado será sempre `/voluntariado/cadastro`.
2. A página consultará uma API que localizará a única campanha ativa e retornará nome, prazo e textos públicos, sem expor token nem dados de voluntários.
3. O formulário usará Zod e validações de domínio antes do envio.
4. A API repetirá todas as validações, aplicará proteção contra abuso e chamará uma RPC transacional.
5. A API resolverá novamente a campanha ativa no momento do envio; a RPC validará campanha e prazo, normalizará o telefone, verificará duplicidade e gravará voluntário, frequência, interesses, perfil e consentimentos em uma transação.
6. Duplicidade retornará resposta genérica com os canais oficiais, sem expor o cadastro existente.
7. Sucesso mostrará apenas a confirmação de recebimento e a situação `Aguardando validação`.

## 6. Proteção contra abuso

- Campo invisível de honeypot para bloquear robôs simples.
- Limite de tentativas no servidor por janela de tempo, combinando telefone normalizado e identificador HMAC da origem.
- Segredo `VOLUNTEER_FORM_RATE_LIMIT_SECRET` disponível somente no servidor.
- Respostas públicas genéricas para duplicidade, bloqueio e falhas inesperadas.
- Limpeza automática das tentativas com mais de 24 horas.
- CAPTCHA não será incluído inicialmente; poderá ser adicionado se os controles locais forem insuficientes.

## 7. Fluxo administrativo

- Novo `VolunteersPage` integrado ao estado de navegação atual.
- Listagem paginada no servidor, ordenada por nome, com busca e filtros por situação, cidade, bairro, frequência, interesse e arquivamento.
- Colunas principais: identificação, telefone, idade, aniversário, início das atividades, situação e ações.
- Detalhe em modal responsivo para endereço, frequência, interesses, novos campos de perfil, autorização de imagem, consentimentos e histórico resumido.
- Busca e filtros ficarão em uma região recolhida por padrão, controlada por botão acessível `Filtros`; o botão exibirá a quantidade de campos de filtro fora do valor inicial.
- Recolher a região manterá os filtros e resultados; `Limpar filtros` restaurará todos os valores iniciais.
- Formulário compartilhado entre cadastro assistido e edição.
- Cadastro assistido poderá iniciar como `Ativo` e registrará o usuário responsável.
- Mutações administrativas usarão RPCs transacionais com `auth.uid()` e concorrência otimista por `atualizado_em`.
- Arquivamento lógico e restauração, sempre com confirmação.

## 8. Campanha e processamento do prazo

- A campanha terá prazo padrão de sete dias e poderá ser alterada por qualquer usuário autenticado.
- Uma função `process_expired_volunteer_campaigns` encerrará campanhas vencidas e mudará registros ainda `Aguardando validação` para `Sem confirmação`.
- A execução principal será agendada no banco com `pg_cron`, em intervalo definido na migração.
- Como defesa adicional, a função será chamada de forma idempotente ao carregar a página administrativa e antes de aceitar um envio público.
- Todas as transições automáticas serão registradas no histórico com origem `sistema`.

## 9. Segurança, RLS e segredos

- Todas as novas tabelas terão RLS habilitada.
- `anon` não terá políticas de `SELECT`, `UPDATE` ou `DELETE` nas tabelas.
- A API pública usará o cliente de servidor já existente e chamará apenas a RPC pública específica.
- O `SUPABASE_SERVICE_ROLE_KEY` continuará restrito ao servidor e nunca será enviado ao navegador.
- Usuários `authenticated` poderão consultar os dados e executar as RPCs administrativas.
- Funções `SECURITY DEFINER` terão `search_path` vazio, objetos qualificados e permissões explícitas.
- Tabelas de consentimento, histórico e auditoria não permitirão escrita direta pelo cliente.
- A aplicação não registrará dados pessoais completos em logs.

## 10. APIs e contratos

### `GET /api/volunteers/campaign/active`

- Localiza e retorna somente informações públicas da única campanha ativa.
- Responde de forma uniforme quando não houver campanha disponível, encerrada ou dentro de prazo válido.

### `POST /api/volunteers/submit`

- Recebe dados pessoais, endereço, frequência, interesses, perfil opcional e consentimentos; a campanha não é escolhida pelo cliente.
- Valida tamanho, formato, idade, responsável, honeypot e limite de tentativas.
- Retorna sucesso, validação, duplicidade ou indisponibilidade sem detalhes internos.

### Operações internas

- Consultas autenticadas usarão a SDK do Supabase com RLS.
- Criação assistida, edição, situação, arquivamento e restauração usarão RPCs transacionais.

## 11. Acessibilidade e experiência

- Formulário em seções curtas com instruções simples e indicador de campos obrigatórios.
- Alvos de toque, tipografia e espaçamento adequados para celular.
- Mensagens de erro associadas aos campos e resumo de validação.
- Preservação dos valores após erros recuperáveis.
- Foco direcionado ao primeiro erro e confirmação clara após envio.
- Máscara visual de telefone sem alterar o valor normalizado persistido.
- Campo textual de data com máscara e validação explícita `dd/mm/aaaa`, evitando depender do formato regional do `input[type=date]`.
- Campo de início das atividades com máscara `MM/AAAA`.
- Introdução acolhedora e fotografia institucional preparada, responsiva, com texto alternativo e carregamento otimizado pelo componente de imagem do Next.js.
- Novos campos opcionais agrupados em seções curtas para não tornar o preenchimento cansativo no celular.
- Nenhuma conta, senha ou link individual para o voluntário.

## 12. Compatibilidade, migração e implantação

1. Como `001-volunteers-schema.sql` já foi aplicado, executar a migração incremental `003-volunteers-form-revision.sql` para adicionar os novos campos, atualizar a frequência e criar a nova assinatura sem token, preservando os dados e a assinatura antiga durante a transição do deploy.
2. Após tornar facultativa a descrição de `Outras atividades`, executar `004-optional-other-activity-description.sql` para remover exclusivamente a restrição antiga de obrigatoriedade. A migração não altera dados, RLS, permissões ou outras validações e pode ser revertida recriando a restrição como `not valid` após tratar eventuais registros sem descrição.
2. Validar a migração em ambiente de teste, incluindo anon, authenticated e service role.
3. Configurar `VOLUNTEER_FORM_RATE_LIMIT_SECRET` no ambiente local e na Vercel.
4. Publicar a API e as telas sem criar automaticamente uma campanha pública.
5. Criar ou ativar a campanha pela área interna, conferir prazo e textos e copiar o endereço fixo `/voluntariado/cadastro`.
6. Executar testes de fumaça público e administrativo.
7. Somente então compartilhar o link no grupo do WhatsApp.

Não há alteração destrutiva em tabelas atuais. A reversão da aplicação mantém os novos dados; a reversão do banco será feita desabilitando a campanha e as funções públicas, sem apagar cadastros.

## 13. Estratégia de testes

- **Domínio:** telefone, idade, menor/responsável, interesses, frequência, datas brasileiras, início das atividades, perfil opcional, autorização de imagem, estados e prazo.
- **Formulário público:** obrigatórios, novos campos opcionais, frequência sem dias/turnos, consentimentos, fotografia, acessibilidade, preservação de dados, duplicidade e mensagens.
- **API pública:** ausência/expiração de campanha ativa, payload inválido, limite, duplicidade e sucesso, com Supabase mockado.
- **Gestão interna:** filtros recolhidos, indicador de filtros ativos, limpeza, paginação, preenchimento da edição, campos de perfil, cadastro assistido, validação, arquivamento e restauração.
- **Persistência:** mapeamento de dados, conflito de concorrência e mensagens de erro.
- **Banco remoto:** RLS anônima, permissões autenticadas, transação, unicidade, auditoria e processamento automático.
- Executar a suíte Vitest, TypeScript sem emissão e build de produção antes da conclusão.

## 14. Observabilidade e privacidade operacional

- Logs conterão apenas categoria do erro e identificador técnico não pessoal.
- Métricas iniciais: envios aceitos, duplicados e bloqueados, sem telefone, nome ou endereço.
- A tela administrativa mostrará datas de criação, validação e última atualização.
- Cadastros arquivados permanecerão armazenados indefinidamente conforme decisão da AFAPAN e ficarão fora da listagem padrão.

## 15. Riscos e mitigações

- **Link compartilhado fora do grupo:** validação interna impede ativação automática; limite reduz abuso.
- **Telefone informado por terceiro:** situação inicial aguarda conferência da equipe.
- **Menor sem autorização válida:** dados do responsável e autorização são obrigatórios, com validação administrativa.

## Revisão técnica — catálogo de atividades agrupado (2026-10-08)

### Modelo de domínio e interface

- Substituir `VOLUNTEER_ACTIVITIES` por uma estrutura agrupada, mantendo um tipo único derivado dos valores aceitos.
- Usar os identificadores: `plantio_arvores_nativas`, `retirada_plantas_exoticas_invasoras`, `coletas_residuos`, `mutiroes_limpeza_areas_publicas`, `ecopontos`, `compostagem_domestica`, `compostagem_escolas`, `oficinas_conscientizacao`, `caminhos_residuos`, `palestras_atividades_educativas`, `apoio_projetos_eventos`, `comunicacao_divulgacao` e `ainda_nao_sei`.
- Renderizar cinco grupos com ícone, título e opções, mantendo `Ainda não sei, quero conhecer as opções` fora dos grupos.
- Fazer `Marcar todas as atividades` operar sobre a lista achatada derivada dos grupos, evitando duas fontes de verdade.
- Remover do frontend, contratos, detalhes e formulários internos todo uso de `outras` e `otherActivityDescription`.

### Migração do Supabase

- Criar `005-volunteer-activity-catalog.sql`.
- Apagar somente as linhas de `public.volunteer_interests`, conforme autorização expressa de não preservar os interesses antigos.
- Remover a coluna obsoleta `outra_descricao` e substituir a restrição de `atividade` pelo novo catálogo.
- Atualizar as RPCs `submit_volunteer_registration(jsonb,text,text)` e `save_assisted_volunteer(uuid,timestamptz,jsonb)` para gravarem apenas `volunteer_id` e `atividade`.
- Preservar a tabela, suas chaves, índice, RLS e políticas; não apagar voluntários, campanhas, consentimentos, auditoria ou histórico.
- Atualizar também `001-volunteers-schema.sql` como definição-base limpa para instalações futuras.

### Compatibilidade, risco e reversão

- Não haverá compatibilidade com valores antigos na aplicação após a migração.
- A exclusão dos vínculos de interesses é intencional e irreversível sem backup. Como a responsável dispensou sua preservação, a migração não criará cópia permanente; recomenda-se exportação manual apenas se essa decisão mudar antes da execução.
- Reversão estrutural: restaurar a coluna e a restrição antigas e reaplicar as RPCs anteriores. Os interesses apagados não serão recuperados por essa reversão.
- A migração será transacional: falhas antes do `commit` desfazem alterações estruturais e exclusões.

### Verificação

- Testes unitários do catálogo achatado, agrupamentos, seleção total, payload público, cadastro assistido e detalhamento.
- TypeScript, suíte completa e build de produção.
- Após SQL remoto: verificar colunas, restrição, assinaturas das RPCs, RLS e ausência de valores fora do novo catálogo.
- Preparação, verificações e reversão detalhadas em `activity-catalog-deployment.md`. As migrações históricas `003` e `004` permanecem como registro; para instalações novas, aplicar `001` e depois `005` caso também tenham sido reaplicadas as migrações históricas.
- Teste de fumaça: salvar um cadastro público e um assistido com opções de grupos diferentes e consultar a listagem/detalhes.
- **Falha do agendamento:** processamento idempotente também ocorre nos acessos relevantes.
- **Conflito de edição:** versão por `atualizado_em` impede sobrescrita silenciosa.
- **Retenção indefinida:** cadastros ficam ocultos, protegidos por RLS e sujeitos a revisão futura da política da AFAPAN.
- **Fotografia sem autorizações expressas dos adultos:** publicar somente a versão preparada, manter possibilidade de retirada imediata e recomendar obtenção das autorizações; substituir ou remover a imagem diante de oposição.
- **Mais de uma campanha ativa:** restrição de banco e RPC administrativa impedirão ativação concorrente; a API falhará de forma segura se detectar ambiguidade.
- **Interpretação de datas:** máscara e parser compartilhado evitarão inversão entre dia e mês; o banco continuará usando tipos de data/valores numéricos apropriados.

## 16. Estratégia de reversão

- Desativar a campanha pública para interromper novos envios.
- Reverter a navegação e as telas sem remover as tabelas.
- Revogar a execução da RPC pública, se necessário.
- Se a revisão precisar ser revertida antes do deploy, revogar a nova assinatura `submit_volunteer_registration(jsonb,text,text)`; as colunas adicionadas podem permanecer sem afetar a versão anterior.
- Desabilitar o agendamento sem apagar histórico.
- Preservar dados e auditoria para correção e nova publicação.

## 17. Aprovação

- [x] Arquitetura e modelo de dados da revisão de 2026-10-01 revisados
- [x] Segurança, RLS e proteção contra abuso da revisão revisadas
- [x] Migração, compatibilidade e reversão compreendidas
- [x] Estratégia de testes da revisão aprovada
- [x] Plano técnico revisado aprovado pelo responsável em 2026-10-01
