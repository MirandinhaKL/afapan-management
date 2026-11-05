# Plano técnico — Conecta AFAPAN

Data: 2026-10-28. Regras confirmadas registradas na especificação; continuidade autorizada para planejamento. **Plano e escolhas P-001 a P-010 aprovados para implementação local em 2026-11-03.** Nenhuma migração, publicação, emissão ou mensagem real executada.

Referências: specification.md (RF-001 a RF-018, RNF-001 a RNF-007, CA-001 a CA-017), programa-conecta-afapan.md, po-audios-summary.md e decisions.md.

## 1. Escolhas complementares propostas para esta aprovação

Estas escolhas fecham as lacunas remanescentes sem atribuir à PO decisões que ela ainda não confirmou. Sua aprovação do plano deverá incluí-las ou indicar ajustes:

| Identificador | Proposta para o MVP |
| --- | --- |
| P-001 | Qualquer estudante pode solicitar, sem cadastro obrigatório de voluntário ou integração automática entre bases. Cursos de Marketing são recomendações, não bloqueios. |
| P-002 | Uma solicitação por modalidade/participação, com data inicial e final, iguais se for uma ação de um dia. Permitir checklist realizado em vários dias; certificado informa o período. Não consolidar várias solicitações em uma emissão nesta fase. |
| P-003 | Para duplicidade, usar CPF normalizado + modalidade estável + período inicial/final. Alterar versão/título da modalidade não permite duplicar a mesma participação. Intervalos sobrepostos geram aviso para conferência interna, sem rejeição automática de participações distintas. Mudança de uma data isolada para período é uma evolução do critério observado no MVP e precisa desta aprovação. |
| P-004 | Recusa exige motivo. Aluno corrige a mesma solicitação por link secreto, temporário e enviado ao e-mail cadastrado; equipe pode devolver para correção. Correção cria revisão histórica, exige evidência válida e retorna a Pendente, sem apagar a recusa anterior ou criar nova chave de duplicidade. |
| P-005 | Equipe confere manualmente se o PDF anexado corresponde ao certificado e se foi assinado. Não implementar verificação criptográfica automática nem automatizar gov.br. O sistema não afirma ter verificado criptograficamente a assinatura. |
| P-006 | Emissão errada pode ser invalidada por usuário interno com motivo obrigatório. Código antigo permanece consultável como Rejeitado; nova emissão corrigida recebe novo código e exige nova assinatura. Preservar vínculo entre emissões e histórico, sem substituir silenciosamente o arquivo antigo. |
| P-007 | Consulta pública de um código publicado mostra situação Aprovado/Rejeitado, modalidade, período e horas; sem nome, CPF, nascimento, e-mail, telefone ou links de arquivo. Publicar apenas depois do upload conferido do PDF assinado. Código de emissão invalidada conserva resposta Rejeitado. Código inexistente ou não publicado retorna resposta genérica sem dados. |
| P-008 | Segunda via solicita CPF/nascimento e, opcionalmente, código do certificado. Sem código, considerar os certificados assinados vigentes correspondentes, agrupados por e-mail original; processar em lotes no servidor com limites operacionais, sem listar resultados publicamente. Com código, somente a emissão correspondente. Nenhum envio para endereço fornecido no formulário. |
| P-009 | Catálogo separado dos demais módulos: projeto agrupador, modalidade de checklist ou horas livres, tarefas, descrição e indicação de cursos. Permitir novos projetos agrupadores ao criar modalidades. Turma/ação/escola/local entram como referência textual no MVP, sem modificar Compostagem/Eco Drive. |
| P-010 | Não importar automaticamente a base do MVP. Registros sem nascimento não participam da segunda via automatizada; a equipe atende por reenvio interno após conferência. Nome/cargo do signatário, texto final, e remetente devem ser fornecidos/aprovados antes da homologação remota. |

P-003 e P-008 merecem atenção especial: a chave de duplicidade precisa acomodar atividades em vários dias; e a solicitação de segunda via pode corresponder a mais de um certificado. Não implementar essas escolhas como se já fossem respostas explícitas da PO.

