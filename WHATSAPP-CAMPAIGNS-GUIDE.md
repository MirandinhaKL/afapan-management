# Campanhas de Coleta por WhatsApp

Esta implementação envia uma campanha para todos os participantes de uma turma usando a WhatsApp Cloud API.

## Variáveis de ambiente

Configure no `.env.local` e também no ambiente da Vercel:

```env
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANGUAGE=pt_BR
NEXT_PUBLIC_BASE_URL=https://afapan-management.vercel.app
```

Sem as variáveis `WHATSAPP_*`, a campanha prepara os links, mas não envia mensagens reais.

## Template do WhatsApp

Crie um template aprovado na Meta com 3 variáveis no corpo:

```text
Olá {{1}}!

Está na hora de informar a quantidade de baldes coletados no período {{2}}.

Acesse o link abaixo e preencha apenas o número de baldes:
{{3}}

Obrigado por contribuir com a AFAPAN.
```

Mapeamento usado pelo sistema:

- `{{1}}`: nome do participante
- `{{2}}`: período de monitoramento
- `{{3}}`: link único do participante

## Fluxo

1. Abra os detalhes de uma turma de compostagem.
2. Em um período, clique em `Campanha`.
3. Clique em `Enviar Campanha Para Todos`.
4. O sistema gera ou reutiliza um link por participante.
5. Se o WhatsApp estiver configurado, envia a mensagem para cada telefone.
6. O participante abre o link e informa a quantidade.
7. A rota `/api/bucket/submit` grava o registro com `SUPABASE_SERVICE_ROLE_KEY`.

## Observações

- O número de origem pode ser trocado depois alterando `WHATSAPP_PHONE_NUMBER_ID`.
- Os telefones dos participantes devem estar com DDD; o sistema adiciona `55` quando necessário.
- A página pública de preenchimento não insere mais diretamente no Supabase.

## Webhook pela Supabase Edge Function

Foi criada a Edge Function `whatsapp-webhook` para receber eventos da Meta.

URL após deploy:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook
```

Execute no SQL Editor:

```text
create-whatsapp-webhook-events-table.sql
```

Configure os secrets da função:

```bash
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN=um-texto-secreto-qualquer
supabase secrets set WHATSAPP_APP_SECRET=app-secret-da-meta
```

`WHATSAPP_APP_SECRET` é opcional, mas recomendado. Se não for configurado, a função aceita o `POST` sem validar a assinatura `x-hub-signature-256`.

Deploy:

```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

No painel da Meta:

1. Acesse `WhatsApp > Configuração`.
2. Em `URL de callback`, informe a URL da função.
3. Em `Token de verificação`, informe o mesmo valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Clique em verificar e salvar.
5. Em campos do webhook, assine `messages`.

Os eventos recebidos serão gravados em `whatsapp_webhook_events`.
