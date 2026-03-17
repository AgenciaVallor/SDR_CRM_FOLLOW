// src/types/index.ts — All TypeScript interfaces for Vallor CRM

export interface User {
  id: string
  nome: string
  email: string
  senha: string
  role: 'admin' | 'gerente' | 'vendedor'
  avatar: string
  metaDiariaLigacoes: number
  metaDiariaReunioes: number
  ativo: boolean
  criadoEm: number
}

export interface ChecklistCall {
  apresentouProposta: boolean
  levantouObjecao: boolean
  agendouProximoPasso: boolean
  demonstrouInteresse: boolean
  solicitouRetorno: boolean
}

export type CallStatus =
  | 'atendida'
  | 'perdida'
  | 'nao-atendeu'
  | 'caixa-postal'
  | 'retornar-depois'
  | 'conversa-iniciada'
  | 'reuniao-agendada'
  | 'follow-up'
  | 'contrato-assinado'
  | 'perdido-tem-empresa'
  | 'perdido-desqualificado'
export type MeetingLocal = 'presencial' | 'zoom' | 'meet' | 'telefone' | 'whatsapp'

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'

export interface Script {
  id: string
  titulo: string
  conteudo: string
  tipo: 'abertura' | 'decisor' | 'secretaria' | 'fechamento'
}

export interface Objecao {
  id: string
  gatilho: string
  resposta: string
}

export interface Nicho {
  id: string
  nome: string
}

export interface Call {
  id: string
  nome: string
  numero: string
  empresa: string
  nicho: string
  status: CallStatus
  reuniaoAgendada: boolean
  reuniaoData: string | null
  reuniaoHora: string | null
  reuniaoLocal: MeetingLocal | null
  anotacao: string
  checklist: ChecklistCall
  followup: boolean
  followupData: string | null
  followupNota: string
  followupFeito: boolean
  operadorId: string
  operadorNome: string
  leadId: string | null
  timestamp: number
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6
  semanaKey: string
  mes: string
  tentativas: number
  periodo: 'manha' | 'tarde' | 'noite' | ''
}

export type LeadTag = 'dentista' | 'otica' | 'imoveis' | 'turismo' | 'seguros' | 'saude' | 'outros'
export type LeadPrioridade = 'alta' | 'media' | 'baixa'
export type LeadOrigem = 'ligacao' | 'indicacao' | 'ads' | 'organico' | 'outro'

export interface Activity {
  id: string
  txt: string
  tipo: 'criacao' | 'movimento' | 'nota' | 'ligacao' | 'reuniao' | 'anotacao'
  autorId: string
  autorNome: string
  ts: number
}

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada' | 'remarcada'

export interface Meeting {
  id: string
  data: string
  hora: string
  local: MeetingLocal
  status: MeetingStatus
  obs: string
  criadoEm: number
}

export interface Lead {
  id: string
  colId: string
  nome: string
  empresa: string
  telefone: string
  email: string
  valor: number
  venc: string | null
  responsavelId: string
  tag: LeadTag
  prioridade: LeadPrioridade
  origem: LeadOrigem
  obs: string
  atividades: Activity[]
  reunioes: Meeting[]
  script: string
  criadoEm: number
  atualizadoEm: number
}

export interface KanbanCol {
  id: string
  nome: string
  cor: string
  ordem: number
  script: string
  isWon: boolean
  isLost: boolean
}

export interface CadenciaEtapa {
  dia: number
  tipo: 'ligacao' | 'whatsapp' | 'email'
  instrucao: string
  feita: boolean
  feitaEm: string | null
}

export interface Cadencia {
  id: string
  leadId: string
  templateId: string
  inicioEm: number
  etapas: CadenciaEtapa[]
  ativa: boolean
}

export type DiaStatus = 'pendente' | 'em_andamento' | 'meta_batida' | 'meta_parcial' | 'abaixo'

export interface DiaRegistro {
  data: string
  meta_ligacoes: number
  meta_reunioes: number
  ligacoes_feitas: number
  reunioes_agendadas: number
  taxa_conversao: number
  status: DiaStatus
  anotacao_dia: string
}

export interface SabadoRegistro {
  data: string
  revisao_semana: string
  total_ligacoes_semana: number
  total_reunioes_semana: number
  meta_ligacoes_semana: number
  meta_reunioes_semana: number
  aprendizados: string
  plano_proxima_semana: string
  finalizado: boolean
}

export interface RegistroSemanal {
  id: string
  userId: string
  semanaKey: string
  mes: string
  ano: number
  numeroDaSemana: number
  dias: {
    segunda: DiaRegistro
    terca: DiaRegistro
    quarta: DiaRegistro
    quinta: DiaRegistro
    sexta: DiaRegistro
    sabado: SabadoRegistro
  }
}

export interface Session {
  userId: string
  nome: string
  email: string
  role: 'admin' | 'gerente' | 'vendedor'
}

export interface CadenciaTemplate {
  id: string
  nome: string
  etapas: Omit<CadenciaEtapa, 'feita' | 'feitaEm'>[]
}

export interface Alert {
  userId: string
  tipo: 'SEM_ATIVIDADE_HOJE' | 'INATIVO_3H'
  horas: number | null
  ts: number
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'fire'
  duration?: number
}
