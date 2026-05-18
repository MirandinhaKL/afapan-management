# WhatsApp Bucket Links - Sistema de Coleta de Baldes via Mensagens

## 📋 Visão Geral

Este sistema permite gerar links únicos para cada participante da AFAPAN para registrar a quantidade de baldes coletados em cada período de monitoramento via WhatsApp ou formulário web.

### Funcionalidades Principais

✅ **Links Únicos por Participante e Período** - Cada participante recebe um link exclusivo
✅ **Formulário Web Responsivo** - Funciona em desktop e mobile
✅ **Integração WhatsApp** - Gere mensagens prontas para enviar
✅ **Rastreamento de Submissões** - Saiba quem já registrou
✅ **Export em CSV** - Baixe dados em lote
✅ **Tokens com Expiração** - Links expiram após 30 dias (customizável)

---

## 🚀 Configuração Inicial

### 1. Executar Migração do Banco de Dados

Você precisa criar a tabela para armazenar os links:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Copie todo o conteúdo do arquivo `create-whatsapp-links-table.sql`
4. Cole no editor e clique em **Run**

Isso criará:
- Tabela `participante_bucket_links`
- Índices para performance
- Políticas RLS para segurança
- Triggers automáticos

### 2. Verificar URLs Base (Opcional)

Se estiver usando um domínio customizado, atualize a variável de ambiente:

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://seu-dominio.com
```

Caso contrário, o sistema usa automaticamente `window.location.origin`.

---

## 📱 Como Usar

### Para Administradores (Dashboard)

#### Passo 1: Acessar Detalhes da Turma

1. Vá para a seção **Compostagem** → **Turmas**
2. Clique em **Ver** na turma desejada
3. Scroll down até **Datas de Monitoramento**

#### Passo 2: Gerar Links para um Período

1. Na seção de períodos, clique no botão **Links** (verde) do período
2. Uma janela abrirá com opções para gerar os links
3. Clique em **Gerar Links Para Todos os Participantes**
4. Aguarde o processamento

#### Passo 3: Enviar via WhatsApp

Você tem 3 opções:

**Opção A: Enviar Individual**
- Na aba "Links Gerados", clique no ícone de WhatsApp (verde) ao lado do participante
- Uma aba nova abrirá com a mensagem pré-preenchida
- Selecione o contato e envie

**Opção B: Copiar Mensagem**
- Clique no ícone de cópia (copy) para copiar a mensagem
- Cole em seu cliente WhatsApp preferido
- Envie manualmente para cada participante

**Opção C: Baixar CSV**
- Clique em **Baixar CSV** para exportar todos os links
- Use ferramentas de automação WhatsApp para envio em lote

---

## 🔗 Estrutura das URLs

Cada link tem a seguinte estrutura:

```
https://seu-dominio.com/bucket/{TOKEN}
```

Exemplo:
```
https://afapan.example.com/bucket/aBcDeFgHiJkLmNoPqRsTuVwXyZ012345
```

### Características do Token

- **Tamanho**: 32 caracteres aleatórios
- **Unicidade**: Único por participante + período
- **Segurança**: Gerado aleatoriamente, impossível prever
- **Expiração**: Padrão 30 dias (customizável)

---

## 📋 Página do Formulário

Quando um participante clica no link, ele vê:

### Informações Exibidas

```
┌─────────────────────────────────────────┐
│  AFAPAN - Registro de Baldes            │
│  Período: Jan-Mar                       │
├─────────────────────────────────────────┤
│                                         │
│  Olá, João da Silva!                   │
│  Bem-vindo ao sistema...                │
│                                         │
│  Quantos baldes foram coletados         │
│  neste período?                         │
│                                         │
│  [Digite o número]                     │
│                                         │
│  [ Enviar ]                            │
│                                         │
│  Seus dados serão salvos com segurança │
│                                         │
└─────────────────────────────────────────┘
```

### Comportamento

1. **Carregamento** - Sistema verifica se o token é válido
2. **Validação** - Após clicar "Enviar", valida o número
3. **Salvamento** - Registra automaticamente no banco de dados
4. **Confirmação** - Exibe mensagem de sucesso

---

## 🛢️ Banco de Dados

### Tabela: `participante_bucket_links`

```sql
id                    UUID          -- ID único do link
participante_id       UUID (FK)     -- Referência ao participante
turma_bucket_period_id UUID (FK)    -- Referência ao período
token                 TEXT UNIQUE   -- Token do link (único)
expires_at            TIMESTAMP     -- Data de expiração
is_active             BOOLEAN       -- Link ativo? (pode ser revogado)
submitted             BOOLEAN       -- Já foi submetido?
submitted_at          TIMESTAMP     -- Data da submissão
criado_em             TIMESTAMP     -- Data de criação
atualizado_em         TIMESTAMP     -- Última atualização
```

### Índices

- `idx_participante_bucket_links_token` - Busca rápida por token
- `idx_participante_bucket_links_participante_period` - Busca por participante + período

---

## 🔐 Segurança

### Autenticação
- **Formulário**: Sem autenticação requerida (público)
- **Geração de links**: Apenas usuários logados podem gerar
- **Validação**: Token é verificado a cada submissão

### RLS (Row Level Security)

```sql
-- Qualquer um pode visualizar/atualizar via token válido
CREATE POLICY "Public can view own link by token" ON participante_bucket_links
  FOR SELECT USING (true);

