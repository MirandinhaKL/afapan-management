# Implementação local — primeiro recorte

Data: 2026-11-03. “Pode seguir” autoriza plano e escolhas P-001 a P-010 para implementação local. Operações remotas, publicação e e-mails reais seguem separados.

## Implementado nesta etapa

- Navegação interna Conecta AFAPAN com catálogo e fila. Catálogo inicial de sete projetos e oito modalidades; Visitas técnicas usa horas livres. Cadastro, edição versionada e retirada de publicação via RPC, com histórico de autoria.
- Rota pública de atividades: CPF/nascimento, dados acadêmicos e de contato, modalidade, período, relato, checklist ou horas livres e comprovante obrigatório. A API valida formato declarado, tamanho e assinatura inicial do arquivo, calcula SHA-256 em streaming e finaliza a solicitação em transação. Não equivale a inspeção antivírus ou análise estrutural integral de PDF/vídeo.
- A fila interna busca por nome/CPF, pagina, mostra detalhe e histórico; permite conferir tarefas/horas, baixar evidência por URL curta, aprovar e recusar com justificativa. A recusa fica registrada e cria evento pendente na outbox; nenhum worker está ativo.
- SQL local aditivo 001–007, sem alteração de tabelas de outros módulos. Todas as tabelas novas têm RLS habilitada e acesso direto revogado. As RPCs autenticadas conferem auth.uid() e perfil ativo. A reserva de certificado é exclusiva do servidor e confere o perfil do usuário identificado pelo JWT.
- Devolução e renovação geram link de correção de 48 horas para o e-mail cadastrado. O estudante atualiza relato, tarefas ou minutos e anexa comprovantes. A mesma solicitação volta à fila em nova revisão, com dados pessoais, revisões, decisões e arquivos anteriores preservados. A renovação expira o link anterior e cancela seu evento pendente sem apagar registros.
- A tela de análise permite gerar e baixar o PDF original da solicitação aprovada. A emissão fixa os dados, os minutos reconhecidos, o signatário e o código aleatório de 128 bits. O arquivo original é armazenado em caminho privado sem sobrescrita, com hash SHA-256. A invalidação exige motivo e registra autor e data. Uma nova emissão vincula a anterior e recebe novo código.

## Evidência local e limites

- T-007 em 2026-11-10. Suíte completa com 198 testes, TypeScript e compilação aprovados. O teste SQL aplica 012 em memória e cobre autoria, integridade referencial, recusa de emissão invalidada, confirmação idempotente, fila única e preservação do PDF na invalidação. Testes de rota e tela simulam Storage e cobrem PDF ilegível, confirmação explícita, hash dos bytes e download disponível após conferência.
- Para homologar T-007, aplicar 012 após 011 no Supabase de teste, com o bucket conecta-documents privado. Baixar o original, assinar externamente e anexar o resultado de até 10 MiB. Conferir situação Assinado e conferido e baixar a mesma versão assinada. A fila fica pendente até T-008. Para reverter a implantação, usar a versão anterior da aplicação e preservar registros e objetos.

- Suíte completa após a emissão: 31 arquivos e 182 testes aprovados. TypeScript sem emissão aprovado.

- `test-catalog-sql.cjs` executa os sete scripts em PostgreSQL embarcado, com papéis e auth.uid simulados. Cobre catálogo, acesso, submissão, aprovação parcial e correção. Na emissão, verifica configuração obrigatória, autorização, reserva idempotente, conflito de hash, invalidação com motivo, preservação do caminho e vínculo com a emissão substituta.
- O modelo fictício foi renderizado e inspecionado em A4 horizontal. O teste cobre acentos em português e geração repetida com os mesmos dados. A fonte atual bloqueia caracteres fora da codificação suportada para evitar emitir um nome incorreto. A emissão inicial exige `CONECTA_CERTIFICATE_SIGNER`, `CONECTA_CERTIFICATE_SIGNER_TITLE` e `CONECTA_CERTIFICATE_CITY` no servidor.
- Para repetir: `node docs/specs/horas-complementares-certificados/test-catalog-sql.cjs <caminho-absoluto-do-modulo-pglite>`. A dependência de prova foi instalada em pasta isolada, não no package.json do projeto.
- O SQL foi executado apenas em memória. Bucket privado, links de upload, limite de duração da hospedagem, IP confiável e comportamento efetivo das políticas de profiles/Storage ainda precisam de homologação. Nenhum arquivo foi enviado a um bucket real.
- Atualmente a verificação lê o arquivo em streaming no servidor para hash e assinatura de formato; a transferência do usuário é direta ao Storage. A duração com vários vídeos deve ser medida antes de autorizar produção. Sessões expiradas devem impedir novas operações sem eliminar dados ou arquivos (DEC-026).
- A tela administrativa usa as RPCs autenticadas do cliente existente; o endpoint de evidência verifica o JWT no servidor antes de assinar a URL. Nenhuma service_role é exposta ao navegador.

## Não concluído

- Entrega da orientação por e-mail e verificação do fluxo de correção no ambiente de homologação (T-006, T-008).
- Homologação do recebimento e conferência do PDF assinado (T-007). Implementação local com migração 012, validação de estrutura, hash, confirmação da equipe, download restrito e registro transacional na fila. Validar com assinatura externa e Storage real após aplicação manual em ambiente de teste. Consulta pública permanece em T-009.
- Homologação do worker de e-mail (T-008). A migração 013 e a rota interna simulam certificado, correção e recusa, com histórico separado, retentativas e conferência de resultado incerto. A execução no ambiente de teste segue [013-validation.md](013-validation.md). Integração Gmail, agendamento e aceitação real dependem de homologação.
- Consulta pública por código e segunda via por CPF/nascimento (T-009).
- Inspeção visual completa do módulo/PDF, documentação de implantação, verificação de preservação de dados e arquivos e verificação remota (T-001, T-004, T-010 a T-013).

Os critérios que dependem dessas etapas permanecem em aberto. Não aplicar os scripts em produção como se o fluxo completo estivesse pronto.
