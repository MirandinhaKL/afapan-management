# SDD no projeto AFAPAN

SDD (Spec-Driven Development) significa desenvolver a partir de uma especificação revisada, em vez de começar diretamente pelo código.

## Fluxo padrão

### 1. Descoberta

Entender o problema, os usuários afetados, as regras de negócio, as exceções e o resultado esperado. Dúvidas que alterem materialmente a solução devem ser resolvidas nesta fase.

### 2. Especificação

Copiar `_template/specification.md` para uma nova pasta da iniciativa. A especificação define o comportamento observável e os critérios de aceite, sem antecipar detalhes desnecessários de implementação.

Status possíveis:

- `Rascunho`
- `Em revisão`
- `Aprovada`
- `Substituída`

### 3. Plano técnico

Após a aprovação da especificação, preencher `technical-plan.md` com arquitetura, arquivos afetados, persistência, segurança, testes, implantação e reversão.

### 4. Tarefas

Dividir o plano em unidades verificáveis no `tasks.md`. Cada tarefa deve referenciar requisitos e critérios de aceite.

### 5. Implementação

Implementar somente o escopo aprovado. Mudanças de regra descobertas durante a implementação retornam para a especificação e devem ser registradas em `decisions.md`.

### 6. Validação

Executar testes e conferir cada critério de aceite. O encerramento deve registrar evidências, limitações e qualquer passo remoto ainda necessário.

## Estrutura

```text
docs/specs/
  README.md
  _template/
    specification.md
    technical-plan.md
    tasks.md
    decisions.md
  exemplo-de-funcionalidade/
    specification.md
    technical-plan.md
    tasks.md
    decisions.md
```

## Como iniciar uma iniciativa comigo

Use uma solicitação como:

> Vamos usar SDD para [nome da funcionalidade]. Não implemente ainda. Analise o contexto e prepare a especificação, incluindo regras, exceções, critérios de aceite e itens fora do escopo.

Depois da revisão:

> Aprovo a especificação. Prepare o plano técnico e as tarefas, mas ainda não implemente.

E, por fim:

> Aprovo o plano. Implemente as tarefas e valide todos os critérios de aceite.