## 2. Integração com o gerenciador

Adicionar item “Conecta AFAPAN” ao tipo de navegação e menu de `components/dashboard-layout.tsx` e ao seletor de conteúdo principal. Reutilizar autenticação, componentes, cores e padrões de filtro/paginação. Área administrativa com catálogo, solicitações e detalhe; qualquer usuário interno ativo, independentemente de role, pode operar todos esses recursos.

Criar páginas públicas próprias propostas: `/conecta/atividades`, `/conecta/certificados/validar`, `/conecta/certificados/reenviar` e `/conecta/solicitacoes/corrigir#<token>`. Não alterar o formulário de voluntários. Nome público do programa usa “Conecta AFAPAN” como configuração inicial sugerida, sem inventar dados jurídicos.

Separar módulos de domínio, validação, acesso servidor, catálogo, documentos e mensageria. Não reutilizar os defaults de aceite/perfil do mapper de voluntários. Novas dependências somente se necessárias e documentadas; reaproveitar jsPDF para o certificado se a prova de layout/fontes for suficiente.

## 3. Dados e migrações propostas

Criar scripts locais na pasta da iniciativa, separados das migrações antigas de voluntários. Não reaplicar schema base nem atribuir número global que possa colidir com outras iniciativas sem inspecionar o repositório no início da implementação.

Entidades com prefixo `conecta_`:

- **projects:** agrupadores estáveis e descrição.
- **modalities / modality_versions / tasks:** identidade estável da modalidade; versões imutáveis com nome, descrição, modo checklist/horas livres, indicação de curso e tarefas ordenadas. Horas como minutos inteiros, evitando soma em ponto flutuante. Alteração publica nova versão; retirada do catálogo apenas impede novos envios e não apaga versões utilizadas.
- **applications:** identificação UUID; CPF normalizado, nascimento, nome, contato, instituição/curso/Instagram; modalidade estável e versão utilizada, período, referência de ação/local, estado atual, versão de concorrência e metadados de criação/atualização. Dados pessoais protegidos, sem acesso público direto. Snapshot dos textos/tarefas permite histórico estável.
- **application_revisions / declared_tasks / reviewed_tasks:** declaração original, revisões do aluno, tarefa marcada e horas informadas em modalidade livre, conferência da equipe e justificativa das mudanças. Estado/horas calculados pelo servidor; não confiar em total enviado pelo navegador.
- **attachments:** referência de objeto privado, tipo/mime/tamanho/hash, autor/origem, revisão e estado de validação. Evidência do aluno separada do PDF assinado.
- **decisions / audit_events:** aprovação/recusa/devolução e autoria/horário, sem permitir que o cliente escolha autor. Históricos vinculados a revisões, sem UPDATE/DELETE direto pelo cliente.
- **certificates:** aplicação/revisão aprovada, emissão/estado, código aleatório único, snapshot de conteúdo, hash do PDF gerado e assinado, documento vigente, conferência, publicação, motivo de invalidação e vínculo de substituição. Uma emissão vigente por revisão aprovada. Retentativas de geração/envio não criam outra emissão.
- **email_outbox / email_attempts:** evento transacional, destinatário derivado da solicitação, documento e hash, finalidade, chave de idempotência, estado, tentativas e referência do provedor. Sem anexos/base64 ou conteúdo pessoal em logs técnicos.
- **upload_sessions / correction_tokens / public_attempts:** escopo e expiração de uploads, hash de token de correção, tentativas de abuso e HMAC de identificadores/origem. Segredos não armazenados em texto puro nesses registros.

Constraints: minutos positivos por tarefa/hora livre, período inicial <= final, unicidade de chave de participação aprovada em P-003, integridade revisão/modalidade/documento, uma tarefa no máximo por checklist e emissão/código únicos. Não impor teto acumulado por aluno/ano/modalidade/programa. Precisão proposta de horas livres: minutos inteiros positivos; converter entrada h/min, sem arredondar silenciosamente.

