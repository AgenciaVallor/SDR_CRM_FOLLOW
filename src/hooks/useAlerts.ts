// src/hooks/useAlerts.ts
import { useState, useCallback } from 'react'
import { Alert } from '../types'
import { getUsers, getCalls } from '../utils/storage'
import { format } from 'date-fns'
import { isBusinessHours } from '../utils/weekUtils'

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const checkInactivity = useCallback(async () => {
    if (!isBusinessHours()) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const newAlerts: Alert[] = []

    const [users, calls] = await Promise.all([getUsers(), getCalls()])

    users
      .filter(u => u.role === 'vendedor' && u.ativo)
      .forEach(user => {
        const callsToday = calls.filter(c => {
          const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
          return c.operadorId === user.id && d === today
        })

        if (callsToday.length === 0) {
          newAlerts.push({ userId: user.id, tipo: 'SEM_ATIVIDADE_HOJE', horas: null, ts: Date.now() })
          return
        }

        const lastCall = Math.max(...callsToday.map(c => c.timestamp))
        const horasParado = (Date.now() - lastCall) / 3600000

        if (horasParado > 3) {
          newAlerts.push({ userId: user.id, tipo: 'INATIVO_3H', horas: Math.round(horasParado), ts: Date.now() })
        }
      })

    setAlerts(newAlerts)
    return newAlerts
  }, [])

  const getAlertForUser = useCallback((userId: string) => {
    return alerts.find(a => a.userId === userId)
  }, [alerts])

  return { alerts, checkInactivity, getAlertForUser }
}
