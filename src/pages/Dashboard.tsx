// src/pages/Dashboard.tsx
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Legend } from 'recharts'
import { Phone, Handshake, TrendingUp, DollarSign, AlertTriangle, Clock, CheckCircle2, Calendar } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Avatar } from '../components/ui/Avatar'
import { User, Call } from '../types'
import { getUsers, getCalls } from '../utils/storage'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getWeekKey } from '../utils/weekUtils'

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

export default function Dashboard({ user: currentUser, isAdmin: isInitialAdmin, calls: allCalls, pipelineValue, alerts, setPage }: Props) {
  const isAdmin   = currentUser?.role === 'admin'
  const isGerente = currentUser?.role === 'gerente'
  const isVendedor= currentUser?.role === 'vendedor'
  const canSeeTeam = isAdmin || isGerente

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = format(new Date(), 'yyyy-MM')
  
  const [users, setUsers] = React.useState<User[]>([])
  const [allCallsState, setAllCallsState] = React.useState<Call[]>(allCalls)

  // Sync prop → state on first render
  React.useEffect(() => { setAllCallsState(allCalls) }, [allCalls])

  // Auto-refresh every 60s
  React.useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([getCalls(), getUsers()]).then(([c, u]) => {
        setAllCallsState(c)
        setUsers(u)
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  const activeVendedores = useMemo(() => {
    return users.filter(u => u.role === 'vendedor' && u.ativo)
  }, [users])

  // Stats Logic
  const visibleCalls = canSeeTeam ? allCallsState : allCallsState.filter(c => c.operadorId === currentUser.id)
  const todayCalls   = visibleCalls.filter(c => format(new Date(c.timestamp), 'yyyy-MM-dd') === today)

  // ── Admin executive computed vars ──────────────────────────────────
  const currentWeekKey = getWeekKey(new Date())
  const monthCalls2    = visibleCalls.filter(c => c.mes === currentMonth)
  const weekCalls      = visibleCalls.filter(c => c.semanaKey === currentWeekKey)

  const teamLigHoje   = todayCalls.length
  const teamReuHoje   = todayCalls.filter(c => c.reuniaoAgendada).length
  const teamMetaLig   = activeVendedores.length * 50
  const teamMetaReu   = activeVendedores.length * 5
  const teamContratos = monthCalls2.filter(c => c.status === 'contrato-assinado').length
  const taxaConv      = teamLigHoje > 0 ? Math.round((teamReuHoje / teamLigHoje) * 100) : 0

  const vendedorStats = useMemo(() => {
    return activeVendedores.map(v => {
      const vCalls    = todayCalls.filter(c => c.operadorId === v.id)
      const allVCalls = allCallsState.filter(c => c.operadorId === v.id)
      const lastCall  = [...allVCalls].sort((a, b) => b.timestamp - a.timestamp)[0]
      const horasInativo = lastCall ? (Date.now() - lastCall.timestamp) / 3600000 : 999
      const hour = new Date().getHours()
      const isBiz = hour >= 8 && hour < 18
      const alert = !isBiz ? 'ok' : vCalls.length === 0 ? 'danger' : horasInativo > 3 ? 'warning' : 'ok'
      return {
        ...v,
        ligHoje:   vCalls.length,
        reuHoje:   vCalls.filter(c => c.reuniaoAgendada).length,
        ligSemana: weekCalls.filter(c => c.operadorId === v.id).length,
        reuSemana: weekCalls.filter(c => c.operadorId === v.id && c.reuniaoAgendada).length,
        contratos: monthCalls2.filter(c => c.operadorId === v.id && c.status === 'contrato-assinado').length,
        taxa:      vCalls.length > 0 ? Math.round((vCalls.filter(c => c.reuniaoAgendada).length / vCalls.length) * 100) : 0,
        horasInativo: Math.round(horasInativo * 10) / 10,
        alert,
        lastActivity: lastCall ? lastCall.timestamp : null,
      }
    }).sort((a, b) => b.ligHoje - a.ligHoje)
  }, [activeVendedores, todayCalls, allCallsState, weekCalls, monthCalls2])

  const nichoStats2 = useMemo(() => {
    const m: Record<string, { lig: number; reu: number; contratos: number }> = {}
    monthCalls2.forEach(c => {
      const n = c.nicho || 'Sem nicho'
      if (!m[n]) m[n] = { lig: 0, reu: 0, contratos: 0 }
      m[n].lig++
      if (c.reuniaoAgendada) m[n].reu++
      if (c.status === 'contrato-assinado') m[n].contratos++
    })
    return Object.entries(m)
      .map(([nome, d]) => ({ nome, ...d, taxa: d.lig > 0 ? Math.round((d.reu / d.lig) * 100) : 0 }))
      .sort((a, b) => b.taxa - a.taxa).slice(0, 8)
  }, [monthCalls2])

  const statsCards = [
    {
      label: canSeeTeam ? 'Ligações da Equipe Hoje' : 'Minhas Ligações Hoje',
      value: `${todayCalls.length}`,
      meta: canSeeTeam
        ? `meta: ${activeVendedores.length * 50} lig total`
        : `meta: 50 lig`,
      icon: Phone,
      color: todayCalls.length >= (canSeeTeam ? activeVendedores.length * 50 : 50) ? 'var(--green)' : todayCalls.length >= (canSeeTeam ? activeVendedores.length * 25 : 25) ? 'var(--accent)' : 'var(--red)',
    },
    {
      label: canSeeTeam ? 'Reuniões Agendadas Hoje' : 'Minhas Reuniões Hoje',
      value: `${todayCalls.filter(c => c.reuniaoAgendada).length}`,
      meta: canSeeTeam
        ? `meta: ${activeVendedores.length * 5} reuniões`
        : `meta: 5 reuniões`,
      icon: Handshake,
      color: 'var(--green)',
    },
    {
      label: 'Taxa de Conversão',
      value: todayCalls.length > 0
        ? `${Math.round((todayCalls.filter(c => c.reuniaoAgendada).length / todayCalls.length) * 100)}%`
        : '0%',
      meta: 'meta: 10%',
      icon: TrendingUp,
      color: 'var(--blue)',
    },
    {
      label: 'Contratos Este Mês',
      value: `${visibleCalls.filter(c => c.status === 'contrato-assinado' && c.mes === currentMonth).length}`,
      meta: 'meta: 20/mês',
      icon: DollarSign,
      color: 'var(--accent)',
    },
  ]

  const monthCalls = useMemo(() => allCallsState.filter(c => c.mes === currentMonth), [allCallsState, currentMonth])

  // Chart: last 14 days
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayCalls = visibleCalls.filter(c => format(new Date(c.timestamp), 'yyyy-MM-dd') === dateStr)
      return {
        date: format(d, 'dd/MM'),
        atendidas:  dayCalls.filter(c => c.status === 'atendida').length,
        perdidas:   dayCalls.filter(c => c.status === 'nao-atendeu').length,
        naoAtendeu: dayCalls.filter(c => !['atendida','nao-atendeu'].includes(c.status)).length,
        reunioes:   dayCalls.filter(c => c.reuniaoAgendada).length,
      }
    })
  }, [visibleCalls])

  // Week mini-grid (vendedor view)
  const weekDays = useMemo(() => {
    const s = new Date()
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(s); d.setDate(d.getDate() + i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayCalls = visibleCalls.filter(c => format(new Date(c.timestamp), 'yyyy-MM-dd') === dateStr)
      return { label: format(d, 'EEEE', { locale: ptBR }), ligacoes: dayCalls.length, atingiu: dayCalls.length >= 50, isToday: dateStr === today }
    })
  }, [visibleCalls, today])

  return (
    <div className="p-6 space-y-6 font-dm">
      {/* === KPI Cards === */}
      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((k, i) => {
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
                {k.value}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{k.meta}</p>
            </motion.div>
          )
        })}
      </div>

      {canSeeTeam && (
        <>
          {/* ── ALERTA DE INATIVIDADE ── */}
          {vendedorStats.some(v => v.alert === 'danger') && (
            <div style={{
              background: 'rgba(224,64,96,0.1)', border: '1px solid rgba(224,64,96,0.3)',
              borderRadius: '10px', padding: '14px 20px', marginBottom: '20px',
              color: 'var(--red)', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              🚨 {vendedorStats.filter(v => v.alert === 'danger').length} vendedor(es) SEM atividade hoje em horário comercial
            </div>
          )}

          {/* ── PAINEL DA EQUIPE HOJE ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px' }}>
                ⚡ Equipe Hoje — {format(new Date(), 'EEEE dd/MM', { locale: ptBR })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Meta total: {teamMetaLig} lig · {teamMetaReu} reuniões
              </div>
            </div>

            {/* Team totals bar */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px 20px', marginBottom: '14px',
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
            }}>
              {[
                { label: 'Ligações Equipe', val: teamLigHoje, meta: teamMetaLig, color: teamLigHoje >= teamMetaLig ? 'var(--green)' : teamLigHoje >= teamMetaLig * 0.5 ? 'var(--accent)' : 'var(--red)' },
                { label: 'Reuniões Equipe', val: teamReuHoje, meta: teamMetaReu, color: teamReuHoje >= teamMetaReu ? 'var(--green)' : 'var(--accent)' },
                { label: 'Taxa Conversão',  val: `${taxaConv}%`, meta: null as null,    color: taxaConv >= 10 ? 'var(--green)' : 'var(--accent)' },
                { label: 'Contratos Mês',   val: teamContratos, meta: 20,          color: teamContratos >= 20 ? 'var(--green)' : 'var(--accent)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                  {s.meta && (
                    <div style={{ marginTop: '6px', height: '3px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.round((Number(s.val) / s.meta) * 100))}%`, background: s.color, borderRadius: '2px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Per-vendedor cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {vendedorStats.map(v => {
                const pLig = Math.min(100, Math.round((v.ligHoje / 50) * 100))
                const pReu = Math.min(100, Math.round((v.reuHoje / 5)  * 100))
                const alertColor = v.alert === 'danger' ? 'var(--red)' : v.alert === 'warning' ? 'var(--accent)' : 'var(--green)'
                const alertLabel = v.alert === 'danger' ? '🔴 Sem atividade' : v.alert === 'warning' ? '🟡 Parado' : '🟢 Ativo'
                return (
                  <div key={v.id} style={{
                    background: 'var(--surface)',
                    border: `1px solid ${v.alert === 'danger' ? 'rgba(224,64,96,0.25)' : 'var(--border)'}`,
                    borderTop: `3px solid ${alertColor}`,
                    borderRadius: '10px', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: v.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '13px', color: '#0a0a0f', flexShrink: 0 }}>
                        {v.nome[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.nome}</div>
                        <div style={{ fontSize: '11px', color: alertColor, fontWeight: 600 }}>
                          {alertLabel}
                          {v.lastActivity && (
                            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>
                              · {v.horasInativo < 1 ? `${Math.round(v.horasInativo * 60)}min atrás` : `${v.horasInativo}h atrás`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: pLig >= 80 ? 'var(--green)' : pLig >= 50 ? 'var(--accent)' : 'var(--red)', lineHeight: 1 }}>{v.ligHoje}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/50 lig</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}><span>📞 LIGAÇÕES</span><span>{pLig}%</span></div>
                        <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pLig}%`, background: pLig >= 80 ? 'var(--green)' : pLig >= 50 ? 'var(--accent)' : 'var(--red)', borderRadius: '2px', transition: 'width 0.6s' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}><span>🤝 REUNIÕES</span><span>{v.reuHoje}/5</span></div>
                        <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pReu}%`, background: pReu >= 100 ? 'var(--green)' : pReu >= 40 ? 'var(--accent)' : 'var(--red)', borderRadius: '2px', transition: 'width 0.6s' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      {[
                        { label: 'Semana lig', val: v.ligSemana },
                        { label: 'Semana reu', val: v.reuSemana },
                        { label: 'Contratos',  val: v.contratos },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>{s.val}</div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── PERFORMANCE POR NICHO ── */}
          {nichoStats2.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', marginBottom: '14px' }}>
                🎯 Performance por Nicho — {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>
                  <span>Nicho</span><span style={{ textAlign: 'center' }}>Lig</span><span style={{ textAlign: 'center' }}>Reu</span><span style={{ textAlign: 'center' }}>Contratos</span><span style={{ textAlign: 'center' }}>Taxa</span>
                </div>
                {nichoStats2.map((n, i) => (
                  <div key={n.nome} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', padding: '11px 16px', borderBottom: i < nichoStats2.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{n.nome}</span>
                    <span style={{ textAlign: 'center', color: 'var(--muted)' }}>{n.lig}</span>
                    <span style={{ textAlign: 'center', color: 'var(--green)' }}>{n.reu}</span>
                    <span style={{ textAlign: 'center', color: 'var(--accent)' }}>{n.contratos}</span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: n.taxa >= 10 ? 'rgba(48,208,144,0.15)' : n.taxa >= 5 ? 'rgba(240,192,64,0.15)' : 'rgba(224,64,96,0.15)', color: n.taxa >= 10 ? 'var(--green)' : n.taxa >= 5 ? 'var(--accent)' : 'var(--red)' }}>
                        {n.taxa}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!canSeeTeam && (
        <>
          {/* Vendedor: chart + weekly grid */}
          <div className="grid grid-cols-3 gap-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2 rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-sm" style={{ color: 'var(--text)' }}>Ligações — Últimos 14 Dias</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>meta: 50 lig / dia</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--text)' }} />
                  <ReferenceLine y={50} stroke="var(--accent)" strokeDasharray="4 4" strokeWidth={1} />
                  <Bar dataKey="atendidas"  name="Atendidas"   stackId="a" fill="#30d090" radius={[0,0,0,0]} />
                  <Bar dataKey="perdidas"   name="Perdidas"    stackId="a" fill="#e04060" radius={[0,0,0,0]} />
                  <Bar dataKey="naoAtendeu" name="Sem resposta" stackId="a" fill="#f0c040" radius={[2,2,0,0]} />
                  <Line type="monotone" dataKey="reunioes" name="Reuniões" stroke="var(--blue)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-syne font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Semana Atual</h3>
              <div className="space-y-2">
                {weekDays.map((d, i) => (
                  <button key={i} onClick={() => setPage('semana')} className="w-full rounded-xl p-3 border text-left hover:opacity-90 transition-opacity" style={{ background: d.isToday ? 'rgba(240,192,64,0.08)' : 'var(--surface2)', borderColor: d.isToday ? 'var(--accent)' : 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold capitalize" style={{ color: d.isToday ? 'var(--accent)' : 'var(--text)' }}>{d.label}</span>
                      <span className="text-xs" style={{ color: d.atingiu ? 'var(--green)' : 'var(--muted)' }}>{d.atingiu ? '✅' : `${d.ligacoes}/50`}</span>
                    </div>
                    <ProgressBar value={(d.ligacoes / 50) * 100} height={3} color={d.ligacoes >= 50 ? '#30d090' : d.ligacoes >= 25 ? '#f0c040' : '#e04060'} />
                  </button>
                ))}
              </div>
              <button onClick={() => setPage('semana')} className="w-full mt-3 py-2 text-xs font-syne font-semibold rounded-lg" style={{ color: 'var(--accent)', background: 'rgba(240,192,64,0.08)' }}>Ver Semana Completa →</button>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