Tabela de configuração guarda somente dados institucionais não secretos, templates versionados e parâmetros operacionais. Credenciais de e-mail, service_role, HMAC e chave de worker permanecem no servidor. Cargas iniciais seedadas do documento da PO, com soma validada; Visitas técnicas em modo livre, sem seed de 12 h obrigatório. Reaplicação de seed não sobrescreve modalidades já administradas pela equipe.

## 4. Autorização, RLS e exposição pública

Todas as rotas administrativas recebem a sessão do usuário, verificam JWT no Supabase via getUser e perfil ativo em `profiles`. Não confiar em role/ativo vindos do navegador nem considerar apenas sessão presente no React. Qualquer role interno com perfil ativo tem o mesmo acesso neste módulo; conta inativa, ausente, anônima ou token de correção não obtém acesso administrativo.

Habilitar RLS em todas as tabelas. SELECT administrativo condicionado a usuário interno ativo. Mutação de catálogo, decisão, emissão, invalidação e agendamento de e-mail por RPC transacional com autorização conferida no banco; revogar INSERT/UPDATE/DELETE direto das tabelas sensíveis aos papéis do navegador. Funções SECURITY DEFINER com search_path vazio, nomes qualificados e EXECUTE restrito por assinatura. Sem políticas anônimas de leitura da base pessoal.

Rotas públicas de catálogo retornam somente modalidades publicadas e campos necessários. Envio público, correção, segunda via e consulta de código passam por APIs de servidor com operações específicas, validação e escopo mínimo; service_role nunca sai do servidor. Não criar RPC pública genérica para executar SQL nem expor consultas livres. Ações administrativas não usam service_role para contornar autorização do usuário; operações privilegiadas de arquivo/mensageria precisam conferir usuário/escopo antes do uso.

Antes de homologar, verificar as políticas efetivas de `profiles`, permissões de autoedição de ativo/role e possibilidade de signup público produzir conta interna automaticamente. O arquivo base versionado contém autoedição de perfil, mas não comprova a configuração remota atual. A regra “usuário interno ativo” só pode ser considerada protegida se esses atributos não puderem ser autoelevados por pessoa não autorizada. Se o ambiente divergir, registrar impedimento e propor correção isolada para aprovação; não alterar silenciosamente autenticação de outros módulos.

## 5. Formulário público, anexos e correção

### T-015 — Ajustes após testes do formulário (2026-11-04)

Usar atributos `inputMode` e estado de campo controlado somente para CPF e WhatsApp. Formatar a apresentação durante digitação/colagem e extrair dígitos no payload, preservando zero inicial. Reaproveitar os schemas existentes para formato/tamanho do e-mail, CPF e telefone, alinhando mensagens do cliente e servidor. Aplicar espaçamento uniforme com utilitários de layout existentes.

Investigar o envio pela ordem formulário → reserva de upload → URL assinada → Storage → API de submit → RPC. Instrumentar erros com mensagens seguras no cliente, sem registrar dados pessoais ou segredo. Manter valores no formulário após falha; repetir upload somente quando a reserva anterior não puder ser retomada. Tratar clique repetido com estado ocupado. Confirmação de sucesso somente após resposta de persistência. Criar testes de máscara, validação e envio/erro e executar testes, TypeScript e build local. Sem alteração de schema, migração, dependências ou serviço externo.

Zod/validações comuns no cliente e servidor: CPF com dígitos verificadores, nascimento completo válido e não futuro, telefone/e-mail, limites proporcionais de texto, período não futuro proposto e versão de modalidade vigente. Nome/CPF/nascimento nunca na URL. Checklist apresenta tarefas e horas; aluno marca o executado. Modalidade livre recebe descrição e horas. Mostrar prévia da soma declarada, claramente sujeita à conferência.

Exigir ao menos uma evidência validada por solicitação/revisão. Proposta operacional inicial: até cinco anexos e 100 MiB no total; imagens JPEG/PNG/WebP até 10 MiB cada, PDF até 15 MiB e vídeo MP4/WebM até 50 MiB. Outros tipos não são aceitos silenciosamente: converter para PDF/imagem ou revisar a allowlist. Esses limites são de arquivo, não limite de horas ou participações.

