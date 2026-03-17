// src/utils/storage.ts — localStorage CRUD helpers

import { User, Call, Lead, KanbanCol, Cadencia, RegistroSemanal, Session, CadenciaTemplate } from '../types'

const KEYS = {
  users: 'vallor_users',
  calls: 'vallor_calls',
  leads: 'vallor_leads',
  cols: 'vallor_cols',
  cadencias: 'vallor_cadencias',
  semanas: 'vallor_semanas',
  templates: 'vallor_templates',
  session: 'vallor_session',
}

function getItem<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function getSessionItem<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setSessionItem<T>(key: string, data: T): void {
  sessionStorage.setItem(key, JSON.stringify(data))
}

function removeSessionItem(key: string): void {
  sessionStorage.removeItem(key)
}

const MASTER_ADMIN: User = {
  id: 'u-master',
  nome: 'Vallor Admin',
  email: 'valloragencia@gmail.com',
  senha: 'Deus@Fiel@1806',
  role: 'admin',
  avatar: '#f0c040',
  metaDiariaLigacoes: 50,
  metaDiariaReunioes: 5,
  ativo: true,
  criadoEm: Date.now()
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (): User[] =>
  JSON.parse(localStorage.getItem(KEYS.users) || '[]')

export const saveUsers = (users: User[]): void =>
  localStorage.setItem(KEYS.users, JSON.stringify(users))

export const deleteUser = (id: string): void =>
  saveUsers(getUsers().filter(u => u.id !== id))

export const setUsers = (users: User[]): void => setItem(KEYS.users, users)
export const addUser = (u: User): void => setUsers([...getUsers(), u])
export const updateUser = (id: string, patch: Partial<User>): void => {
  setUsers(getUsers().map(u => {
    if (u.id === id) {
      // Protege o Master Admin de alterações indevidas
      if (id === 'u-master') {
        const safePatch = { ...patch }
        delete safePatch.role
        delete safePatch.email
        delete safePatch.ativo
        return { ...u, ...safePatch }
      }
      return { ...u, ...patch }
    }
    return u
  }))
}
export const getUserById = (id: string): User | undefined => getUsers().find(u => u.id === id)

// ─── Calls ────────────────────────────────────────────────────────────────────
export const getCalls = (): Call[] => getItem<Call>(KEYS.calls)
export const setCalls = (calls: Call[]): void => setItem(KEYS.calls, calls)
export const saveCalls = setCalls
export const addCall = (c: Call): void => setCalls([...getCalls(), c])
export const updateCall = (id: string, patch: Partial<Call>): void => {
  setCalls(getCalls().map(c => c.id === id ? { ...c, ...patch } : c))
}
export const deleteCall = (id: string): void => {
  setCalls(getCalls().filter(c => c.id !== id))
}

export function getTentativas(numero: string, operadorId: string): number {
  const limpo = numero.replace(/\D/g, '')
  return getCalls().filter(
    c => c.numero.replace(/\D/g, '') === limpo && c.operadorId === operadorId
  ).length
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export const getLeads = (): Lead[] => getItem<Lead>(KEYS.leads)
export const setLeads = (leads: Lead[]): void => setItem(KEYS.leads, leads)
export const addLead = (l: Lead): void => setLeads([...getLeads(), l])
export const updateLead = (id: string, patch: Partial<Lead>): void => {
  setLeads(getLeads().map(l => l.id === id ? { ...l, ...patch } : l))
}
export const deleteLead = (id: string): void => {
  setLeads(getLeads().filter(l => l.id !== id))
}
export const getLeadById = (id: string): Lead | undefined => getLeads().find(l => l.id === id)

// ─── KanbanCols ───────────────────────────────────────────────────────────────
export const getCols = (): KanbanCol[] => getItem<KanbanCol>(KEYS.cols)
export const setCols = (cols: KanbanCol[]): void => setItem(KEYS.cols, cols)
export const addCol = (c: KanbanCol): void => setCols([...getCols(), c])
export const updateCol = (id: string, patch: Partial<KanbanCol>): void => {
  setCols(getCols().map(c => c.id === id ? { ...c, ...patch } : c))
}

// ─── Cadencias ────────────────────────────────────────────────────────────────
export const getCadencias = (): Cadencia[] => getItem<Cadencia>(KEYS.cadencias)
export const setCadencias = (c: Cadencia[]): void => setItem(KEYS.cadencias, c)
export const addCadencia = (c: Cadencia): void => setCadencias([...getCadencias(), c])
export const updateCadencia = (id: string, patch: Partial<Cadencia>): void => {
  setCadencias(getCadencias().map(c => c.id === id ? { ...c, ...patch } : c))
}

// ─── Semanas ──────────────────────────────────────────────────────────────────
export const getSemanas = (): RegistroSemanal[] => getItem<RegistroSemanal>(KEYS.semanas)
export const setSemanas = (s: RegistroSemanal[]): void => setItem(KEYS.semanas, s)
export const addSemana = (s: RegistroSemanal): void => setSemanas([...getSemanas(), s])
export const updateSemana = (id: string, patch: Partial<RegistroSemanal>): void => {
  setSemanas(getSemanas().map(s => s.id === id ? { ...s, ...patch } : s))
}
export const findSemana = (userId: string, semanaKey: string): RegistroSemanal | undefined =>
  getSemanas().find(s => s.userId === userId && s.semanaKey === semanaKey)

// ─── Templates de Cadência ────────────────────────────────────────────────────
export const getTemplates = (): CadenciaTemplate[] => getItem<CadenciaTemplate>(KEYS.templates)
export const setTemplates = (t: CadenciaTemplate[]): void => setItem(KEYS.templates, t)

// ─── Session ──────────────────────────────────────────────────────────────────
export const getSession = (): Session | null => getSessionItem<Session>(KEYS.session)
export const setSession = (s: Session): void => setSessionItem(KEYS.session, s)
export const clearSession = (): void => removeSessionItem(KEYS.session)

// ─── Utils ────────────────────────────────────────────────────────────────────
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function isSeeded(): boolean {
  return (localStorage.getItem(KEYS.users) !== null)
}
