import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
  })
}

function timingSafeEqual(a: string, b: string) {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)

  if (aBytes.length !== bBytes.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i]
  }

  return result === 0
}

async function createSignature(appSecret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  )
  const hash = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return `sha256=${hash}`
}

async function verifyMetaSignature(request: Request, body: string) {
  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET")

  if (!appSecret) {
    return true
  }

  const receivedSignature = request.headers.get("x-hub-signature-256")

  if (!receivedSignature) {
    return false
  }

  const expectedSignature = await createSignature(appSecret, body)
  return timingSafeEqual(receivedSignature, expectedSignature)
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function storeWebhookEvent(payload: unknown) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.log("Webhook payload:", JSON.stringify(payload))
    return
  }

  const { error } = await supabase
    .from("whatsapp_webhook_events")
    .insert([{ payload }])

  if (error) {
    console.error("Erro ao gravar webhook:", error)
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method === "GET") {
    const url = new URL(request.url)
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")
    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN")

    if (mode === "subscribe" && token && token === verifyToken && challenge) {
      return textResponse(challenge)
    }

    return jsonResponse({ error: "Webhook verification failed" }, 403)
  }

  if (request.method === "POST") {
    const rawBody = await request.text()
    const isValidSignature = await verifyMetaSignature(request, rawBody)

    if (!isValidSignature) {
      return jsonResponse({ error: "Invalid webhook signature" }, 401)
    }

    let payload: unknown

    try {
      payload = JSON.parse(rawBody)
    } catch (_error) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400)
    }

    await storeWebhookEvent(payload)

    return jsonResponse({ received: true })
  }

  return jsonResponse({ error: "Method not allowed" }, 405)
})
