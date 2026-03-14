// src/hooks/useMeetings.ts
import { useState, useCallback } from 'react'
import { Lead, Meeting, Activity } from '../types'
import { getLeads, updateLead } from '../utils/storage'
import { genId } from '../utils/storage'

export function useMeetings(userId?: string, isAdmin?: boolean) {
  const [leads, setLeads] = useState<Lead[]>(() => getLeads())

  const reload = useCallback(() => setLeads(getLeads()), [])

  // Get all meetings across all leads
  const getAllMeetings = useCallback((): Array<Meeting & { lead: Lead }> => {
    const all = getLeads()
    const result: Array<Meeting & { lead: Lead }> = []
    for (const lead of all) {
      if (!isAdmin && userId && lead.responsavelId !== userId) continue
      for (const m of lead.reunioes) {
        result.push({ ...m, lead })
      }
    }
    return result.sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora))
  }, [userId, isAdmin])

  const addMeeting = useCallback((leadId: string, meeting: Omit<Meeting, 'id' | 'criadoEm'>, userId: string, userName: string) => {
    const lead = getLeads().find(l => l.id === leadId)
    if (!lead) return
    const newMeeting: Meeting = { ...meeting, id: genId(), criadoEm: Date.now() }
    const act: Activity = {
      id: genId(),
      txt: `Reunião agendada para ${meeting.data} às ${meeting.hora}`,
      tipo: 'reuniao',
      autorId: userId,
      autorNome: userName,
      ts: Date.now(),
    }
    updateLead(leadId, {
      reunioes: [...lead.reunioes, newMeeting],
      atividades: [...lead.atividades, act],
      atualizadoEm: Date.now(),
    })
    reload()
  }, [reload])

  const updateMeeting = useCallback((leadId: string, meetingId: string, patch: Partial<Meeting>) => {
    const lead = getLeads().find(l => l.id === leadId)
    if (!lead) return
    updateLead(leadId, {
      reunioes: lead.reunioes.map(m => m.id === meetingId ? { ...m, ...patch } : m),
      atualizadoEm: Date.now(),
    })
    reload()
  }, [reload])

  const getMeetingsForRange = useCallback((from: string, to: string): Array<Meeting & { lead: Lead }> => {
    return getAllMeetings().filter(m => m.data >= from && m.data <= to)
  }, [getAllMeetings])

  return { leads, reload, getAllMeetings, addMeeting, updateMeeting, getMeetingsForRange }
}
