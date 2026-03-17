import { supabase } from '@/lib/supabase'
import { Call, User, Lead, KanbanCol, Meeting, CadenciaTemplate } from '@/types'

// ── UTILS ───────────────────────────────────────────────

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── AUTH ────────────────────────────────────────────────

export async function loginUser(email: string, senha: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error || !data.user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (!userData || !userData.ativo) {
    await supabase.auth.signOut()
    return null
  }

  return mapDbUser(userData)
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut()
  sessionStorage.removeItem('vallor_session')
}

export async function getCurrentSession(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .single()

    if (userError || !userData || !userData.ativo) return null
    return mapDbUser(userData)
  } catch {
    return null
  }
}

// ── USERS ───────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('criado_em')
  return (data || []).map(mapDbUser)
}

export async function createUser(userData: {
  nome: string
  email: string
  senha: string
  role: 'admin' | 'gerente' | 'vendedor'
  avatar: string
  metaDiariaLigacoes: number
  metaDiariaReunioes: number
}): Promise<{ success: boolean; error?: string }> {
  const response = await supabase.functions.invoke('create-user', {
    body: userData,
  })
  if (response.error) return { success: false, error: response.error.message }
  if (response.data?.error) return { success: false, error: response.data.error }
  return { success: true }
}

export async function updateUser(
  userId: string,
  updates: {
    nome?: string
    email?: string
    role?: string
    avatar?: string
    meta_ligacoes?: number
    meta_reunioes?: number
    ativo?: boolean
  },
  novaSenha?: string
): Promise<{ success: boolean; error?: string }> {
  const response = await supabase.functions.invoke('update-user', {
    body: { userId, updates, novaSenha },
  })
  if (response.error) return { success: false, error: response.error.message }
  if (response.data?.error) return { success: false, error: response.data.error }
  return { success: true }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const response = await supabase.functions.invoke('delete-user', {
    body: { userId },
  })
  if (response.error) return { success: false, error: response.error.message }
  if (response.data?.error) return { success: false, error: response.data.error }
  return { success: true }
}

export async function getReunioes(): Promise<Meeting[]> {
  const { data } = await supabase
    .from('reunioes')
    .select('*')
    .order('data', { ascending: true })
    .order('hora', { ascending: true })
  
  return (data || []).map(row => ({
    id:            row.id,
    data:          row.data,
    hora:          row.hora,
    local:         row.local,
    status:        row.status,
    obs:           row.obs || '',
    leadNome:      row.lead_nome || '',
    leadEmpresa:   row.lead_empresa || '',
    responsavelId: row.responsavel_id || '',
    criadoEm:      new Date(row.criado_em).getTime(),
  }))
}

export function getVisibleUsers(currentUser: User, allUsers: User[] | Promise<User[]>) {
  // If it's a promise, we can't really "filter" synchronously easily if the UI expects sync.
  // But usually this is called with a pre-fetched list.
  const users = Array.isArray(allUsers) ? allUsers : []
  if (currentUser.role === 'admin') return users
  if (currentUser.role === 'gerente') {
    // For now, manager sees everyone. Future: filter by team.
    return users
  }
  return users.filter(u => u.id === currentUser.id)
}

// ── CALLS ───────────────────────────────────────────────

export async function getCalls(): Promise<Call[]> {
  const { data } = await supabase
    .from('calls')
    .select('*')
    .order('criado_em', { ascending: false })
  return (data || []).map(mapDbCall)
}

export async function getCallsByOperador(operadorId: string): Promise<Call[]> {
  const { data } = await supabase
    .from('calls')
    .select('*')
    .eq('operador_id', operadorId)
    .order('criado_em', { ascending: false })
  return (data || []).map(mapDbCall)
}

export async function saveCall(call: Call): Promise<void> {
  await supabase.from('calls').insert(mapCallToDb(call))
}

export async function updateCall(id: string, updates: Partial<Call>): Promise<void> {
  await supabase.from('calls').update(mapCallToDb(updates as Call)).eq('id', id)
}

