# Coleta por WhatsApp e Formulário Interno

Esta implementação usa uma abordagem rápida sem WhatsApp Business API: o sistema
abre mensagens individuais de WhatsApp com um link único para o formulário interno
da AFAPAN. Quando o participante informa a quantidade de baldes, o sistema salva
no Supabase.

## Variáveis de ambiente

Configure no `.env.local` e também no ambiente da Vercel:

```env
NEXT_PUBLIC_BASE_URL=https://afapan-management.vercel.app
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` precisa estar configurada no ambiente da Vercel para que
`/api/bucket/submit` consiga salvar os dados sem erro de RLS.

## Fluxo

1. Abra os detalhes de uma turma de compostagem.
2. Em um período, clique em `Mensagens`.
3. Clique em `Gerar Links Únicos`.
4. Clique em `WhatsApp` para cada participante.
5. O WhatsApp abre com a mensagem pronta e o link único do participante.
6. O participante preenche o formulário interno `/bucket/[token]`.
7. A rota `/api/bucket/submit` grava o registro no Supabase.

## Observações

- Os telefones dos participantes devem estar com DDD; o sistema adiciona `55` quando necessário.
- Cada link é individual e fica associado ao participante e ao período.
- Depois de usado, o link é marcado como submetido.

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
