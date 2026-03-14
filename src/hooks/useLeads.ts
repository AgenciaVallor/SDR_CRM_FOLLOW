// src/hooks/useLeads.ts
import { useState, useCallback } from 'react'
import { Lead, Activity } from '../types'
import { getLeads, setLeads, addLead, updateLead, deleteLead, getCols } from '../utils/storage'
import { genId } from '../utils/storage'

export function useLeads(userId?: string, isAdmin?: boolean) {
  const [leads, setLeadsState] = useState<Lead[]>(() => {
    const all = getLeads()
    return isAdmin || !userId ? all : all.filter(l => l.responsavelId === userId)
  })

  const reload = useCallback(() => {
    const all = getLeads()
    setLeadsState(isAdmin || !userId ? all : all.filter(l => l.responsavelId === userId))
  }, [userId, isAdmin])

  const add = useCallback((l: Lead) => {
    addLead(l)
    reload()
  }, [reload])

  const update = useCallback((id: string, patch: Partial<Lead>) => {
    updateLead(id, { ...patch, atualizadoEm: Date.now() })
    reload()
  }, [reload])

  const remove = useCallback((id: string) => {
    deleteLead(id)
    reload()
  }, [reload])

  const moveColumn = useCallback((leadId: string, colId: string, userId: string, userName: string) => {
    const lead = getLeads().find(l => l.id === leadId)
    if (!lead) return
    const cols = getCols()
    const col = cols.find(c => c.id === colId)
    const act: Activity = {
      id: genId(),
      txt: `Lead movido para "${col?.nome ?? colId}"`,
      tipo: 'movimento',
      autorId: userId,
      autorNome: userName,
      ts: Date.now(),
    }
    updateLead(leadId, {
      colId,
      atividades: [...lead.atividades, act],
      atualizadoEm: Date.now(),
      script: col?.script ?? lead.script,
    })
    reload()
  }, [reload])

  const addNote = useCallback((leadId: string, txt: string, userId: string, userName: string) => {
    const lead = getLeads().find(l => l.id === leadId)
    if (!lead) return
    const act: Activity = {
      id: genId(),
      txt,
      tipo: 'anotacao',
      autorId: userId,
      autorNome: userName,
      ts: Date.now(),
    }
    updateLead(leadId, {
      atividades: [...lead.atividades, act],
      atualizadoEm: Date.now(),
    })
    reload()
  }, [reload])

  const getPipelineValue = useCallback(() => {
    const cols = getCols()
    return leads.reduce((sum, l) => {
      const col = cols.find(c => c.id === l.colId)
      return col && !col.isLost ? sum + l.valor : sum
    }, 0)
  }, [leads])

  return { leads, add, update, remove, reload, moveColumn, addNote, getPipelineValue }
}