export async function deleteCall(id: string): Promise<void> {
  await supabase.from('calls').delete().eq('id', id)
}

export async function getTentativas(numero: string, operadorId: string): Promise<number> {
  const limpo = numero.replace(/\D/g, '')
  const { count } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('numero', limpo)
    .eq('operador_id', operadorId)
  return count || 0
}

// ── LEADS ───────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*')
  if (error) throw error
  return (data || []).map(mapDbLead)
}

export async function getLeadsByOperador(opId: string): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*').eq('operadorId', opId)
  if (error) throw error
  return (data || []).map(mapDbLead)
}

export async function saveLead(lead: Lead): Promise<void> {
  await supabase.from('leads').insert(mapLeadToDb(lead))
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  await supabase.from('leads').update(mapLeadToDb(updates)).eq('id', id)
}

export async function deleteLead(id: string): Promise<void> {
  await supabase.from('leads').delete().eq('id', id)
}

// ── KANBAN ──────────────────────────────────────────────

export async function getCols(): Promise<KanbanCol[]> {
  const { data } = await supabase.from('kanban_cols').select('*').order('ordem')
  return (data || []).map(row => ({
    id: row.id as string,
    nome: row.nome as string,
    cor: row.cor as string,
    ordem: row.ordem as number,
    script: row.script as string || '',
    isWon: row.is_won as boolean,
    isLost: row.is_lost as boolean,
  }))
}

export async function updateCol(id: string, updates: Partial<KanbanCol>): Promise<void> {
  const dbUpdates: any = {}
  if (updates.nome) dbUpdates.nome = updates.nome
  if (updates.cor) dbUpdates.cor = updates.cor
  if (updates.ordem !== undefined) dbUpdates.ordem = updates.ordem
  if (updates.script !== undefined) dbUpdates.script = updates.script
  if (updates.isWon !== undefined) dbUpdates.is_won = updates.isWon
  if (updates.isLost !== undefined) dbUpdates.is_lost = updates.isLost
  
  await supabase.from('kanban_cols').update(dbUpdates).eq('id', id)
}

// ── SEMANAS ─────────────────────────────────────────────

export async function getSemana(userId: string, semanaKey: string) {
  const { data } = await supabase
    .from('semanas')
    .select('*')
    .eq('user_id', userId)
    .eq('semana_key', semanaKey)
    .single()
  return data || null
}

export async function upsertSemana(userId: string, semanaKey: string, updates: Record<string, unknown>) {
  const { data: existing } = await supabase
    .from('semanas')
    .select('dias')
    .eq('user_id', userId)
    .eq('semana_key', semanaKey)
    .single()

  const newDias = existing ? { ...existing.dias, ...((updates.dias as any) || {}) } : updates.dias

  await supabase.from('semanas').upsert({
    user_id: userId,
    semana_key: semanaKey,
    ...updates,
    dias: newDias,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'user_id,semana_key' })
}

// Aliases for SemanaAtual.tsx compatibility
export const findSemana = getSemana
export async function addSemana(rec: any) {
  return upsertSemana(rec.user_id, rec.semana_key, rec)
}
export async function updateSemana(id: string, updates: any) {
  // The original addSemana/updateSemana used a different signature/logic.
  // In the legacy code, 'id' was used. In Supabase, we use user_id + semana_key.
  // This is a bit tricky. I'll try to find the record by ID first if needed, 
  // but for now, let's assume the callers provide what's needed.
  // Actually, SemanaAtual.tsx calls updateSemana(rec.id, { dias: ... })
  const { data } = await supabase.from('semanas').select('user_id, semana_key').eq('id', id).single()
  if (data) {
    return upsertSemana(data.user_id, data.semana_key, updates)
  }
}

export async function addLead(lead: Lead): Promise<void> {
  await supabase.from('leads').insert(mapLeadToDb(lead))
}

