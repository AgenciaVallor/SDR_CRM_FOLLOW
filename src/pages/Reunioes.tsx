// src/pages/Reunioes.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Meeting } from '../types'
import { getLeads, getUsers, updateLead, getVisibleUsers, getReunioes } from '../utils/storage'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { LOCAL_LABELS } from '../utils/formatters'

interface Props {
  user: User
  isAdmin: boolean
}

export default function Reunioes({ user, isAdmin }: Props) {
  const [tab, setTab] = useState<'lista' | 'calendario'>('lista')
  const [filterStatus, setFilterStatus] = useState('')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleUsers, setVisibleUsers] = useState<User[]>([])
  
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = format(new Date(), 'yyyy-MM')

  async function loadMeetings() {
    setLoading(true)
    const [mdata, udata] = await Promise.all([getReunioes(), getUsers()])
    setMeetings(mdata)
    setVisibleUsers(getVisibleUsers(user, udata))
    setLoading(false)
  }

  React.useEffect(() => {
    loadMeetings()
  }, [])

  async function updateMeetingStatus(id: string, status: string) {
    await supabase.from('reunioes').update({ status }).eq('id', id)
    loadMeetings()
  }

  const filtered = useMemo(() => {
    let list = filterStatus ? meetings.filter(m => m.status === filterStatus) : meetings
    if (user.role === 'vendedor') {
      list = list.filter(m => m.responsavelId === user.id)
    }
    return list
  }, [meetings, filterStatus, user])

  const monthMeetings = useMemo(() => {
    return meetings.filter(m => format(parseISO(m.data), 'yyyy-MM') === currentMonth)
  }, [meetings, currentMonth])

  const stats = [
    { label: 'Agendadas no Mês',  value: monthMeetings.length,                                              color: 'var(--blue)'   },
    { label: 'Realizadas',        value: monthMeetings.filter(m => m.status === 'realizada').length,        color: 'var(--green)'  },
    { label: 'Canceladas',        value: monthMeetings.filter(m => m.status === 'cancelada').length,        color: 'var(--red)'    },
    { label: 'Taxa de Show',      value: monthMeetings.length > 0
        ? `${Math.round((monthMeetings.filter(m => m.status === 'realizada').length / monthMeetings.filter(m => m.status !== 'agendada').length) * 100) || 0}%`
        : '—',                                                                                               color: 'var(--accent)' },
  ]

  const todayMeetings = meetings.filter(m => m.data === today)
  const weekMeetings  = meetings.filter(m => m.data >= today && m.data <= format(addDays(new Date(), 7), 'yyyy-MM-dd'))

  function MeetingStatusBadge({ meeting, onUpdate }: {
    meeting: any
    onUpdate: (id: string, status: string) => void
  }) {
    const isPast = meeting.data < today
    const isToday = meeting.data === today

    const statusConfig: any = {
      agendada:   { label: '📅 Agendada',   color: 'var(--blue)',   bg: 'rgba(64,128,240,0.15)' },
      realizada:  { label: '✅ Realizada',   color: 'var(--green)',  bg: 'rgba(48,208,144,0.15)' },
      cancelada:  { label: '❌ Cancelada',   color: 'var(--red)',    bg: 'rgba(224,64,96,0.15)'  },
      remarcada:  { label: '🔄 Remarcada',   color: 'var(--accent)', bg: 'rgba(240,192,64,0.15)' },
    }

    const config = statusConfig[meeting.status] || statusConfig.agendada

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          padding: '3px 10px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          background: config.bg, color: config.color,
        }}>
          {config.label}
        </span>

        {meeting.status === 'agendada' && (isPast || isToday) && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onUpdate(meeting.id, 'realizada')} style={{
              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(48,208,144,0.1)', border: '1px solid rgba(48,208,144,0.3)',
              color: 'var(--green)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>✅ Realizada</button>
            <button onClick={() => onUpdate(meeting.id, 'cancelada')} style={{
              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(224,64,96,0.1)', border: '1px solid rgba(224,64,96,0.3)',
              color: 'var(--red)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>❌ Cancelou</button>
            <button onClick={() => onUpdate(meeting.id, 'remarcada')} style={{
              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)',
              color: 'var(--accent)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>🔄 Remarcou</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 font-dm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>Reuniões</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {todayMeetings.length} hoje • {weekMeetings.length} esta semana
          </p>
        </div>
        <div className="flex gap-3">
          {stats.map(k => (
            <div key={k.label} className="rounded-xl px-4 py-2 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-lg font-syne font-black" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: 'var(--surface2)' }}>
        <button onClick={() => setTab('lista')} className="px-4 py-1.5 rounded-lg text-sm font-dm transition-all" style={{ background: tab === 'lista' ? 'var(--surface)' : 'transparent', color: tab === 'lista' ? 'var(--text)' : 'var(--muted)', fontWeight: tab === 'lista' ? 600 : 400 }}>📋 Lista</button>
        <button onClick={() => setTab('calendario')} className="px-4 py-1.5 rounded-lg text-sm font-dm transition-all" style={{ background: tab === 'calendario' ? 'var(--surface)' : 'transparent', color: tab === 'calendario' ? 'var(--text)' : 'var(--muted)', fontWeight: tab === 'calendario' ? 600 : 400 }}>📅 Próximos 7 Dias</button>
      </div>

      {tab === 'lista' ? (
        <div>
          <div className="flex gap-3 mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm px-3 py-2 rounded-lg">
              <option value="">Todos os status</option>
              <option value="agendada">Agendada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="remarcada">Remarcada</option>
            </select>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  {['Lead', 'Data', 'Hora', 'Local', 'Responsável', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-syne font-bold" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const resp = visibleUsers.find(u => u.id === m.responsavelId)
                  return (
                    <tr key={m.id} className="border-b" style={{ borderColor: 'var(--border)', background: i%2===0 ? 'var(--surface)' : 'var(--surface2)' }}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{m.leadNome}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{m.leadEmpresa}</div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text)' }}>
                        {format(parseISO(m.data), "dd/MM/yyyy", { locale: ptBR })}
                        {m.data === today && <span className="ml-1 text-accent" style={{ color: 'var(--accent)', fontWeight: 700 }}>HOJE</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text)' }}>{m.hora}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{LOCAL_LABELS[m.local] ?? m.local}</td>
                      <td className="px-4 py-3">
                        {resp && <div className="flex items-center gap-1.5"><Avatar nome={resp.nome} color={resp.avatar} size={20} /><span className="text-xs" style={{ color: 'var(--muted)' }}>{resp.nome}</span></div>}
                      </td>
                      <td className="px-4 py-3">
                        <MeetingStatusBadge meeting={m} onUpdate={updateMeetingStatus} />
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>Nenhuma reunião encontrada.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>Carregando...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => {
            const d = format(addDays(new Date(), i), 'yyyy-MM-dd')
            const dm = meetings.filter(m => m.data === d)
            return (
              <div key={d}>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-syne font-bold text-sm capitalize" style={{ color: i === 0 ? 'var(--accent)' : 'var(--text)' }}>
                    {i === 0 ? 'HOJE' : format(parseISO(d), "EEEE, dd/MM", { locale: ptBR })}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{dm.length} {dm.length === 1 ? 'reunião' : 'reuniões'}</span>
                </div>
                {dm.length === 0 ? (
                  <p className="text-xs pl-2" style={{ color: 'var(--border)' }}>Nenhuma reunião</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {dm.map(m => {
                      const resp = visibleUsers.find(u => u.id === m.responsavelId)
                      return (
                        <div key={m.id} className="rounded-xl border p-3" style={{ background: 'var(--surface)', borderColor: 'rgba(64,128,240,0.3)', borderLeft: '3px solid var(--blue)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{m.leadNome}</p>
                            <span className="text-sm font-syne font-bold" style={{ color: 'var(--accent)' }}>{m.hora}</span>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{m.leadEmpresa}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>{LOCAL_LABELS[m.local] ?? m.local}</span>
                            {resp && <div className="flex items-center gap-1"><Avatar nome={resp.nome} color={resp.avatar} size={18} /><span className="text-xs" style={{ color: 'var(--muted)' }}>{resp.nome}</span></div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
