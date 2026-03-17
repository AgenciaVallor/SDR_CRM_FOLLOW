import React, { useState, useEffect } from 'react'
import { getCalls, getUsers } from '@/utils/storage'
import { getWeekKey, getWeekDates } from '@/utils/weekUtils'
import { Call, User } from '@/types'

const META_LIG = 50
const META_REU = 5

export default function MeuTime() {
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje')
  const [allCalls, setAllCalls] = useState<Call[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCalls(), getUsers()]).then(([calls, users]) => {
      setAllCalls(calls)
      setVendedores(users.filter(u => u.role === 'vendedor' && u.ativo))
      setLoading(false)
    })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const weekKey = getWeekKey(new Date())

  function getCallsForPeriod(userId: string) {
    return allCalls.filter(c => {
      if (c.operadorId !== userId) return false
      const d = new Date(c.timestamp)
      const dateStr = d.toISOString().split('T')[0]
      if (period === 'hoje') return dateStr === today
      if (period === 'semana') return c.semanaKey === weekKey
      if (period === 'mes') return c.mes === today.slice(0, 7)
      return false
    })
  }

  function getLastActivity(userId: string): string {
    const userCalls = allCalls
      .filter(c => c.operadorId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
    if (userCalls.length === 0) return 'Sem atividade'
    const diff = Date.now() - userCalls[0].timestamp
    if (diff < 3600000) return `há ${Math.round(diff / 60000)}min`
    if (diff < 86400000) return `há ${Math.round(diff / 3600000)}h`
    return `há ${Math.round(diff / 86400000)}d`
  }

  function getAlertLevel(userId: string): 'ok' | 'warning' | 'danger' {
    const hour = new Date().getHours()
    const isBusinessHours = hour >= 8 && hour < 18
    if (!isBusinessHours) return 'ok'
    const todayCalls = getCallsForPeriod(userId)
    if (period !== 'hoje') return 'ok'
    if (todayCalls.length === 0) return 'danger'
    const last = allCalls
      .filter(c => c.operadorId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    if (!last) return 'danger'
    const hoursIdle = (Date.now() - last.timestamp) / 3600000
    if (hoursIdle > 3) return 'warning'
    return 'ok'
  }

  const alertColors = { ok: 'var(--green)', warning: 'var(--accent)', danger: 'var(--red)' }
  const alertLabels = { ok: 'Ativo', warning: 'Parado', danger: 'Sem atividade' }

  if (loading) return <div className="p-8 text-center text-muted">Carregando meu time...</div>

  return (
    <div style={{ padding: '32px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.5px' }}>
            👁️ Meu Time
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            Acompanhamento em tempo real da equipe de vendas.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['hoje', 'semana', 'mes'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: period === p ? 'var(--accent)' : 'var(--s2)',
              color: period === p ? '#0a0a0f' : 'var(--muted)',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      {vendedores.some(v => getAlertLevel(v.id) === 'danger') && period === 'hoje' && (
        <div style={{
          background: 'rgba(224,64,96,0.1)', border: '1px solid rgba(224,64,96,0.3)',
          borderRadius: '10px', padding: '14px 20px', marginBottom: '20px',
          color: 'var(--red)', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          🚨 {vendedores.filter(v => getAlertLevel(v.id) === 'danger').length} SDR(es) sem atividade hoje em horário comercial.
        </div>
      )}

      {/* Team cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {vendedores.map(vendedor => {
          const calls = getCallsForPeriod(vendedor.id)
          const lig = calls.length
          const reu = calls.filter(c => c.reuniaoAgendada).length
          const atendidas = calls.filter(c =>
            ['atendida','conversa-iniciada','retornar-depois','reuniao-agendada','follow-up','contrato-assinado'].includes(c.status)
          ).length
          const pLig = Math.min(100, Math.round((lig / META_LIG) * 100))
          const pReu = Math.min(100, Math.round((reu / META_REU) * 100))
          const alert = getAlertLevel(vendedor.id)
          const lastActivity = getLastActivity(vendedor.id)

          return (
            <div key={vendedor.id} style={{
              background: 'var(--s1)', border: `1px solid ${alert === 'danger' ? 'rgba(224,64,96,0.3)' : 'var(--border)'}`,
              borderRadius: '10px', overflow: 'hidden',
              borderTop: `3px solid ${alertColors[alert]}`,
            }}>
              {/* Card header */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: vendedor.avatar, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: '15px', color: '#0a0a0f', flexShrink: 0,
                }}>
                  {vendedor.nome[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{vendedor.nome}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Última atividade: {lastActivity}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  background: `${alertColors[alert]}22`, color: alertColors[alert],
                }}>
                  {alertLabels[alert]}
                </span>
              </div>

              {/* Metrics */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '11px', marginBottom: '5px',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>📞 Ligações</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: pLig >= 80 ? 'var(--green)' : pLig >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                      {lig} / {META_LIG}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--s3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${pLig}%`,
                      background: pLig >= 80 ? 'var(--green)' : pLig >= 50 ? 'var(--accent)' : 'var(--red)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '11px', marginBottom: '5px',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🤝 Reuniões</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: pReu >= 100 ? 'var(--green)' : pReu >= 40 ? 'var(--accent)' : 'var(--red)' }}>
                      {reu} / {META_REU}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--s3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${pReu}%`,
                      background: pReu >= 100 ? 'var(--green)' : pReu >= 40 ? 'var(--accent)' : 'var(--red)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex', gap: '8px', paddingTop: '6px',
                  borderTop: '1px solid var(--border)', fontSize: '12px',
                }}>
                  <span style={{ color: 'var(--muted)' }}>Atendidas: <strong style={{ color: 'var(--text)' }}>{atendidas}</strong></span>
                  <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
                    Taxa: <strong style={{ color: 'var(--text)' }}>{lig > 0 ? Math.round((reu / lig) * 100) : 0}%</strong>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