Criar sessão de upload com quota, validade e segredo de escopo, depois gerar URLs de upload restritas a caminhos aleatórios e create-only. Não trafegar vídeos completos pela função Next.js: enviar ao Storage por URL restrita, respeitando limites da plataforma. MIME declarado não basta; validar extensão, assinatura do arquivo, tamanho e vínculo no servidor antes de finalizar solicitação. Sem SVG/HTML/ZIP/executáveis. Preview de conteúdo potencialmente ativo apenas em isolamento; PDFs e arquivos por download autorizado, não como HTML arbitrário. Definir prova de vídeo e inspeção de arquivos no T-001; scanner externo não é presumido ou contratado sem autorização.

Bucket privado `conecta-documents`, sem listagem ou leitura anônima. Prefixos separados para evidências, PDFs gerados, assinados e quarentena temporária. Upload parcial/orfão não cria Pendente nem comprovação válida. Finalização transacional requer evidência verificada e idempotency key de escopo; expirar sessões temporárias sem excluir registros ou arquivos. Links de leitura curtos e autorizados; access token público de upload não pode ler/listar/substituir arquivos.

Correção por token de alta entropia enviado ao e-mail cadastrado, hash no banco, expiração proposta de 48 h e revogação após nova submissão. O navegador lê o fragmento do link, remove-o da barra de endereço e guarda o token em memória durante a correção. As APIs de escopo restrito recebem o token via POST; a página restringe o referenciador e as respostas usam no-store. O worker deve verificar a vigência do link antes de enviar. Permitir ajustar checklist/relato/evidências em solicitação devolvida ou recusada, preservando versões. Não permitir trocar publicamente CPF/nascimento/e-mail, assinar ou mudar horas aprovadas. Troca de identificação/destinatário exige conferência administrativa registrada.

## 6. Análise, concorrência e histórico

Fluxo principal: Pendente → Aprovada ou Recusada; devolução/correção cria revisão e retorna a Pendente. Assinatura e e-mail têm estados próprios: aprovado não significa assinado/enviado. Guardar autor e instante em cada transição, com esperado updated_at/revision para evitar sobrescrita concorrente.

Aprovação bloqueia/revalida a revisão atual em transação, verifica evidências válidas e calcula minutos pelas tarefas reconhecidas. Equipe pode marcar/desmarcar e justificar diferenças; versão da tarefa determina valor. Modo livre aceita minutos conferidos pelo avaliador com justificativa se divergir. Não creditar a mesma tarefa duas vezes na revisão; não somar duas aprovações da mesma solicitação. Nova participação válida pode continuar acumulando sem teto.

Busca administrativa por nome/CPF com normalização e escaping, paginação e contagem no servidor. Histórico por identidade exige acesso interno; CPF/nascimento incompatíveis não devem sobrescrever outro aluno automaticamente. Listagem não retorna anexos ou nascimento desnecessariamente; detalhe acessa os dados pertinentes. Ajuste de pessoa, correção e invalidação ficam auditados.

## 7. Certificados e consulta

Gerar um PDF A4 horizontal por solicitação/revisão aprovada conforme P-002. Template próprio e versionado, marca real existente, texto/nome/cargo/local aprovados; bloquear emissão real se configuração obrigatória faltar. Dados fictícios nos previews locais. Somente o total reconhecido no servidor vai ao certificado. Não escrever “assinatura verificada” por apenas ter upload.

Código de consulta aleatório com pelo menos 128 bits de entropia, único, não sequencial nem derivado de CPF/data. Formato legível e validação de tamanho; não restringir ao exemplo curto do MVP. Geração é idempotente por emissão; armazenar artefato para download repetido sem mudar data ou código. Template alterado não regenera certificados anteriores.

PDF unsigned é baixado pela equipe e assinado fora do sistema. Upload assinado tem validação estrutural, hash e confirmação explícita de conferência pelo usuário responsável. Não reconstruir/recomprimir/editar o documento depois da assinatura. Uma versão assinada publicada não é substituída por upload silencioso; correção segue invalidação e nova emissão de P-006.

