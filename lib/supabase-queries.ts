import { supabase } from "./supabase"
import type { User, Participante as MockParticipante, RegistroBalde, Turma, TurmaCompostagem, ParticipanteTurma } from "./mock-data"

// Tipos para participantes e baldes
export interface Participante {
  id: string
  nome: string
  email: string
  telefone?: string
  turma: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  ativo: boolean
  criado_em?: string
  atualizado_em?: string
}

export interface Balde {
  id: string
  participante_id: string
  turma_id?: string
  turma_bucket_period_id?: string
  trimestre: string
  quantidade: number
  data_registro: string
  criado_em?: string
  atualizado_em?: string
}

export interface TurmaBucketPeriod {
  id: string
  turma_id: string
  periodo_numero: number
  periodo_label: string
  data_monitoramento: string
  criado_em?: string
  atualizado_em?: string
}

export interface ParticipanteBucketLink {
  id: string
  participante_id: string
  turma_bucket_period_id: string
  token: string
  expires_at?: string
  is_active: boolean
  submitted: boolean
  submitted_at?: string
  criado_em?: string
  atualizado_em?: string
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
export async function fetchParticipantesWithBaldes(turmaId?: string): Promise<MockParticipante[]> {
  try {
    let participanteIds: string[] | null = null
    let turmaNomeByParticipanteId: Record<string, string> = {}

    if (turmaId) {
      const { data: turma, error: errorTurma } = await supabase
        .from('turmas')
        .select('id, nome')
        .eq('id', turmaId)
        .single()

      if (errorTurma) throw errorTurma

      const { data: participantesTurma, error: errorParticipantesTurma } = await supabase
        .from('participantes_turmas')
        .select('participante_id')
        .eq('turma_id', turmaId)

      if (errorParticipantesTurma) throw errorParticipantesTurma

      participanteIds = (participantesTurma || []).map((rel) => rel.participante_id)
      turmaNomeByParticipanteId = participanteIds.reduce((acc, participanteId) => {
        acc[participanteId] = turma.nome
        return acc
      }, {} as Record<string, string>)

      if (participanteIds.length === 0) {
        return []
      }
    }

    let participantesQuery = supabase
      .from('participantes')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (participanteIds) {
      participantesQuery = participantesQuery.in('id', participanteIds)
    }

    const { data: participantes, error: errorParticipantes } = await participantesQuery

    if (errorParticipantes) throw errorParticipantes

    const idsParticipantes = (participantes || []).map((p) => p.id)

    if (idsParticipantes.length === 0) {
      return []
    }

    let baldesQuery = supabase
      .from('baldes')
      .select('*')
      .order('trimestre')

    baldesQuery = baldesQuery.in('participante_id', idsParticipantes)

    const { data: baldes, error: errorBaldes } = await baldesQuery

    if (errorBaldes) throw errorBaldes

    if (!turmaId) {
      // Buscar relacionamentos participante-turma
      const { data: participantesTurmas, error: errorParticipantesTurmas } = await supabase
        .from('participantes_turmas')
        .select('participante_id, turma_id')

      if (errorParticipantesTurmas) throw errorParticipantesTurmas

      // Buscar turmas para mapear IDs para nomes
      const { data: turmas, error: errorTurmas } = await supabase
        .from('turmas')
        .select('id, nome')

      if (errorTurmas) throw errorTurmas

      // Criar mapa turmaId -> nome
      const turmasMap = turmas?.reduce((acc, turma) => {
        acc[turma.id] = turma.nome
        return acc
      }, {} as Record<string, string>) || {}

      turmaNomeByParticipanteId = participantesTurmas?.reduce((acc, rel) => {
        acc[rel.participante_id] = turmasMap[rel.turma_id] || ''
        return acc
      }, {} as Record<string, string>) || {}
    }

    // Criar mapas para lookup rápido
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

    // Combinar participantes com baldes e turma
    const participantesComBaldes: MockParticipante[] = participantes?.map(p => ({
      id: p.id,
      nome: p.nome,
      telefone: p.telefone || '',
      email: p.email,
      turma: turmaNomeByParticipanteId[p.id] || p.turma || '',
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
    // Buscar turmas apenas da tabela turmas (fonte de verdade)
    const { data: turmasCompostagem, error: errCompostagem } = await supabase
      .from('turmas')
      .select('id, nome')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })

    if (errCompostagem) throw errCompostagem

    // Para cada turma, contar participantes
    const turmas: Turma[] = await Promise.all(
      (turmasCompostagem || []).map(async (turma) => {
        const { count } = await supabase
          .from('participantes_turmas')
          .select('*', { count: 'exact', head: true })
          .eq('turma_id', turma.id)

        return {
          id: turma.id,
          nome: turma.nome,
          semestre: turma.nome,
          totalParticipantes: count || 0,
          ativa: true
        }
      })
    )

    return turmas
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
    throw error
  }
}

export async function createOrUpdateBalde(participanteId: string, trimestre: string, quantidade: number): Promise<void> {
  try {
    const dataRegistro = new Date().toISOString().split('T')[0]
    
    // Verificar se já existe um registro para este participante e trimestre
    const { data: existing, error: selectError } = await supabase
      .from('baldes')
      .select('id')
      .eq('participante_id', participanteId)
      .eq('trimestre', trimestre)
      .maybeSingle()

    if (selectError) {
      throw selectError
    }

    if (existing) {
      // Atualizar
      const { error: updateError } = await supabase
        .from('baldes')
        .update({
          quantidade,
          data_registro: dataRegistro
        })
        .eq('id', existing.id)
        .select()

      if (updateError) throw updateError
    } else {
      // Inserir
      const { error: insertError } = await supabase
        .from('baldes')
        .insert({
          participante_id: participanteId,
          trimestre,
          quantidade,
          data_registro: dataRegistro
        })
        .select()

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
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
    throw error
  }
}

export async function createTurmaCompostagem(
  turma: Omit<TurmaCompostagem, 'id' | 'criado_em'>,
  datasMonitoramento?: string[]
): Promise<TurmaCompostagem> {
  try {
    const { data, error } = await supabase
      .from('turmas')
      .insert([turma])
      .select()
      .single()

    if (error) throw error
    
    // Gerar 4 períodos de monitoramento após criar a turma
    try {
      if (datasMonitoramento && datasMonitoramento.length === 4) {
        // Usar as datas fornecidas pelo usuário
        await createTurmaBucketPeriodsWithDates(data.id, datasMonitoramento)
      } else {
        // Usar o padrão automático (3 em 3 meses)
        await createTurmaBucketPeriods(data.id)
      }
    } catch (periodError) {
      console.error('Aviso: não foi possível gerar períodos de monitoramento:', periodError)
      // Não lançar erro aqui, pois a turma foi criada com sucesso
    }
    
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

// Queries para Períodos de Monitoramento de Baldes
export async function createTurmaBucketPeriods(turmaId: string, dataInicio?: Date): Promise<TurmaBucketPeriod[]> {
  try {
    // Forçar atualização do schema cache do Supabase
    try {
      await supabase.from('turma_bucket_periods').select('id').limit(0)
    } catch (_) {
      // Ignorar erros nesta query de teste
    }

    const startDate = dataInicio || new Date()
    const periods: Omit<TurmaBucketPeriod, 'id' | 'criado_em' | 'atualizado_em'>[] = []
    
    // Gerar 4 períodos em intervalos de 3 meses a partir da data de início
    // Primeiro monitoramento é 3 meses após a criação
    for (let i = 0; i < 4; i++) {
      const periodDate = new Date(startDate)
      // Adicionar 3, 6, 9 ou 12 meses dependendo do período
      periodDate.setMonth(periodDate.getMonth() + ((i + 1) * 3))
      
      // Ajustar para o mesmo dia do mês de início (preservando o dia)
      periodDate.setDate(startDate.getDate())
      
      // Determinar o label do período baseado no mês de monitoramento
      const month = periodDate.getMonth() // 0 = January, 11 = December
      let periodoLabel = 'Jan-Mar'
      if (month >= 3 && month <= 5) periodoLabel = 'Apr-Jun'
      else if (month >= 6 && month <= 8) periodoLabel = 'Jul-Sep'
      else if (month >= 9 && month <= 11) periodoLabel = 'Oct-Dec'
      
      periods.push({
        turma_id: turmaId,
        periodo_numero: i + 1,
        periodo_label: periodoLabel,
        data_monitoramento: periodDate.toISOString().split('T')[0]
      })
    }
    
    const { data, error } = await supabase
      .from('turma_bucket_periods')
      .insert(periods)
      .select()
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao criar períodos de baldes:', error)
    throw error
  }
}

export async function fetchTurmaBucketPeriods(turmaId: string): Promise<TurmaBucketPeriod[]> {
  try {
    const { data, error } = await supabase
      .from('turma_bucket_periods')
      .select('*')
      .eq('turma_id', turmaId)
      .order('periodo_numero')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar períodos de baldes:', error)
    throw error
  }
}

export async function createTurmaBucketPeriodsWithDates(turmaId: string, datas: string[]): Promise<TurmaBucketPeriod[]> {
  try {
    if (datas.length !== 4) {
      throw new Error('Exatamente 4 datas são necessárias')
    }

    // Forçar atualização do schema cache do Supabase
    try {
      await supabase.from('turma_bucket_periods').select('id').limit(0)
    } catch (_) {
      // Ignorar erros nesta query de teste
    }

    const periods: Omit<TurmaBucketPeriod, 'id' | 'criado_em' | 'atualizado_em'>[] = []
    const periodLabels = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']

    datas.forEach((dataStr, index) => {
      const date = new Date(dataStr)
      
      // Determinar o label do período baseado no mês
      const month = date.getMonth()
      let periodoLabel = periodLabels[0]
      if (month >= 3 && month <= 5) periodoLabel = periodLabels[1]
      else if (month >= 6 && month <= 8) periodoLabel = periodLabels[2]
      else if (month >= 9 && month <= 11) periodoLabel = periodLabels[3]

      periods.push({
        turma_id: turmaId,
        periodo_numero: index + 1,
        periodo_label: periodoLabel,
        data_monitoramento: dataStr
      })
    })

    const { data, error } = await supabase
      .from('turma_bucket_periods')
      .insert(periods)
      .select()

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao criar períodos de baldes com datas:', error)
    throw error
  }
}

export async function updateTurmaBucketPeriod(periodId: string, updates: Partial<TurmaBucketPeriod>): Promise<TurmaBucketPeriod> {
  try {
    const { data, error } = await supabase
      .from('turma_bucket_periods')
      .update({
        ...updates,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', periodId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar período de baldes:', error)
    throw error
  }
}

export async function deleteTurmaBucketPeriod(periodId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('turma_bucket_periods')
      .delete()
      .eq('id', periodId)
    
    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar período de baldes:', error)
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
// Queries para gerenciar registros de baldes individuais
export async function fetchBaldesForParticipant(participanteId: string): Promise<Balde[]> {
  try {
    const { data, error } = await supabase
      .from('baldes')
      .select('*')
      .eq('participante_id', participanteId)
      .order('data_registro', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar baldes do participante:', error)
    throw error
  }
}

export async function createBaldeRecord(
  participanteId: string,
  quantidade: number,
  dataRegistro: string,
  trimestre?: string
): Promise<Balde> {
  try {
    // Se não for fornecido trimestre, calcular baseado na data
    let trimstreCalc = trimestre
    if (!trimstreCalc) {
      const month = new Date(dataRegistro).getMonth() + 1
      const year = new Date(dataRegistro).getFullYear()
      const quarter = Math.ceil(month / 3)
      trimstreCalc = `${year}-Q${quarter}`
    }

    const { data, error } = await supabase
      .from('baldes')
      .insert([{
        participante_id: participanteId,
        quantidade,
        data_registro: dataRegistro,
        trimestre: trimstreCalc
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar registro de balde:', error)
    throw error
  }
}

export async function updateBaldeRecord(
  baldeId: string,
  updates: {
    quantidade?: number
    data_registro?: string
    trimestre?: string
  }
): Promise<Balde> {
  try {
    const { data, error } = await supabase
      .from('baldes')
      .update(updates)
      .eq('id', baldeId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar balde:', error)
    throw error
  }
}

export async function deleteBaldeRecord(baldeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('baldes')
      .delete()
      .eq('id', baldeId)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar balde:', error)
    throw error
  }
}

export async function fetchBaldesByYearAndParticipant(
  participanteId: string,
  year: number
): Promise<Balde[]> {
  try {
    // Buscar registros do participante para o ano especificado
    const { data, error } = await supabase
      .from('baldes')
      .select('*')
      .eq('participante_id', participanteId)
      .filter('data_registro', 'gte', `${year}-01-01`)
      .filter('data_registro', 'lte', `${year}-12-31`)
      .order('data_registro', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar baldes por ano:', error)
    throw error
  }
}

// ===== QUERIES PARA WHATSAPP LINKS PARA PARTICIPANTES =====

/**
 * Criar um link único para um participante fazer submissão de baldes
 */
export async function createParticipanteBucketLink(
  participanteId: string,
  turmaBucketPeriodId: string,
  expiresAt?: Date
): Promise<ParticipanteBucketLink> {
  try {
    // Gerar um token único
    const token = generateUniqueToken()

    const { data, error } = await supabase
      .from('participante_bucket_links')
      .insert([{
        participante_id: participanteId,
        turma_bucket_period_id: turmaBucketPeriodId,
        token,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
        submitted: false
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar link de participante:', error)
    throw error
  }
}

/**
 * Buscar link por token (sem autenticação necessária)
 */
export async function fetchParticipanteBucketLinkByToken(token: string): Promise<ParticipanteBucketLink | null> {
  try {
    const { data, error } = await supabase
      .from('participante_bucket_links')
      .select(`
        *,
        participantes:participante_id (id, nome, email, telefone),
        turma_bucket_periods:turma_bucket_period_id (id, periodo_label, data_monitoramento)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null
      }
      throw error
    }

    // Validar se o link expirou
    if (data?.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        return null
      }
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar link por token:', error)
    throw error
  }
}

/**
 * Atualizar um link após submissão
 */
export async function updateParticipanteBucketLinkSubmission(
  token: string,
  quantidade: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Primeiro, buscar o link
    const linkData = await fetchParticipanteBucketLinkByToken(token)
    if (!linkData) {
      throw new Error('Link inválido ou expirado')
    }

    // Criar registro de balde
    const balde = await createBalde({
      participante_id: linkData.participante_id,
      turma_id: undefined,
      turma_bucket_period_id: linkData.turma_bucket_period_id,
      trimestre: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      quantidade,
      data_registro: new Date().toISOString().split('T')[0]
    })

    // Atualizar o link como submetido
    await supabase
      .from('participante_bucket_links')
      .update({
        submitted: true,
        submitted_at: new Date().toISOString()
      })
      .eq('token', token)

    return {
      success: true,
      message: `Obrigado! Registramos ${quantidade} baldes coletados neste período.`
    }
  } catch (error) {
    console.error('Erro ao salvar submissão de baldes:', error)
    throw error
  }
}

/**
 * Gerar links em lote para todos os participantes de uma turma em um período
 */
export async function generateBucketLinksForPeriod(
  turmaId: string,
  turmaBucketPeriodId: string,
  expiresInDays: number = 30
): Promise<Array<{ participanteId: string; participanteNome: string; token: string; link: string }>> {
  try {
    // Buscar todos os participantes ativos da turma
    const { data: participantesTurma, error: errorPT } = await supabase
      .from('participantes_turmas')
      .select('participante_id, participantes(id, nome)')
      .eq('turma_id', turmaId)

    if (errorPT) throw errorPT

    // Gerar links para cada participante
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const linksGerados: Array<{ participanteId: string; participanteNome: string; token: string; link: string }> = []

    for (const rel of participantesTurma || []) {
      const participanteId = rel.participante_id
      const participanteNome = (rel.participantes as any)?.nome || 'Participante'

      // Verificar se já existe um link ativo para este participante e período
      const { data: existingLink } = await supabase
        .from('participante_bucket_links')
        .select('token')
        .eq('participante_id', participanteId)
        .eq('turma_bucket_period_id', turmaBucketPeriodId)
        .eq('is_active', true)
        .maybeSingle()

      let token: string
      if (existingLink) {
        token = existingLink.token
      } else {
        // Criar novo link
        const link = await createParticipanteBucketLink(
          participanteId,
          turmaBucketPeriodId,
          expiresAt
        )
        token = link.token
      }

      // Construir URL do link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const linkUrl = `${baseUrl}/bucket/${token}`

      linksGerados.push({
        participanteId,
        participanteNome,
        token,
        link: linkUrl
      })
    }

    return linksGerados
  } catch (error) {
    console.error('Erro ao gerar links em lote:', error)
    throw error
  }
}

/**
 * Buscar todos os links de uma turma e período
 */
export async function fetchBucketLinksForPeriod(
  turmaId: string,
  turmaBucketPeriodId: string
): Promise<(ParticipanteBucketLink & { 
  participante?: { id: string; nome: string };
  periodo?: { periodo_label: string }
})[]> {
  try {
    const { data: periodo, error: errorP } = await supabase
      .from('turma_bucket_periods')
      .select('id, turma_id')
      .eq('id', turmaBucketPeriodId)
      .eq('turma_id', turmaId)
      .single()

    if (errorP) throw errorP

    const { data: links, error: errorL } = await supabase
      .from('participante_bucket_links')
      .select(`
        *,
        participantes:participante_id (id, nome)
      `)
      .eq('turma_bucket_period_id', turmaBucketPeriodId)
      .order('criado_em', { ascending: false })

    if (errorL) throw errorL
    return links || []
  } catch (error) {
    console.error('Erro ao buscar links de período:', error)
    throw error
  }
}

/**
 * Revogar um link específico
 */
export async function revokeBucketLink(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('participante_bucket_links')
      .update({ is_active: false })
      .eq('token', token)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao revogar link:', error)
    throw error
  }
}

/**
 * Função auxiliar para gerar um token único
 */
function generateUniqueToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = 32
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
