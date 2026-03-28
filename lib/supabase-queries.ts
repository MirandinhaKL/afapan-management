import { supabase } from "./supabase"
import type { User, Participante as MockParticipante, RegistroBalde, Turma, TurmaCompostagem, ParticipanteTurma } from "./mock-data"

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

// Queries para Compostagem
export async function fetchParticipantesWithBaldes(): Promise<MockParticipante[]> {
  try {
    const { data: participantes, error: errorParticipantes } = await supabase
      .from('participantes')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (errorParticipantes) throw errorParticipantes

    const { data: baldes, error: errorBaldes } = await supabase
      .from('baldes')
      .select('*')
      .order('trimestre')

    if (errorBaldes) throw errorBaldes

    const baldesPorParticipante = baldes?.reduce((acc, balde) => {
      if (!acc[balde.participante_id]) {
        acc[balde.participante_id] = []
      }
      acc[balde.participante_id].push({
        trimestre: balde.trimestre,
        quantidade: balde.quantidade,
        dataRegistro: balde.data_registro
      })
      return acc
    }, {} as Record<string, RegistroBalde[]>)

    // Combinar participantes com baldes
    const participantesComBaldes: MockParticipante[] = participantes?.map(p => ({
      id: p.id,
      nome: p.nome,
      telefone: p.telefone || '',
      email: p.email,
      turma: p.turma,
      baldes: baldesPorParticipante?.[p.id] || [],
      ativo: p.ativo
    })) || []

    return participantesComBaldes
  } catch (error) {
    console.error('Erro ao buscar participantes com baldes:', error)
    throw error
  }
}

export async function fetchTurmas(): Promise<Turma[]> {
  try {
    // Buscar turmas distintas dos participantes
    const { data: turmasData, error } = await supabase
      .from('participantes')
      .select('turma')
      .eq('ativo', true)

    if (error) throw error

    const turmasUnicas = [...new Set(turmasData?.map(p => p.turma) || [])]

    // Para cada turma, contar participantes
    const turmas: Turma[] = await Promise.all(
      turmasUnicas.map(async (turma, index) => {
        const { count } = await supabase
          .from('participantes')
          .select('*', { count: 'exact', head: true })
          .eq('turma', turma)
          .eq('ativo', true)

        return {
          id: String(index + 1),
          nome: `Turma ${turma}`,
          semestre: turma,
          totalParticipantes: count || 0,
          ativa: true
        }
      })
    )

    return turmas.sort((a, b) => a.semestre.localeCompare(b.semestre))
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
    throw error
  }
}

export async function createOrUpdateBalde(participanteId: string, trimestre: string, quantidade: number): Promise<void> {
  try {
    // Verificar se já existe um registro para este participante e trimestre
    const { data: existing, error: selectError } = await supabase
      .from('baldes')
      .select('id')
      .eq('participante_id', participanteId)
      .eq('trimestre', trimestre)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
      throw selectError
    }

    if (existing) {
      // Atualizar
      const { error: updateError } = await supabase
        .from('baldes')
        .update({
          quantidade,
          data_registro: new Date().toISOString().split('T')[0]
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // Inserir
      const { error: insertError } = await supabase
        .from('baldes')
        .insert([{
          participante_id: participanteId,
          trimestre,
          quantidade,
          data_registro: new Date().toISOString().split('T')[0]
        }])

      if (insertError) throw insertError
    }
  } catch (error) {
    console.error('Erro ao salvar balde:', error)
    throw error
  }
}

// Queries para Turmas de Compostagem
export async function fetchTurmasCompostagem(): Promise<TurmaCompostagem[]> {
  try {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
    throw error
  }
}

export async function createTurmaCompostagem(turma: Omit<TurmaCompostagem, 'id' | 'criado_em'>): Promise<TurmaCompostagem> {
  try {
    const { data, error } = await supabase
      .from('turmas')
      .insert([turma])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar turma:', error)
    throw error
  }
}

export async function updateTurmaCompostagem(id: string, updates: Partial<TurmaCompostagem>): Promise<TurmaCompostagem> {
  try {
    const { data, error } = await supabase
      .from('turmas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar turma:', error)
    throw error
  }
}

export async function deleteTurmaCompostagem(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar turma:', error)
    throw error
  }
}

// Queries para Participantes-Turmas
export async function fetchParticipantesTurmas(): Promise<ParticipanteTurma[]> {
  try {
    const { data, error } = await supabase
      .from('participantes_turmas')
      .select('*')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar participantes-turmas:', error)
    throw error
  }
}

export async function addParticipanteToTurma(participanteId: string, turmaId: string): Promise<ParticipanteTurma> {
  try {
    const { data, error } = await supabase
      .from('participantes_turmas')
      .insert([{
        participante_id: participanteId,
        turma_id: turmaId
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao adicionar participante à turma:', error)
    throw error
  }
}

export async function removeParticipanteFromTurma(participanteId: string, turmaId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('participantes_turmas')
      .delete()
      .eq('participante_id', participanteId)
      .eq('turma_id', turmaId)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao remover participante da turma:', error)
    throw error
  }
}

export async function fetchTurmasWithParticipantes(): Promise<(TurmaCompostagem & { participantes: MockParticipante[] })[]> {
  try {
    // Buscar turmas
    const turmas = await fetchTurmasCompostagem()

    // Buscar relacionamentos
    const relacionamentos = await fetchParticipantesTurmas()

    // Buscar participantes
    const participantes = await fetchParticipantesWithBaldes()

    // Agrupar participantes por turma
    const participantesPorTurma = relacionamentos.reduce((acc, rel) => {
      if (!acc[rel.turma_id]) {
        acc[rel.turma_id] = []
      }
      const participante = participantes.find(p => p.id === rel.participante_id)
      if (participante) {
        acc[rel.turma_id].push(participante)
      }
      return acc
    }, {} as Record<string, MockParticipante[]>)

    // Combinar
    return turmas.map(turma => ({
      ...turma,
      participantes: participantesPorTurma[turma.id] || []
    }))
  } catch (error) {
    console.error('Erro ao buscar turmas com participantes:', error)
    throw error
  }
}