# Regras de desenvolvimento do projeto AFAPAN

## Desenvolvimento orientado por especificações (SDD)

Funcionalidades novas e alterações relevantes de comportamento devem seguir este fluxo:

1. Criar e revisar `specification.md`.
2. Obter aprovação da especificação antes do planejamento técnico.
3. Criar e revisar `technical-plan.md` e `tasks.md`.
4. Obter aprovação do plano antes de alterar o código.
5. Implementar as tarefas em ordem, mantendo os critérios de aceite rastreáveis.
6. Criar ou atualizar testes unitários para todo comportamento novo ou corrigido.
7. Validar a implementação contra todos os critérios de aceite antes de concluir.

O usuário pode autorizar explicitamente mais de uma fase na mesma solicitação. Sem essa autorização, respeitar os pontos de aprovação acima.

## Localização dos documentos

Cada iniciativa deve ficar em:

```text
docs/specs/<nome-da-iniciativa>/
  specification.md
  technical-plan.md
  tasks.md
  decisions.md
```

Use nomes de pasta em letras minúsculas, sem acentos e separados por hífen.

## Rastreabilidade

- Requisitos funcionais usam identificadores `RF-001`, `RF-002`, etc.
- Requisitos não funcionais usam `RNF-001`, `RNF-002`, etc.
- Critérios de aceite usam `CA-001`, `CA-002`, etc.
- Tarefas devem indicar quais requisitos e critérios atendem.
- Testes devem cobrir os critérios aplicáveis e usar descrições de negócio compreensíveis.

## Escopo proporcional

- Funcionalidades, mudanças de banco, autenticação, autorização, RLS, integrações e alterações potencialmente destrutivas exigem o fluxo SDD completo.
- Correções pequenas, ajustes de texto e alterações exclusivamente visuais podem usar uma especificação resumida, mas ainda devem registrar objetivo, comportamento esperado, riscos e validação.
- Se uma correção revelar mudança de regra de negócio ou impacto arquitetural, migrar para o fluxo completo.

## Banco de dados e segurança

- Toda alteração no Supabase deve registrar impacto, política RLS, migração, compatibilidade e estratégia de reversão no plano técnico.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ou qualquer segredo em código cliente, logs ou variáveis `NEXT_PUBLIC_*`.
- Consultas públicas devem ocorrer por políticas RLS explicitamente justificadas ou por APIs de servidor com escopo mínimo.
- Antes de orientar a execução de SQL remoto, explicar finalidade, efeitos, riscos e forma de verificação.

## Qualidade e validação

- Preservar os testes existentes.
- Criar testes unitários para funcionalidades novas e correções de bugs.
- Executar testes relevantes e a verificação do TypeScript após alterações de código.
- Não considerar uma tarefa concluída enquanto houver critério de aceite não validado.
- Registrar limitações ou validações que dependam do ambiente remoto.

## Colaboração e comandos

- Antes de executar ou solicitar autorização para um comando, explicar por que ele é necessário e se altera arquivos, dependências, banco ou serviços externos.
- Comandos de inspeção devem ser apresentados como somente leitura.
- Não executar alterações destrutivas ou operações remotas sem autorização explícita.
- Preservar mudanças existentes do usuário e evitar alterações fora do escopo aprovado.

