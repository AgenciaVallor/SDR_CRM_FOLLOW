import { useState, useCallback, useEffect } from 'react'
import { Lead, Activity } from '../types'
import { getLeads, getLeadsByOperador, saveLead, updateLead as dbUpdateLead, deleteLead, getCols, genId } from '../utils/storage'

export function useLeads(userId?: string, isAdmin?: boolean) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setLeads([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const all = isAdmin ? await getLeads() : await getLeadsByOperador(userId)
      setLeads(all)
    } finally {
      setLoading(false)
    }
  }, [userId, isAdmin])

  useEffect(() => {
    reload()
  }, [reload])

  const add = useCallback(async (l: Lead) => {
    await saveLead(l)
    await reload()
  }, [reload])

  const update = useCallback(async (id: string, patch: Partial<Lead>) => {
    await dbUpdateLead(id, { ...patch, atualizadoEm: Date.now() })
    await reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await deleteLead(id)
    await reload()
  }, [reload])

  const moveColumn = useCallback(async (leadId: string, colId: string, userId: string, userName: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    const cols = await getCols()
    const col = cols.find(c => c.id === colId)
    const act: Activity = {
      id: genId(),
      txt: `Lead movido para "${col?.nome ?? colId}"`,
      tipo: 'movimento',
      autorId: userId,
      autorNome: userName,
      ts: Date.now(),
    }
    await dbUpdateLead(leadId, {
      colId,
      atividades: [...lead.atividades, act],
      atualizadoEm: Date.now(),
      script: col?.script ?? lead.script,
    })
    await reload()
  }, [leads, reload])

  const addNote = useCallback(async (leadId: string, txt: string, userId: string, userName: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    const act: Activity = {
      id: genId(),
      txt,
      tipo: 'nota',
      autorId: userId,
      autorNome: userName,
      ts: Date.now(),
    }
    await dbUpdateLead(leadId, {
      atividades: [...lead.atividades, act],
      atualizadoEm: Date.now(),
    })
    await reload()
  }, [leads, reload])

  const getPipelineValue = useCallback(() => {
    return leads.reduce((acc, curr) => acc + (curr.valor || 0), 0)
  }, [leads])

  return { leads, loading, add, update, remove, reload, moveColumn, addNote, getPipelineValue }
}
