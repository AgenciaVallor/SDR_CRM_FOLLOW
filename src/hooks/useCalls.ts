// src/hooks/useCalls.ts
import { useState, useCallback } from 'react'
import { Call, CallStatus, DiaStatus } from '../types'
import { getCalls, setCalls, addCall, updateCall, deleteCall, getVisibleCalls, getUserById } from '../utils/storage'
import { getISOWeek, getISOWeekYear, format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { getWeekKey } from '../utils/weekUtils'

function buildWeekKey(d: Date): string {
  return `${getISOWeekYear(d)}-${String(getISOWeek(d)).padStart(2,'0')}`
}

export function useCalls(userId?: string, _isAdminIgnoredDumbArgForBackwardsCompat?: boolean) {
  const [calls, setCallsState] = useState<Call[]>(() => {
    const all = getCalls()
    if (!userId) return []
    const u = getUserById(userId)
    return getVisibleCalls(u || null, all)
  })

  const reload = useCallback(() => {
    const all = getCalls()
    if (!userId) return setCallsState([])
    const u = getUserById(userId)
    setCallsState(getVisibleCalls(u || null, all))
  }, [userId])

  const add = useCallback((c: Call) => {
    addCall(c)
    reload()
  }, [reload])

  const update = useCallback((id: string, patch: Partial<Call>) => {
    updateCall(id, patch)
    reload()
  }, [reload])

  const remove = useCallback((id: string) => {
    deleteCall(id)
    reload()
  }, [reload])

  const getCallsForDay = useCallback((uid: string, date: string) => {
    const start = startOfDay(parseISO(date)).getTime()
    const end   = endOfDay(parseISO(date)).getTime()
    const u = getUserById(userId || uid)
    return getVisibleCalls(u || null, getCalls()).filter(c =>
      c.operadorId === uid &&
      c.timestamp >= start &&
      c.timestamp <= end
    )
  }, [userId])

  const getStatsForDay = useCallback((uid: string, date: string) => {
    const dayCalls = getCallsForDay(uid, date)
    const reunioes = dayCalls.filter(c => c.reuniaoAgendada).length
    const ligacoes = dayCalls.length
    return {
      ligacoes,
      atendidas:    dayCalls.filter(c => c.status === 'atendida').length,
      perdidas:     dayCalls.filter(c => c.status === 'perdida').length,
      naoAtendeu:   dayCalls.filter(c => c.status === 'nao-atendeu').length,
      caixaPostal:  dayCalls.filter(c => c.status === 'caixa-postal').length,
      reunioes,
      taxaConversao: ligacoes > 0 ? Math.round((reunioes / ligacoes) * 100) : 0,
      metaLigacoes: 50,
      metaReunioes: 5,
      status: getStatusDia(ligacoes, reunioes),
      calls: dayCalls,
    }
  }, [getCallsForDay])

  const getTodayStats = useCallback((uid: string) => {
    return getStatsForDay(uid, format(new Date(), 'yyyy-MM-dd'))
  }, [getStatsForDay])

  const getWeeklyStats = useCallback((uid: string, weekKey: string) => {
    const u = getUserById(userId || uid)
    const allCalls = getVisibleCalls(u || null, getCalls())
    const all = allCalls.filter(c => c.operadorId === uid && c.semanaKey === weekKey)
    const reunioes = all.filter(c => c.reuniaoAgendada).length
    return {
      totalLigacoes: all.length,
      totalReunioes: reunioes,
      metaLigacoes: 250,
      metaReunioes: 25,
      taxaConversao: all.length > 0 ? Math.round((reunioes / all.length) * 100) : 0,
    }
  }, [])

  const getFollowups = useCallback((uid?: string) => {
    const u = getUserById(userId || uid || '')
    const all = getVisibleCalls(u || null, getCalls())
    const base = uid ? all.filter(c => c.operadorId === uid) : all
    return base.filter(c => c.followup && !c.followupFeito)
  }, [userId])

  const getLastActivity = useCallback((uid: string): number | null => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const u = getUserById(userId || uid)
    const callsToday = getVisibleCalls(u || null, getCalls()).filter(c => {
      const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
      return c.operadorId === uid && d === today
    })
    if (callsToday.length === 0) return null
    return Math.max(...callsToday.map(c => c.timestamp))
  }, [userId])

  return { calls, add, update, remove, reload, getCallsForDay, getStatsForDay, getTodayStats, getWeeklyStats, getFollowups, getLastActivity }
}

export function getStatusDia(ligacoes: number, reunioes: number): DiaStatus {
  if (ligacoes >= 50 && reunioes >= 5) return 'meta_batida'
  if (ligacoes >= 25 || reunioes >= 2) return 'meta_parcial'
  if (ligacoes > 0)                    return 'abaixo'
  return 'pendente'
}
