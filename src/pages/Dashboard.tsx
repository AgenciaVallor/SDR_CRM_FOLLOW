// src/pages/Dashboard.tsx
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Legend } from 'recharts'
import { Phone, Handshake, TrendingUp, DollarSign, AlertTriangle, Clock, CheckCircle2, Calendar } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Avatar } from '../components/ui/Avatar'
import { User, Call } from '../types'
import { getUsers, getCalls, getVisibleUsers } from '../utils/storage'
import { formatCurrency, formatRelativeTime, STATUS_GRUPOS } from '../utils/formatters'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Fix formatRelativeTime import
function relTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(diff/86400000)}d`
}

interface Props {
  user: User
  isAdmin: boolean
  calls: Call[]
  pipelineValue: number
  alerts: any[]
  setPage: (p: string) => void
}

export default function Dashboard({ user, isAdmin, calls, pipelineValue, alerts, setPage }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const users = getVisibleUsers(user, getUsers())

  // Today's calls for current user
  const todayCalls = useMemo(() => calls.filter(c => {
    const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
    return c.operadorId === user.id && d === today
  }), [calls, user.id, today])

  const todayLigacoes = todayCalls.length
  const todayAtendidas = todayCalls.filter(c => STATUS_GRUPOS.positivo.includes(c.status)).length
  const todayPerdidas  = todayCalls.filter(c => STATUS_GRUPOS.perdido.includes(c.status)).length
  const todayContratos = todayCalls.filter(c => c.status === 'contrato-assinado').length
  const todayReunioes  = todayCalls.filter(c => c.reuniaoAgendada).length
  const todayTaxa = todayLigacoes > 0 ? Math.round((todayReunioes / todayLigacoes) * 100) : 0

  // Chart data - last 14 days
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
      const dayCalls = calls.filter(c => {
        const cd = format(new Date(c.timestamp), 'yyyy-MM-dd')
        return cd === d
      })
      return {
        date: format(subDays(new Date(), 13 - i), 'dd/MM', { locale: ptBR }),
        atendidas:   dayCalls.filter(c => STATUS_GRUPOS.positivo.includes(c.status)).length,
        perdidas:    dayCalls.filter(c => STATUS_GRUPOS.perdido.includes(c.status)).length,
        naoAtendeu:  dayCalls.filter(c => STATUS_GRUPOS.semContato.includes(c.status)).length,
        reunioes:    dayCalls.filter(c => c.reuniaoAgendada).length,
        total:       dayCalls.length,
      }
    })
  }, [calls, isAdmin, user.id])

  // Weekly grid
  const weekDays = useMemo(() => {
    return [0,1,2,3,4].map(i => {
      const d = format(subDays(new Date(), 4 - i - (new Date().getDay() - 1 < 0 ? 0 : new Date().getDay() - 1)), 'yyyy-MM-dd')
      const dc = calls.filter(c => c.operadorId === user.id && format(new Date(c.timestamp), 'yyyy-MM-dd') === d)
      return {
        label: format(new Date(d), 'EEE dd', { locale: ptBR }),
        ligacoes: dc.length,
        reunioes: dc.filter(c => c.reuniaoAgendada).length,
        atingiu: dc.length >= 50 && dc.filter(c => c.reuniaoAgendada).length >= 5,
        isToday: d === today,
      }
    })
  }, [calls, user.id, today])

  // Team board (admin)
  const teamData = useMemo(() => {
    if (!isAdmin) return []
    return users.filter(u => u.role === 'vendedor' && u.ativo).map(u => {
      const uc = getCalls().filter(c => c.operadorId === u.id && format(new Date(c.timestamp), 'yyyy-MM-dd') === today)
      const lastTs = uc.length > 0 ? Math.max(...uc.map(c => c.timestamp)) : null
      const lig = uc.length
      const reu = uc.filter(c => c.reuniaoAgendada).length
      const pct = (lig / 50 + reu / 5) / 2 * 100
      const horasInativo = lastTs ? (Date.now() - lastTs) / 3600000 : null
      return { user: u, lig, reu, pct, lastTs, horasInativo }
    }).sort((a, b) => b.pct - a.pct)
  }, [isAdmin, users, today])

  // Recent activity (admin)
  const recentActivity = useMemo(() => {
    if (!isAdmin) return []
    return getCalls()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12)
  }, [isAdmin])

  const kpiCards = [
    {
      label: 'Ligações Hoje',
      value: todayLigacoes,
      max: 50,
      icon: Phone,
      color: todayLigacoes >= 50 ? '#30d090' : todayLigacoes >= 25 ? '#f0c040' : '#e04060',
      suffix: '/ 50'
    },
    {
      label: 'Reuniões Hoje',
      value: todayReunioes,
      max: 5,
      icon: Handshake,
      color: todayReunioes >= 5 ? '#30d090' : '#f0c040',
      suffix: '/ 5'
    },
    {
      label: 'Positivos Hoje',
      value: todayAtendidas,
      max: todayLigacoes || 1,
      icon: CheckCircle2,
      color: '#30d090',
      suffix: ` / ${todayLigacoes}`,
    },
    {
      label: 'Contratos',
      value: todayContratos,
      max: 10,
      icon: TrendingUp,
      color: '#8050d0',
      suffix: '',
    },
  ]

  return (
    <div className="p-6 space-y-6 font-dm">
      {/* === KPI Cards === */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((k, i) => {
          const Icon = k.icon
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="rounded-2xl p-5 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{k.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.color + '20' }}>
                  <Icon size={16} style={{ color: k.color }} />
                </div>
              </div>
              <div className="font-syne font-black text-3xl" style={{ color: k.color }}>
                {k.value}{k.suffix}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>meta: 50 lig • 5 reuniões</p>
              {k.value !== null && (
                <div className="mt-3">
                  <ProgressBar value={(k.value / k.max) * 100} color={k.color} height={4} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* === Chart === */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 rounded-2xl p-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm" style={{ color: 'var(--text)' }}>Ligações — Últimos 14 Dias</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>meta: 50 lig / dia</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <ReferenceLine y={50} stroke="var(--accent)" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="atendidas"  name="Atendidas"   stackId="a" fill="#30d090" radius={[0,0,0,0]} />
              <Bar dataKey="perdidas"   name="Perdidas"    stackId="a" fill="#e04060" radius={[0,0,0,0]} />
              <Bar dataKey="naoAtendeu" name="Sem resposta" stackId="a" fill="#f0c040" radius={[2,2,0,0]} />
              <Line type="monotone" dataKey="reunioes" name="Reuniões" stroke="var(--blue)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* === Weekly mini-grid === */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="font-syne font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Semana Atual</h3>
          <div className="space-y-2">
            {weekDays.map((d, i) => (
              <button
                key={i}
                onClick={() => setPage('semana')}
                className="w-full rounded-xl p-3 border text-left hover:opacity-90 transition-opacity"
                style={{
                  background: d.isToday ? 'rgba(240,192,64,0.08)' : 'var(--surface2)',
                  borderColor: d.isToday ? 'var(--accent)' : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold capitalize" style={{ color: d.isToday ? 'var(--accent)' : 'var(--text)' }}>
                    {d.label}
                  </span>
                  <span className="text-xs" style={{ color: d.atingiu ? 'var(--green)' : 'var(--muted)' }}>
                    {d.atingiu ? '✅' : `${d.ligacoes}/50`}
                  </span>
                </div>
                <ProgressBar
                  value={(d.ligacoes / 50) * 100}
                  height={3}
                  color={d.ligacoes >= 50 ? '#30d090' : d.ligacoes >= 25 ? '#f0c040' : '#e04060'}
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage('semana')}
            className="w-full mt-3 py-2 text-xs font-syne font-semibold rounded-lg"
            style={{ color: 'var(--accent)', background: 'rgba(240,192,64,0.08)' }}
          >
            Ver Semana Completa →
          </button>
        </motion.div>
      </div>

      {/* === Team Thermometer (Admin) === */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-sm" style={{ color: 'var(--text)' }}>🌡️ Termômetro da Equipe — Hoje</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>meta: 50 ligações • 5 reuniões por vendedor</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {teamData.map(({ user: u, lig, reu, pct, horasInativo }) => {
              const statusColor = lig >= 40 ? '#30d090' : lig >= 20 ? '#f0c040' : '#e04060'
              const statusLabel = lig >= 40 ? '🟢 No ritmo' : lig >= 20 ? '🟡 Atenção' : '🔴 Atrasado'
              const inativo = horasInativo !== null && horasInativo > 3
              return (
                <div
                  key={u.id}
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'var(--surface2)',
                    borderColor: inativo ? 'var(--red)' : 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar nome={u.nome} color={u.avatar} size={28} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{u.nome}</p>
                      <p className="text-xs" style={{ color: inativo ? 'var(--red)' : 'var(--muted)' }}>
                        {inativo ? `⚠️ Inativo há ${Math.round(horasInativo!)}h` : statusLabel}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--muted)' }}>Ligações</span>
                      <span style={{ color: 'var(--text)' }}>{lig}/50</span>
                    </div>
                    <ProgressBar value={(lig/50)*100} color={statusColor} height={4} />
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--muted)' }}>Reuniões</span>
                      <span style={{ color: 'var(--text)' }}>{reu}/5</span>
                    </div>
                    <ProgressBar value={(reu/5)*100} color="#30d090" height={4} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* === Recent Activity (Admin) === */}
      {isAdmin && recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="font-syne font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>⚡ Atividade Recente da Equipe</h3>
          <div className="space-y-2">
            {recentActivity.map(c => {
              const u = users.find(u => u.id === c.operadorId)
              return (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  {u && <Avatar nome={u.nome} color={u.avatar} size={24} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text)' }}>
                      <span className="font-semibold">{c.operadorNome}</span>
                      <span style={{ color: 'var(--muted)' }}> • ligação com </span>
                      <span>{c.nome}</span>
                      {c.empresa && <span style={{ color: 'var(--muted)' }}> — {c.empresa}</span>}
                      {c.reuniaoAgendada && <span style={{ color: 'var(--green)' }}> 🤝 reunião agendada</span>}
                    </p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{relTime(c.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