Consulta pública por código usa projeção mínima de P-007, no-store e rate limit, sem URL de bucket, CPF, nome ou endpoints administrativos. Publicação após conferência independe da aceitação de e-mail pelo provedor. Invalidar código também bloqueia novas filas de envio e a segunda via; worker deve revalidar emissão vigente no momento do despacho. Históricos e arquivos antigos continuam privados para auditoria, sem afirmar que uma cópia já recebida pelo aluno pode ser apagada remotamente.

## 8. E-mail, segunda via e recuperação de falhas

Revisão do remetente: `afapan.ong@gmail.com` foi escolhido pela responsável. A integração proposta passa a ser Gmail API com OAuth e escopo mínimo `gmail.send`, substituindo o exemplo de Resend abaixo. Não basta preencher o campo From em outro provedor. A conta institucional precisa autorizar o aplicativo no Google; manter credenciais no servidor e desenvolvimento com adaptador simulado. A API não é tratada como garantia de envio exatamente uma vez: timeout incerto permanece sujeito a conferência antes de nova tentativa.

O repositório não apresenta serviço de e-mail configurado. Criar interface de provedor e implementação simulada local que nunca envia mensagens; adapter inicial proposto por API HTTP de serviço transacional (ex.: Resend), sem SDK obrigatório. Escolha final, conta, domínio/remetente autorizado, custos, credencial e limites precisam ser confirmados antes da integração remota. Não criar conta nem usar credenciais do chat no código. Templates de recebimento/devolução/recusa/certificado versionados e escapados para evitar HTML injection.

Outbox criada em transação com o evento correspondente, worker autenticado com segredo exclusivo e lease/claim atômico; chave estável por evento evita jobs duplicados. Envio é externo à transação SQL. Sucesso significa aceitação pelo provedor, não leitura/entrega. Falha preserva estado e gera nova tentativa com backoff; timeout com resultado desconhecido exige idempotência/reconciliação do provedor, sem disparar de novo cegamente. Não prometer exactly-once em serviços externos sem suporte confirmado. Jobs de reenvio explícito têm identificadores novos e mantêm a mesma emissão/documento.

Agendamento proposto por mecanismo da hospedagem ou pg_cron já disponível, configurado apenas após autorização e verificação de compatibilidade. Não instalar extensão implicitamente. Verificar limites de duração, attachment size/base64 e execução da hospedagem; anexos assinados propostos até 10 MiB, reduzidos se o provedor exigir. Evidências do aluno não são anexadas aos e-mails de certificado.

Segunda via: POST com CPF/nascimento e código opcional. Resposta HTTP 202 padronizada e mensagem genérica tanto para encontrado quanto inexistente/divergente/inelegível. Não retornar nome, e-mail mascarado, quantidade ou motivo específico. Desacoplar resposta do envio e não executar envio em GET. HMAC server-side de identificadores/origem para limitação e buscas auxiliares; não guardar entrada integral em logs técnicos. CPF/nascimento não equivalem a login.

Proposta inicial antiabuso, configurável e validada no T-001: no máximo cinco pedidos de segunda via por origem/hora, intervalo de 15 min por certificado/destinatário e três reenvios por destinatário/dia. Cotas aplicadas no banco antes do trabalho caro; respostas não revelam se a limitação se deve a registro encontrado. Proteger também submissão/upload e correção contra quota, replay, automação e gasto de Storage. Não diferenciar publicamente tempo/resultado de lookup de forma evidente. CPF/nascimento divergentes nunca enviam, mesmo que código seja válido.

Sem código, P-008 permite agrupar documentos vigentes por e-mail original, fracionando no worker conforme limite do provedor; não retorna lista ao navegador. Registros com destinatários distintos não se unificam sob um endereço escolhido pelo solicitante. Legados sem nascimento são atendidos pela equipe, não mediante inferência automática. Alteração de e-mail exige análise interna com histórico, fora do formulário público de segunda via.

