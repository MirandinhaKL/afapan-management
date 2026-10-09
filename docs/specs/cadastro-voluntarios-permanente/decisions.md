# Decisões — Cadastro permanente de voluntários

Data: 2026-10-09.

- **DEC-001 — Diretriz da responsável:** voluntários podem se cadastrar em qualquer período; não é necessário controle de campanha, prazo ou estado ativa/inativa.
- **DEC-002 — Diretriz da responsável:** a equipe precisa acessar e compartilhar o link do formulário de novos voluntários.
- **DEC-003 — Aprovada na especificação:** preservar a rota `/voluntariado/cadastro` e disponibilizar endereço completo, abertura e cópia na gestão interna.
- **DEC-004 — Aprovada na especificação:** preservar dados e histórico, remover a operação de campanhas do fluxo atual e impedir alterações automáticas de situação por expiração.
- **DEC-005 — Aprovada na especificação:** manter situações atuais e uso manual de `Sem confirmação`, validação interna, consentimentos e todas as validações do cadastro.
- **DEC-006 — Aprovada na especificação:** adequar a declaração de interesse de “continuar participando” para “participar”, com nova versão para os novos aceites.
- **DEC-007 — Limite de autorização:** a resposta “Certo” autoriza preparar esta especificação; não foi tratada como aprovação de um documento ainda não apresentado, plano técnico, implementação ou migração remota.
- **DEC-008 — Aprovação registrada:** a mensagem “Aprovado” em 2026-10-09 aprova a especificação apresentada. Autoriza preparar o plano técnico e as tarefas, sem aprovar previamente a implementação ou operações remotas.
- **DEC-009 — Plano técnico aprovado:** armazenar os textos e versões do formulário em configuração própria, sem campanha oculta, prazo ou chave de ativação.
- **DEC-010 — Plano técnico aprovado:** criar RPC pública própria do cadastro permanente, preservar dados históricos e separar a limpeza de tentativas da expiração de campanhas.
- **DEC-011 — Plano técnico aprovado:** migração permanente não altera o catálogo nem executa 005. Compatibilidade do catálogo no ambiente alvo deve ser verificada antes da publicação.

- **DEC-012 — Aprovação:** a mensagem “aprovado” de 2026-10-09 autoriza o plano e as tarefas locais T-001 a T-006; não autoriza migração remota ou publicação.
- **DEC-013 — Implementação:** textos são preservados exatamente como armazenados; versões desatualizadas bloqueiam a gravação e exigem atualização com novo aceite, preservando os demais campos.
- **DEC-014 — Evidência:** 131 testes, TypeScript e build aprovados. Validação PostgreSQL, permissões reais, jobs, preservação remota e publicação permanecem pendentes conforme validation.md.