-- Usuários autenticados podem gerenciar todos os links
CREATE POLICY "Authenticated users can insert links" ON participante_bucket_links
  FOR INSERT TO authenticated WITH CHECK (true);
```

### Validações

1. **Token Válido** - Deve existir e estar ativo
2. **Link Não Expirado** - Data de expiração não foi atingida
3. **Número Válido** - Apenas números inteiros ≥ 0 são aceitos

---

## 📊 Relatórios e Análises

### Rastreamento de Submissões

No banco de dados, você pode consultar:

```sql
-- Ver quantos links foram criados e submetidos
SELECT 
  COUNT(*) as total_links,
  SUM(CASE WHEN submitted THEN 1 ELSE 0 END) as submitted,
  SUM(CASE WHEN submitted = false THEN 1 ELSE 0 END) as pending
FROM participante_bucket_links
WHERE turma_bucket_period_id = 'PERIODO_ID';

-- Ver quem não registrou ainda
SELECT p.nome, p.telefone
FROM participantes p
WHERE p.id IN (
  SELECT participante_id FROM participante_bucket_links
  WHERE turma_bucket_period_id = 'PERIODO_ID' AND submitted = false
);
```

---

## 🛠️ Customizações

### Alterar Tempo de Expiração

No arquivo `lib/supabase-queries.ts`, função `generateBucketLinksForPeriod`:

```typescript
// Altere o parâmetro (padrão: 30)
const linksGerados = await generateBucketLinksForPeriod(
  turmaId,
  turmaBucketPeriodId,
  60  // 60 dias em vez de 30
)
```

### Customizar Mensagem WhatsApp

No arquivo `lib/whatsapp-utils.ts`, função `generateWhatsAppMessage`:

```typescript
export function generateWhatsAppMessage(
  token: string,
  participanteName: string,
  periodLabel: string,
  baseUrl?: string
): string {
  // Customize a mensagem aqui
  const message = `Sua mensagem customizada...`
  return message
}
```

### Customizar Cores/Layout do Formulário

No arquivo `app/bucket/[token]/page.tsx`:

```tsx
// Altere as classes Tailwind conforme desejar
<div className="bg-gradient-to-b from-green-50 to-white">
  {/* Customize cores */}
