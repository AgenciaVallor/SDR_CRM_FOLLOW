import { useState, useCallback, useEffect } from 'react'
import { Call, CallStatus, DiaStatus } from '../types'
import { getCalls, saveCall, updateCall, deleteCall, getCallsByOperador } from '../utils/storage'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'

export function useCalls(userId?: string, isAdmin?: boolean) {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = isAdmin ? await getCalls() : await getCallsByOperador(userId)
      setCalls(data)
    } finally {
      setLoading(false)
    }
  }, [userId, isAdmin])

  useEffect(() => {
    reload()
  }, [reload])

  const add = useCallback(async (c: Call) => {
    await saveCall(c)
    await reload()
  }, [reload])

  const update = useCallback(async (id: string, patch: Partial<Call>) => {
    await updateCall(id, patch)
    await reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await deleteCall(id)
    await reload()
  }, [reload])

  // Helper functions used by components
  const getCallsForDay = (uid: string, date: string) => {
    const start = startOfDay(parseISO(date)).getTime()
    const end   = endOfDay(parseISO(date)).getTime()
    return calls.filter(c => 
      c.operadorId === uid && 
      c.timestamp >= start && 
      c.timestamp <= end
    )
  }

  const getStatsForDay = (uid: string, date: string) => {
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
  }

  const getTodayStats = (uid: string) => {
    return getStatsForDay(uid, format(new Date(), 'yyyy-MM-dd'))
  }

  const getWeeklyStats = (uid: string, weekKey: string) => {
    const all = calls.filter(c => c.operadorId === uid && c.semanaKey === weekKey)
    const reunioes = all.filter(c => c.reuniaoAgendada).length
    return {
      totalLigacoes: all.length,
      totalReunioes: reunioes,
      metaLigacoes: 250,
      metaReunioes: 25,
      taxaConversao: all.length > 0 ? Math.round((reunioes / all.length) * 100) : 0,
    }
  }

  const getFollowups = (uid?: string) => {
    const base = uid ? calls.filter(c => c.operadorId === uid) : calls
    return base.filter(c => c.followup && !c.followupFeito)
  }

  const getLastActivity = (uid: string): number | null => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const callsToday = calls.filter(c => {
      const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
      return c.operadorId === uid && d === today
    })
    if (callsToday.length === 0) return null
    return Math.max(...callsToday.map(c => c.timestamp))
  }

  return { 
    calls, loading, add, update, remove, reload, 
    getCallsForDay, getStatsForDay, getTodayStats, getWeeklyStats, 
    getFollowups, getLastActivity 
  }
}

export function getStatusDia(ligacoes: number, reunioes: number): DiaStatus {
  if (ligacoes >= 50 && reunioes >= 5) return 'meta_batida'
  if (ligacoes >= 25 || reunioes >= 2) return 'meta_parcial'
  if (ligacoes > 0)                    return 'abaixo'
  return 'pendente'
}
