import { supabase } from "./supabase"
import type { User } from "./mock-data"

// Tipos para participantes e baldes
export interface Participante {
  id: string
  nome: string
  email: string
  telefone?: string
  turma: string
  ativo: boolean
  criado_em?: string
}

export interface Balde {
  id: string
  participante_id: string
  trimestre: string
  quantidade: number
  data_registro: string
  criado_em?: string
}

// Queries para usuários (profiles)
export async function fetchUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome')

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }

    console.log('Usuários retornados:', data?.length, data)
    return data || []
  } catch (error) {
    console.error('Erro em fetchUsers:', error)
    throw error
  }
}

export async function createUser(
  user: Omit<User, 'id' | 'criadoEm'>,
  password: string
): Promise<User> {
  try {
    // 1. Criar usuário em auth.users com email e senha
    // Usar emailRedirectTo vazio e skipAutoConfirm (evita envio de e-mail em desenvolvimento)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        emailRedirectTo: undefined,
        data: {
          nome: user.nome,
          role: user.role,
        },
      },
    })

    if (authError) {
      throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado no Auth')
    }

    // 2. O trigger SQL vai criar automaticamente o perfil em profiles
    // 3. Atualizar o perfil com os dados completos
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        nome: user.nome,
        role: user.role,
        ativo: user.ativo,
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      console.warn('Aviso ao atualizar perfil:', profileError.message)
    }

    return profileData || { id: authData.user.id, ...user }
  } catch (error) {
    throw error
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Queries para participantes
export async function fetchParticipantes(): Promise<Participante[]> {
  const { data, error } = await supabase
    .from('participantes')
    .select('*')
    .order('nome')

  if (error) throw error
  return data || []
}

export async function createParticipante(participante: Omit<Participante, 'id' | 'criado_em'>): Promise<Participante> {
  const { data, error } = await supabase
    .from('participantes')
    .insert([participante])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateParticipante(id: string, updates: Partial<Participante>): Promise<Participante> {
  const { data, error } = await supabase
    .from('participantes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteParticipante(id: string): Promise<void> {
  const { error } = await supabase
    .from('participantes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Queries para baldes
export async function fetchBaldes(): Promise<Balde[]> {
  const { data, error } = await supabase
    .from('baldes')
    .select(`
      *,
      participantes (
        nome,
        turma
      )
    `)
    .order('data_registro', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createBalde(balde: Omit<Balde, 'id' | 'criado_em'>): Promise<Balde> {
  const { data, error } = await supabase
    .from('baldes')
    .insert([balde])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBalde(id: string, updates: Partial<Balde>): Promise<Balde> {
  const { data, error } = await supabase
    .from('baldes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBalde(id: string): Promise<void> {
  const { error } = await supabase
    .from('baldes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Queries para dashboard/estatísticas
export async function fetchDashboardStats() {
  // Buscar total de participantes ativos
  const { data: participantes, error: errorParticipantes } = await supabase
    .from('participantes')
    .select('id', { count: 'exact' })
    .eq('ativo', true)

  if (errorParticipantes) throw errorParticipantes

  // Buscar total de baldes e soma das quantidades
  const { data: baldes, error: errorBaldes } = await supabase
    .from('baldes')
    .select('quantidade')

  if (errorBaldes) throw errorBaldes

  const totalParticipantes = participantes?.length || 0
  const totalBaldes = baldes?.reduce((sum, balde) => sum + (balde.quantidade || 0), 0) || 0

  return {
    totalParticipantes,
    totalBaldes,
    registrosBaldes: baldes?.length || 0
  }
}