</div>
```

---

## 📞 Troubleshooting

### Link não funciona
- ✅ Verifique se a tabela foi criada (rode o SQL)
- ✅ Confirme que o token está correto
- ✅ Verifique a data de expiração
- ✅ Verifique o `NEXT_PUBLIC_BASE_URL` se usar domínio customizado

### Mensagem WhatsApp não abre
- ✅ Verifique a URL do formulário
- ✅ Confirme que tem WhatsApp instalado
- ✅ Tente abrir em navegador diferente

### Dados não salvam
- ✅ Verifique as políticas RLS
- ✅ Confirme que `participantes` e `turma_bucket_periods` existem
- ✅ Verifique erros no console do navegador

---

## 📝 Exemplos de Uso

### Exemplo 1: Gerar Links Mensalmente

```typescript
// Cron job mensal
async function monthlyLinkGeneration() {
  const turma = await fetchTurmaBucketPeriods('turma-id')
  const currentMonth = new Date().getMonth()
  
  // Gerar links para o período atual
  await generateBucketLinksForPeriod(
    'turma-id',
    turma[0].id
  )
}
```

### Exemplo 2: Enviar Lembretes

```typescript
// Buscar links ainda não submetidos
const unsubmitted = await supabase
  .from('participante_bucket_links')
  .select('*')
  .eq('submitted', false)
  .lt('expires_at', new Date().toISOString())
```

### Exemplo 3: Revogar Todos os Links de um Período

```typescript
// Desabilitar todos os links de um período
const { error } = await supabase
  .from('participante_bucket_links')
  .update({ is_active: false })
  .eq('turma_bucket_period_id', 'period-id')
```

---

## 📚 Arquivos Relacionados

```
├── create-whatsapp-links-table.sql          # Migração do banco
├── lib/
│   ├── supabase-queries.ts                  # Queries Supabase
│   └── whatsapp-utils.ts                    # Utilitários WhatsApp
├── app/bucket/[token]/page.tsx              # Página do formulário
├── components/dialogs/
│   └── generate-whatsapp-links-dialog.tsx   # Dialog para gerar links
└── components/dialogs/
    └── turma-detail-dialog.tsx              # Dialog de turma (com botão)
```

---

## ✨ Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                            │
│  ┌─────────────────────────────────────────────────────────┐
│  │ 1. Seleciona Turma e Período                           │
│  │ 2. Clica em "Gerar Links"                             │
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ SISTEMA GERA LINKS ÚNICOS                             │
│  │ Para cada participante:                               │
│  │ - Cria token aleatório                               │
│  │ - Salva no banco de dados                             │
│  │ - Gera URL com token                                  │
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ ADMIN ENVIA VIA WHATSAPP                              │
│  │ Opções:                                               │
│  │ - Copiar mensagem                                     │
│  │ - Abrir WhatsApp Web                                  │
│  │ - Baixar CSV para automação                           │
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ PARTICIPANTE RECEBE MENSAGEM                          │
│  │ Clica no link no WhatsApp                             │
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ FORMULÁRIO WEB (app/bucket/[token])                  │
│  │ ┌────────────────────────────────────────────────────┐
│  │ │ Olá, João da Silva!                              │
│  │ │ Período: Jan-Mar                                │
│  │ │                                                  │
│  │ │ Quantos baldes foram coletados?                │
│  │ │ [Digite o número]  [Enviar]                    │
│  │ └────────────────────────────────────────────────────┘
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ SALVAMENTO NO BANCO DE DADOS                          │
│  │ - Registra "baldes" com a quantidade                 │
│  │ - Marca link como "submitted"                        │
│  │ - Registra data e hora da submissão                 │
│  └─────────────────────────────────────────────────────────┘
│           │
│           ▼
│  ┌─────────────────────────────────────────────────────────┐
│  │ CONFIRMAÇÃO PARA PARTICIPANTE                         │
│  │ "Obrigado! Registramos X baldes."                    │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Próximos Passos (Opcionais)

- [ ] Configurar notificações por email
- [ ] Adicionar reminder automáticos
- [ ] Dashboard de analytics
- [ ] Exportar relatórios em PDF
- [ ] Integração com serviço de SMS

---

**Desenvolvido para AFAPAN - Gestão de Compostagem**