export async function getTemplates(): Promise<CadenciaTemplate[]> {
  const raw = localStorage.getItem('vallor_templates')
  return JSON.parse(raw || '[]')
}

export async function setTemplates(templates: CadenciaTemplate[]): Promise<void> {
  localStorage.setItem('vallor_templates', JSON.stringify(templates))
}

// ── MAPPERS ─────────────────────────────────────────────

function mapDbUser(row: Record<string, unknown>): User {
  return {
    id:                   row.id as string,
    nome:                 row.nome as string,
    email:                row.email as string,
    senha:                '',
    role:                 row.role as 'admin' | 'gerente' | 'vendedor',
    avatar:               row.avatar as string,
    metaDiariaLigacoes:   row.meta_ligacoes as number,
    metaDiariaReunioes:   row.meta_reunioes as number,
    ativo:                row.ativo as boolean,
    criadoEm:             new Date(row.criado_em as string).getTime(),
  }
}

function mapDbCall(row: Record<string, unknown>): Call {
  return {
    id:                   row.id as string,
    nome:                 row.nome as string,
    empresa:              row.empresa as string || '',
    numero:               row.numero as string,
    nicho:                row.nicho as string || '',
    status:               row.status as Call['status'],
    anotacao:             row.anotacao as string || '',
    periodo:              row.periodo as Call['periodo'] || '',
    tentativas:           row.tentativas as number || 1,
    checklist: {
      apresentouProposta:  row.checklist_proposta as boolean,
      levantouObjecao:     row.checklist_objecao as boolean,
      agendouProximoPasso: row.checklist_proximo as boolean,
      demonstrouInteresse: row.checklist_interesse as boolean,
      solicitouRetorno:    row.checklist_retorno as boolean,
    },
    reuniaoAgendada:      row.reuniao_agendada as boolean,
    reuniaoData:          row.reuniao_data as string || null,
    reuniaoHora:          row.reuniao_hora as string || null,
    reuniaoLocal:         row.reuniao_local as Call['reuniaoLocal'] || null,
    reuniaoObs:           row.reuniao_obs as string || '',
    followup:             row.followup as boolean,
    followupData:         row.followup_data as string || null,
    followupNota:         row.followup_nota as string || '',
    followupFeito:        row.followup_feito as boolean,
    operadorId:           row.operador_id as string || '',
    operadorNome:         row.operador_nome as string || '',
    leadId:               row.lead_id as string || null,
    semanaKey:            row.semana_key as string || '',
    mes:                  row.mes as string || '',
    timestamp:            new Date(row.criado_em as string).getTime(),
    diaSemana:            new Date(row.criado_em as string).getDay() as 0|1|2|3|4|5|6,
  }
}

function mapDbLead(row: Record<string, unknown>): Lead {
  return {
    id:            row.id as string,
    colId:         row.col_id as string,
    nome:          row.nome as string,
    empresa:       row.empresa as string || '',
    telefone:      row.telefone as string,
    email:         row.email as string || '',
    valor:         row.valor as number || 0,
    venc:          row.venc as string || null,
    responsavelId: row.responsavel_id as string,
    tag:           row.tag as Lead['tag'],
    prioridade:    row.prioridade as Lead['prioridade'],
    origem:        row.origem as Lead['origem'],
    obs:           row.obs as string || '',
    atividades:    (row.atividades as any[]) || [],
    reunioes:      (row.reunioes as any[]) || [],
    script:        row.script as string || '',
    criadoEm:      new Date(row.criado_em as string).getTime(),
    atualizadoEm:  new Date(row.atualizado_em as string).getTime(),
  }
}