## 9. Privacidade, retenção e configuração

PII nas tabelas e arquivos protegida por RLS, transporte seguro, acesso autenticado e configuração de armazenamento do ambiente; não declarar criptografia adicional que não foi implementada/verificada. URLs privadas expiram; não registrar payload completo, tokens, arquivos ou documentos em telemetry. Revisar o aviso de privacidade antes da produção.

Conforme DEC-026, preservar dados e arquivos, inclusive registros de upload. Não disponibilizar exclusão na interface, APIs ou rotinas programadas do módulo. Sessões, tokens e URLs podem expirar; expiração não remove arquivos ou registros. Invalidar certificados ou retirar modalidades mantém o histórico. Planejar capacidade de armazenamento sem descarte automático.

Variáveis propostas somente servidor: configuração Supabase existente, `CONECTA_FORM_SECRET`, `CONECTA_WORKER_SECRET`, credencial do provedor e remetente. Nome/cargo/texto da instituição versionados em configuração administrativa; nenhum segredo em NEXT_PUBLIC. Configuração faltante produz indisponibilidade clara internamente e mensagem pública sem detalhes de infraestrutura.

## 10. Implantação, compatibilidade e reversão

Preparar SQL local transacional para schema/RLS/RPCs/seed e instruções separadas para bucket/configuração/jobs. Migração aditiva, sem apagar dados de voluntários, Compostagem, Eco Drive ou do MVP. Capturar antes definições/grants/políticas, contagens e parâmetros do Storage; verificar também `profiles` e onboarding de usuários. Testes PostgreSQL locais se disponível; não substituir execução SQL por simples teste textual de strings.

Ordem remota, somente após autorização: inspeção somente leitura → backup/revisão → aplicar schema/políticas → configurar bucket privado/remetente/worker → publicar aplicação compatível → habilitar envios e jobs após smoke test. Testes não enviam para destinatários reais sem autorização. Aplicação anterior não usa novas tabelas; desligar módulo/worker reverte exposição funcional sem apagar dados.

Reversão antes do commit por rollback da transação. Depois do commit, desabilitar rotas/jobs/envios, restaurar versão compatível da aplicação e preservar tabelas/arquivos/históricos para recuperação. Não DROP CASCADE nem apagar documentos já assinados para simular rollback. Mensagem já aceita pelo provedor não pode ser desfeita; registrar a situação para conferência.

## 11. Validação e entregáveis

Testes: domínio/CPF/nascimento/períodos; catálogo/versões; checklist e revisão; soma parcial/integral; horas livres; novas participações sem teto; duplicidade/concorrência; anexos obrigatórios e validação real de formato; uploads parciais/quota; autenticação ativa/troca de usuário; token de correção; emissão e invalidação; consulta mínima; segunda via genérica; outbox, timeout incerto e idempotência; todos os perfis internos ativos e negação aos demais.

Integração PostgreSQL: constraints, grants por assinatura, RLS de tabelas e bucket, bloqueio de mutações diretas e autorização das RPCs. Mocks não comprovam permissões reais. Gerar PDF fictício e renderizar como imagens; testar nomes longos, acentos/emoji, período, horas, texto, marca, código e assinatura externa sem manipulação do arquivo. Fluxos por teclado, celular/computador e estados de erro/repetição.

Entregáveis locais: código, migração revisável, seed, exemplos fictícios, testes, `.env.example` sem valores, deployment.md com verificações/reversão e validation.md por CA. Executar testes relevantes/completos, TypeScript e build. Não marcar CA remoto como validado por testes mockados. Implementação local pode ser concluída com provider simulado e texto de certificado de demonstração, mas emissão/envio reais ficam bloqueados até configuração aprovada.

## Aprovação

- [x] Plano, P-001 a P-010 e tarefas locais aprovados pela responsável em 2026-11-03.
- [ ] Texto/signatário e configuração do provedor/remetente confirmados antes da homologação.
- [ ] Inspeção/operações remotas autorizadas especificamente.
- [ ] Publicação, jobs e envio de mensagens reais autorizados especificamente.
