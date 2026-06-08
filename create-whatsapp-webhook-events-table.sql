-- Tabela para auditar eventos recebidos pelo webhook da WhatsApp Cloud API.
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_criado_em
  ON whatsapp_webhook_events (criado_em DESC);

ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view whatsapp webhook events"
  ON whatsapp_webhook_events;

CREATE POLICY "Authenticated users can view whatsapp webhook events"
  ON whatsapp_webhook_events
  FOR SELECT TO authenticated
  USING (true);
