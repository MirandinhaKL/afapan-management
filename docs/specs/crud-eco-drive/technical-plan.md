# Plano técnico — CRUD de campanhas Eco Drive

- **Status:** Aprovado
- **Especificação:** `./editado-especificacao.md`
- **Data de aprovação:** 2026-09-22

## 1. Resumo da solução

O CRUD será implementado sobre o módulo existente, com formulário compartilhado entre criação e edição, detalhe em modal, arquivamento lógico, restauração, filtros paginados e exportação PDF/CSV. Criação e atualização serão transacionais por funções RPC do PostgreSQL. Auditoria e identidade serão garantidas no banco por `auth.uid()` e gatilhos.

## 2. Impacto no sistema atual

- **Frontend:** listagem, filtros, paginação, ações, detalhes e formulário.
- **Persistência:** consultas paginadas e mutações por RPC.
- **Banco:** colunas de arquivamento, local opcional, auditoria, gatilhos e funções.
- **RLS:** leitura para `authenticated`; mutações diretas removidas após a implantação compatível das RPCs.
- **Relatórios:** PDF e CSV usando as regras de cálculo compartilhadas.

## 3. Decisões técnicas

- Página com 10 campanhas, ordenadas por data decrescente.
- Detalhes apresentados em modal responsivo.
- Concorrência otimista usando `atualizado_em`; edição obsoleta retorna conflito.
- Campanha e sete materiais são gravados na mesma transação.
- Quilogramas aceitam no máximo uma casa decimal; unidades e voluntários são inteiros.
- Arquivamento é lógico, reversível e excluído dos indicadores padrão.
- Nenhuma chave de serviço será usada no navegador.

## 4. Migração, compatibilidade e reversão

1. Aplicar a migração aditiva, preservando temporariamente as políticas atuais de mutação.
2. Publicar a aplicação que usa RPCs.
3. Aplicar o endurecimento RLS, removendo mutações diretas.

A reversão da aplicação permanece compatível antes da etapa 3. Depois dela, a reversão exige restaurar temporariamente as políticas antigas. Arquivamento não apaga dados.

## 5. Segurança

- RPCs `SECURITY DEFINER`, `search_path` fixo, validação explícita de sessão e permissões apenas para `authenticated`.
- Auditoria não pode ser inserida, alterada ou removida pelo cliente.
- Usuários anônimos não possuem políticas de leitura ou escrita.

## 6. Testes e validação

- Testes unitários de validação, cálculo, filtros, formulários e ações.
- Testes das descrições de negócio vinculadas aos critérios de aceite.
- Execução da suíte relevante e `tsc --noEmit`.
- SQL será entregue para execução manual no Supabase, com verificação e reversão documentadas.

## 7. Riscos

- **Implantação fora de ordem:** mitigada pela estratégia em duas etapas.
- **Edição concorrente:** mitigada pelo token `atualizado_em`.
- **Divergência de indicadores/relatórios:** mitigada por funções de domínio compartilhadas.
- **Volume crescente:** mitigado por paginação e filtros no servidor.
