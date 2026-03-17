// src/pages/FollowUp.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Phone, Check, Calendar, Clock } from 'lucide-react'
import { Call, User } from '../types'
import { updateCall } from '../utils/storage'
import { openWhatsApp } from '../utils/whatsapp'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar } from '../components/ui/Avatar'
import { getUsers, getVisibleUsers } from '../utils/storage'

interface Props {
  calls: Call[]
  user: User
  isAdmin: boolean
  onNewCall: (prefill?: Partial<Call>) => void
  onReload: () => void
}

type Tab = 'atrasados' | 'hoje' | 'semana' | 'concluidos'

export default function FollowUp({ calls, user, isAdmin, onNewCall, onReload }: Props) {
  const [tab, setTab] = useState<Tab>('atrasados')
  const [reagendando, setReagendando] = useState<string | null>(null)
  const [novaData, setNovaData] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')
  const users = getVisibleUsers(user, getUsers())

  const followups = useMemo(() => {
    const base = calls
    const withFollowup = base.filter(c => c.followup && c.followupData)

    if (tab === 'atrasados')  return withFollowup.filter(c => !c.followupFeito && c.followupData! < today).sort((a,b) => a.followupData!.localeCompare(b.followupData!))
    if (tab === 'hoje')       return withFollowup.filter(c => !c.followupFeito && c.followupData === today)
    if (tab === 'semana')     return withFollowup.filter(c => !c.followupFeito && c.followupData! > today)
    if (tab === 'concluidos') return withFollowup.filter(c => c.followupFeito).sort((a,b) => b.timestamp - a.timestamp)
    return []
  }, [calls, tab, user.id, isAdmin, today])

  const counts = useMemo(() => ({
    atrasados: calls
      .filter(c => c.followup && c.followupData && !c.followupFeito && c.followupData < today).length,
    hoje: calls
      .filter(c => c.followup && c.followupData === today && !c.followupFeito).length,
  }), [calls, today])

  const markDone = (id: string) => {
    updateCall(id, { followupFeito: true })
    onReload()
  }

  const reagendar = (id: string) => {
    if (novaData) {
      updateCall(id, { followupData: novaData })
      setReagendando(null)
      setNovaData('')
      onReload()
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'atrasados',  label: '🔴 Atrasados',   count: counts.atrasados },
    { key: 'hoje',       label: '🟡 Hoje',         count: counts.hoje },
    { key: 'semana',     label: '🔵 Esta Semana' },
    { key: 'concluidos', label: '✅ Concluídos' },
  ]

  return (
    <div className="p-6 font-dm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>Follow-up</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {counts.atrasados > 0 && <span style={{ color: 'var(--red)' }}>{counts.atrasados} atrasados • </span>}
            {counts.hoje} para hoje
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: 'var(--surface2)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-sm font-dm flex items-center gap-1.5 transition-all"
            style={{
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--muted)',
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className="text-xs rounded-full w-5 h-5 flex items-center justify-center"
                style={{ background: t.key === 'atrasados' ? 'var(--red)' : 'var(--orange)', color: '#fff', fontSize: 10 }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {followups.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
            <p className="text-4xl mb-3">✅</p>
            <p className="font-dm">Nenhum follow-up {tab === 'concluidos' ? 'concluído ainda' : 'nesta categoria'}.</p>
          </div>
        ) : (
          followups.map(c => {
            const u = users.find(u => u.id === c.operadorId)
            const daysLate = c.followupData ? differenceInDays(new Date(), parseISO(c.followupData)) : 0
            const isLate = daysLate > 0

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-4"
                style={{
                  background: 'var(--surface)',
                  borderColor: isLate ? 'rgba(224,64,96,0.3)' : 'var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 relative"
                      style={{ background: isLate ? 'var(--red)' : tab === 'hoje' ? 'var(--orange)' : 'var(--blue)' }}
                    >
                      {isLate && (
                        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--red)', opacity: 0.5 }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{c.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {c.numero}
                        {c.empresa && ` • ${c.empresa}`}
                      </p>
                      {c.followupNota && (
                        <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>{c.followupNota}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs" style={{ color: isLate ? 'var(--red)' : 'var(--muted)' }}>
                          <Calendar size={12} />
                          {c.followupData && format(parseISO(c.followupData), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {isLate && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--red)' }}>
                            {daysLate}d de atraso
                          </span>
                        )}
                        {u && (
                          <div className="flex items-center gap-1">
                            <Avatar nome={u.nome} color={u.avatar} size={16} />
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>{u.nome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!c.followupFeito && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => onNewCall({ nome: c.nome, numero: c.numero, empresa: c.empresa, leadId: c.leadId })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm border"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(240,192,64,0.08)' }}
                      >
                        <Phone size={12} />
                        Ligar
                      </motion.button>

                      {reagendando === c.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={novaData}
                            onChange={e => setNovaData(e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg w-32"
                          />
                          <button
                            onClick={() => reagendar(c.id)}
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ background: 'var(--blue)', color: '#fff' }}
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReagendando(c.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-dm border"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        >
                          Reagendar
                        </button>
                      )}

                      <button
                        onClick={() => markDone(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-dm"
                        style={{ background: 'rgba(48,208,144,0.15)', color: 'var(--green)' }}
                      >
                        <Check size={12} />
                        Feito
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
