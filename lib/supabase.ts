import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// O Supabase usa LockManager no browser para coordenar sessões entre abas.
// Em modo de desenvolvimento (React Strict Mode) isso pode gerar avisos como:
// "Lock broken by another request with the 'steal' option".
// Isso não impede o login, mas pode ser removido desativando Strict Mode no Next.js.

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Ajuste o timeout para reduzir ruídos em dev; mantenha em 5000 (padrão) para produção.
    lockAcquireTimeout: 5000,
  },
})