function mapLeadToDb(lead: Partial<Lead>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (lead.id)            row.id             = lead.id
  if (lead.colId)         row.col_id          = lead.colId
  if (lead.nome)          row.nome           = lead.nome
  if (lead.empresa !== undefined) row.empresa = lead.empresa
  if (lead.telefone)      row.telefone       = lead.telefone
  if (lead.email !== undefined)   row.email   = lead.email
  if (lead.valor !== undefined)   row.valor   = lead.valor
  if (lead.venc !== undefined)    row.venc    = lead.venc
  if (lead.responsavelId) row.responsavel_id = lead.responsavelId
  if (lead.tag)           row.tag            = lead.tag
  if (lead.prioridade)    row.prioridade     = lead.prioridade
  if (lead.origem)        row.origem         = lead.origem
  if (lead.obs !== undefined)     row.obs     = lead.obs
  if (lead.atividades)    row.atividades     = lead.atividades
  if (lead.reunioes)      row.reunioes       = lead.reunioes
  if (lead.script !== undefined)  row.script  = lead.script
  return row
}

function mapCallToDb(call: Partial<Call>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (call.id)             row.id                  = call.id
  if (call.nome)           row.nome                = call.nome
  if (call.empresa !== undefined) row.empresa      = call.empresa
  if (call.numero)         row.numero              = call.numero
  if (call.nicho !== undefined)   row.nicho        = call.nicho
  if (call.status)         row.status              = call.status
  if (call.anotacao !== undefined) row.anotacao    = call.anotacao
  if (call.periodo !== undefined) row.periodo      = call.periodo
  if (call.tentativas)    row.tentativas           = call.tentativas
  if (call.checklist) {
    row.checklist_proposta   = call.checklist.apresentouProposta
    row.checklist_objecao    = call.checklist.levantouObjecao
    row.checklist_proximo    = call.checklist.agendouProximoPasso
    row.checklist_interesse  = call.checklist.demonstrouInteresse
    row.checklist_retorno    = call.checklist.solicitouRetorno
  }
  if (call.reuniaoAgendada !== undefined) row.reuniao_agendada = call.reuniaoAgendada
  if (call.reuniaoData !== undefined)     row.reuniao_data     = call.reuniaoData
  if (call.reuniaoHora !== undefined)     row.reuniao_hora     = call.reuniaoHora
  if (call.reuniaoLocal !== undefined)    row.reuniao_local    = call.reuniaoLocal || ''
  if (call.reuniaoObs !== undefined)      row.reuniao_obs      = call.reuniaoObs
  if (call.followup !== undefined)        row.followup         = call.followup
  if (call.followupData !== undefined)    row.followup_data    = call.followupData
  if (call.followupNota !== undefined)    row.followup_nota    = call.followupNota
  if (call.followupFeito !== undefined)   row.followup_feito   = call.followupFeito
  if (call.operadorId)     row.operador_id          = call.operadorId
  if (call.operadorNome)   row.operador_nome         = call.operadorNome
  if (call.leadId !== undefined) row.lead_id         = call.leadId
  if (call.semanaKey)      row.semana_key            = call.semanaKey
  if (call.mes)            row.mes                   = call.mes
  return row
}

// ── ADICIONADOS CONFORME SOLICITAÇÃO ───────────────────────────────────

export async function saveCalls(calls: Call[]): Promise<void> {
  console.warn('saveCalls called — use saveCall for individual records')
}

export async function getFeedbacksForCall(callId: string): Promise<any[]> {
  const { data } = await supabase
    .from('call_feedbacks')
    .select('*')
    .eq('call_id', callId)
    .order('criado_em', { ascending: true })
  return (data || []).map((row: any) => ({
    id: row.id,
    callId: row.call_id,
    autorId: row.autor_id,
    autorNome: row.autor_nome,
    texto: row.texto,
    criadoEm: new Date(row.criado_em).getTime(),
  }))
}

export async function saveFeedback(callId: string, autorId: string, autorNome: string, texto: string): Promise<void> {
  await supabase.from('call_feedbacks').insert({
    call_id: callId,
    autor_id: autorId,
    autor_nome: autorNome,
    texto,
  })
}

export async function getCadencias(): Promise<any[]> {
  const raw = localStorage.getItem('vallor_cadencias')
  return JSON.parse(raw || '[]')
}
