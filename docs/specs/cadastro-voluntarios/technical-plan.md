# Plano técnico — Cadastro e confirmação de voluntários AFAPAN

- **Status:** Aprovado
- **Data de aprovação:** 2026-09-29
- **Especificação:** `./specification.md`
- **Data:** 2026-09-29

## 1. Resumo da solução

O módulo será dividido em duas superfícies:

1. uma página pública, acessada por um único link de campanha, para o voluntário preencher o formulário sem login;
2. uma página interna no painel atual para usuários autenticados cadastrarem, validarem, consultarem, editarem, arquivarem e restaurarem voluntários.

O envio público passará por uma rota de API do Next.js e por uma função transacional do PostgreSQL. O navegador público não terá acesso direto às tabelas. O telefone será normalizado e terá unicidade garantida no banco. Auditoria, consentimentos e mudanças de situação serão persistidos separadamente.

## 2. Impacto no sistema atual

- **Navegação:** novo item `Voluntários` no menu autenticado.
- **Página pública:** nova rota `app/voluntariado/[token]/page.tsx`.
- **APIs:** endpoints públicos para consultar os dados mínimos da campanha e enviar o formulário.
- **Frontend interno:** listagem, filtros, detalhes, cadastro assistido, edição, validação, arquivamento e restauração.
- **Banco:** novas tabelas, índices, funções, gatilhos de auditoria e políticas RLS.
- **Automação:** processamento periódico de campanhas expiradas.
- **Configuração:** novo segredo de servidor para produzir identificadores irreversíveis usados no controle de abuso.
- **Dependências:** nenhuma biblioteca npm adicional prevista.

## 3. Modelo de dados proposto

### `volunteer_campaigns`

- Identificação, nome, token público aleatório, prazo, situação e textos/versionamento do formulário.
- Autoria e datas de criação e atualização.
- Apenas uma campanha poderá ser marcada como principal por vez.
- O token permitirá abrir o mesmo formulário para todos, sem expor identificadores sequenciais.

### `volunteers`

- Nome, sobrenome, data de nascimento e contato.
- Telefone original e telefone normalizado.
- Endereço com bairro e cidade obrigatórios e demais campos opcionais.
- Profissão, habilidades e situação.
- Mês e ano opcionais de início das atividades na AFAPAN, armazenados em colunas numéricas separadas.
- Origem `publico` ou `assistido` e campanha associada quando aplicável.
- Dados do responsável e confirmação de autorização quando menor de idade.
- Metadados de validação, arquivamento, criação e atualização.
- Índice único parcial para telefone normalizado em cadastros não arquivados.

### `volunteer_availability`

- Relação individual com o voluntário.
- Dias da semana e turnos como conjuntos validados.
- Frequência e observações opcionais.

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
- Disponibilidade aceitará múltiplos dias e turnos, com frequências predefinidas.
- `outras` exigirá descrição; `ainda_nao_sei` não exigirá.
- Regras do cliente, API e banco deverão produzir o mesmo resultado de negócio.

## 5. Fluxo público

1. O link compartilhado conterá somente o token aleatório da campanha.
2. A página consultará uma API que retornará nome da campanha, prazo e textos públicos, sem dados de voluntários.
3. O formulário usará Zod e validações de domínio antes do envio.
4. A API repetirá todas as validações, aplicará proteção contra abuso e chamará uma RPC transacional.
5. A RPC validará campanha ativa e prazo, normalizará o telefone, verificará duplicidade e gravará voluntário, disponibilidade, interesses e consentimentos em uma transação.
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
- Listagem paginada no servidor, ordenada por nome, com busca e filtros por situação, cidade, bairro, disponibilidade, interesse e arquivamento.
- Colunas principais: identificação, telefone, idade, aniversário, início das atividades, situação e ações.
- Detalhe em modal responsivo para endereço, disponibilidade, interesses, consentimentos e histórico resumido.
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

### `GET /api/volunteers/campaign/[token]`

- Retorna somente informações públicas da campanha.
- Responde de forma uniforme para token inválido, campanha encerrada ou expirada.

### `POST /api/volunteers/submit`

- Recebe token, dados pessoais, endereço, disponibilidade, interesses e consentimentos.
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
- Nenhuma conta, senha ou link individual para o voluntário.

## 12. Compatibilidade, migração e implantação

1. Criar uma migração aditiva com tabelas, índices, RLS, funções e auditoria.
2. Validar a migração em ambiente de teste, incluindo anon, authenticated e service role.
3. Configurar `VOLUNTEER_FORM_RATE_LIMIT_SECRET` no ambiente local e na Vercel.
4. Publicar a API e as telas sem criar automaticamente uma campanha pública.
5. Criar a campanha pela área interna, conferir prazo e textos e copiar o link.
6. Executar testes de fumaça público e administrativo.
7. Somente então compartilhar o link no grupo do WhatsApp.

Não há alteração destrutiva em tabelas atuais. A reversão da aplicação mantém os novos dados; a reversão do banco será feita desabilitando a campanha e as funções públicas, sem apagar cadastros.

## 13. Estratégia de testes

- **Domínio:** telefone, idade, menor/responsável, interesses, disponibilidade, início das atividades, estados e prazo.
- **Formulário público:** obrigatórios, consentimentos, acessibilidade, preservação de dados, duplicidade e mensagens.
- **API pública:** campanha inválida/expirada, payload inválido, limite, duplicidade e sucesso, com Supabase mockado.
- **Gestão interna:** filtros, paginação, preenchimento da edição, cadastro assistido, validação, arquivamento e restauração.
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
- **Falha do agendamento:** processamento idempotente também ocorre nos acessos relevantes.
- **Conflito de edição:** versão por `atualizado_em` impede sobrescrita silenciosa.
- **Retenção indefinida:** cadastros ficam ocultos, protegidos por RLS e sujeitos a revisão futura da política da AFAPAN.

## 16. Estratégia de reversão

- Desativar a campanha pública para interromper novos envios.
- Reverter a navegação e as telas sem remover as tabelas.
- Revogar a execução da RPC pública, se necessário.
- Desabilitar o agendamento sem apagar histórico.
- Preservar dados e auditoria para correção e nova publicação.

## 17. Aprovação

- [x] Arquitetura e modelo de dados revisados
- [x] Segurança, RLS e proteção contra abuso revisadas
- [x] Migração e reversão compreendidas
- [x] Estratégia de testes aprovada
- [x] Plano técnico aprovado pelo responsável em 2026-09-29
