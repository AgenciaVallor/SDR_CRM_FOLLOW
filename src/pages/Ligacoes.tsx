// src/pages/Ligacoes.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Phone, Search, Filter, MessageCircle } from 'lucide-react'
import { Call, User } from '../types'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { openWhatsApp } from '../utils/whatsapp'
import { STATUS_COLORS, STATUS_LABELS } from '../utils/formatters'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getUsers } from '../utils/storage'

interface Props {
  calls: Call[]
  user: User
  isAdmin: boolean
  onNewCall: () => void
}

type Tab = 'hoje' | 'semana' | 'mes'

export default function Ligacoes({ calls, user, isAdmin, onNewCall }: Props) {
  const [tab, setTab] = useState<Tab>('hoje')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [filterReuniao, setFilterReuniao] = useState('')

  const users = getUsers()
  const today = format(new Date(), 'yyyy-MM-dd')

  const filteredCalls = useMemo(() => {
    let base = isAdmin ? calls : calls.filter(c => c.operadorId === user.id)

    // Tab filter
    if (tab === 'hoje') {
      base = base.filter(c => format(new Date(c.timestamp), 'yyyy-MM-dd') === today)
    } else if (tab === 'semana') {
      const mon = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const sun = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      base = base.filter(c => {
        const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
        return d >= mon && d <= sun
      })
    } else {
      const mon = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const sun = format(endOfMonth(new Date()), 'yyyy-MM-dd')
      base = base.filter(c => {
        const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
        return d >= mon && d <= sun
      })
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      base = base.filter(c =>
        c.nome.toLowerCase().includes(q) ||
        c.numero.includes(q) ||
        c.empresa.toLowerCase().includes(q)
      )
    }
    if (filterStatus) base = base.filter(c => c.status === filterStatus)
    if (filterOp)     base = base.filter(c => c.operadorId === filterOp)
    if (filterReuniao === 'sim') base = base.filter(c => c.reuniaoAgendada)
    if (filterReuniao === 'nao') base = base.filter(c => !c.reuniaoAgendada)

    return base.sort((a, b) => b.timestamp - a.timestamp)
  }, [calls, tab, search, filterStatus, filterOp, filterReuniao, today, isAdmin, user.id])

  // Group by day for weekly view
  const grouped = useMemo(() => {
    if (tab !== 'semana') return null
    const groups: Record<string, Call[]> = {}
    filteredCalls.forEach(c => {
      const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
      if (!groups[d]) groups[d] = []
      groups[d].push(c)
    })
    return groups
  }, [filteredCalls, tab])

  const stats = useMemo(() => ({
    feitas:    filteredCalls.length,
    atendidas: filteredCalls.filter(c => c.status === 'atendida').length,
    reunioes:  filteredCalls.filter(c => c.reuniaoAgendada).length,
  }), [filteredCalls])

  return (
    <div className="p-6 font-dm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>Ligações</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {stats.feitas} feitas • {stats.atendidas} atendidas • {stats.reunioes} reuniões
          </p>
        </div>
        <motion.button
          onClick={onNewCall}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-syne font-bold"
          style={{ background: 'var(--accent)', color: '#0a0a0f' }}
        >
          <Phone size={14} />
          + Registrar Ligação
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-xl p-1 w-fit" style={{ background: 'var(--surface2)' }}>
        {(['hoje', 'semana', 'mes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-dm capitalize transition-all"
            style={{
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === 'hoje' ? 'Hoje' : t === 'semana' ? 'Esta Semana' : 'Este Mês'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, número, empresa..."
            className="w-full pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg"
        >
          <option value="">Todos os status</option>
          <optgroup label="── CONTATO FEITO ──">
            <option value="atendida">✅ Atendida</option>
            <option value="conversa-iniciada">📞 Conversa Iniciada</option>
            <option value="retornar-depois">⏰ Retornar Depois</option>
            <option value="reuniao-agendada">🤝 Reunião Agendada</option>
            <option value="follow-up">🔄 Follow-up</option>
            <option value="contrato-assinado">✍️ Contrato Assinado</option>
          </optgroup>
          <optgroup label="── SEM CONTATO ──">
            <option value="nao-atendeu">❌ Não Atendeu</option>
            <option value="caixa-postal">📬 Caixa Postal</option>
          </optgroup>
          <optgroup label="── PERDIDO ──">
            <option value="perdido-tem-empresa">🏳 Já Tem Empresa</option>
            <option value="perdido-desqualificado">⛔ Desqualificado</option>
            <option value="perdida">❌ Perdida</option>
          </optgroup>
        </select>
        {isAdmin && (
          <select
            value={filterOp}
            onChange={e => setFilterOp(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg"
          >
            <option value="">Todos os colaboradores</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
            ))}
          </select>
        )}
        <select
          value={filterReuniao}
          onChange={e => setFilterReuniao(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg"
        >
          <option value="">Com/Sem reunião</option>
          <option value="sim">Com reunião</option>
          <option value="nao">Sem reunião</option>
        </select>
      </div>

      {/* Content */}
      {tab === 'semana' && grouped ? (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayCalls]) => {
              const dayReunioes = dayCalls.filter(c => c.reuniaoAgendada).length
              return (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-syne font-bold capitalize text-sm" style={{ color: 'var(--text)' }}>
                      {format(new Date(date), "EEEE • dd/MM", { locale: ptBR })}
                    </h3>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs font-dm" style={{ color: 'var(--muted)' }}>
                      {dayCalls.length} ligações
                      {dayReunioes > 0 && <span style={{ color: 'var(--green)' }}> • {dayReunioes} reuniões</span>}
                      {dayCalls.length >= 50 && <span style={{ color: 'var(--green)' }}> ✅</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {dayCalls.map(c => (
                      <CallCard key={c.id} call={c} users={users} />
                    ))}
                  </div>
                </div>
              )
            })
          }
        </div>
      ) : (
        /* Table view */
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Contato', 'Empresa', 'Status', 'Reunião', 'Anotação', 'Hora', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-syne font-bold" style={{ color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b transition-colors hover:opacity-90"
                  style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{c.nome}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.numero}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{c.empresa || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.reuniaoAgendada ? (
                      <span style={{ color: 'var(--green)' }}>✅ {c.reuniaoData} {c.reuniaoHora}</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs">
                    {c.anotacao ? (
                      <span style={{ color: 'var(--muted)' }} title={c.anotacao}>
                        {c.anotacao.slice(0, 60)}{c.anotacao.length > 60 ? '…' : ''}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--border)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {format(new Date(c.timestamp), 'HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openWhatsApp(c.numero)}
                      title="Abrir WhatsApp"
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <MessageCircle size={14} style={{ color: 'var(--green)' }} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>
                    Nenhuma ligação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CallCard({ call: c, users }: { call: Call; users: User[] }) {
  const u = users.find(u => u.id === c.operadorId)
  const borderColor = STATUS_COLORS[c.status]

  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {c.reuniaoAgendada && '🤝 '}{c.nome}
          </p>
          {c.empresa && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{c.empresa}</p>}
        </div>
        <Badge color={borderColor} size="sm">{STATUS_LABELS[c.status]}</Badge>
      </div>
      {c.anotacao && (
        <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
          {c.anotacao}
        </p>
      )}
    </div>
  )
}
