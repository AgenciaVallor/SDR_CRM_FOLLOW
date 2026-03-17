// src/pages/Ranking.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { User } from '../types'
import { getCalls, getUsers, getVisibleUsers } from '../utils/storage'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Avatar } from '../components/ui/Avatar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { formatRelativeTime } from '../utils/formatters'

function relTime(ts: number | null): string {
  if (!ts) return '—'
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
}

type Period = 'hoje' | 'semana' | 'mes' | 'total'

export default function Ranking({ user }: Props) {
  const [period, setPeriod] = useState<Period>('semana')
  const users = getVisibleUsers(user, getUsers()).filter(u => u.role === 'vendedor' && u.ativo)

  const today = format(new Date(), 'yyyy-MM-dd')

  const getRange = () => {
    if (period === 'hoje') return { from: today, to: today }
    if (period === 'semana') return {
      from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
    if (period === 'mes') return {
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }
    return { from: '2000-01-01', to: '2099-12-31' }
  }

  const ranking = useMemo(() => {
    const { from, to } = getRange()
    const allCalls = getCalls()

    return users.map(u => {
      const userCalls = allCalls.filter(c => {
        const d = format(new Date(c.timestamp), 'yyyy-MM-dd')
        return c.operadorId === u.id && d >= from && d <= to
      })
      const todayCalls = allCalls.filter(c => c.operadorId === u.id && format(new Date(c.timestamp), 'yyyy-MM-dd') === today)
      const lastTs = todayCalls.length > 0 ? Math.max(...todayCalls.map(c => c.timestamp)) : null
      const lig = userCalls.length
      const reu = userCalls.filter(c => c.reuniaoAgendada).length
      const taxa = lig > 0 ? Math.round((reu / lig) * 100) : 0
      const metaDias = period === 'hoje' ? 1 : period === 'semana' ? 5 : period === 'mes' ? 22 : 1
      const metaLig = 50 * metaDias
      const pct = metaLig > 0 ? Math.round((lig / metaLig) * 100) : 0
      return { user: u, lig, reu, taxa, pct, lastTs, semAtividade: todayCalls.length === 0 }
    }).sort((a, b) => b.lig - a.lig)
  }, [users, period, today])

  const medalhas = ['🥇', '🥈', '🥉']

  return (
    <div className="p-6 font-dm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>🏆 Ranking da Equipe</h1>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface2)' }}>
          {(['hoje', 'semana', 'mes', 'total'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-sm font-dm capitalize transition-all"
              style={{ background: period === p ? 'var(--surface)' : 'transparent', color: period === p ? 'var(--text)' : 'var(--muted)', fontWeight: period === p ? 600 : 400 }}
            >
              {p === 'total' ? 'Total' : p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {ranking.slice(0, 3).map((r, i) => {
          const podiumOrder = [1, 0, 2]
          const actual = ranking[podiumOrder[i]]
          if (!actual) return null
          const height = i === 0 ? 140 : i === 1 ? 200 : 110
          return (
            <motion.div
              key={actual.user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: podiumOrder[i] * 0.1 }}
              className="flex flex-col items-center"
              style={{ order: i }}
            >
              <span className="text-2xl mb-1">{medalhas[podiumOrder[i]]}</span>
              <Avatar nome={actual.user.nome} color={actual.user.avatar} size={podiumOrder[i] === 0 ? 52 : 40} />
              <p className="font-syne font-bold text-sm mt-2" style={{ color: 'var(--text)' }}>{actual.user.nome}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{actual.lig} ligações</p>
              <div
                className="w-20 mt-2 rounded-t-xl flex items-end justify-center"
                style={{
                  height,
                  background: podiumOrder[i] === 0 ? 'rgba(240,192,64,0.2)' : podiumOrder[i] === 1 ? 'rgba(192,192,192,0.15)' : 'rgba(205,127,50,0.15)',
                  border: `1px solid ${podiumOrder[i] === 0 ? '#f0c04060' : '#55558060'}`,
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border p-5 mb-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h3 className="font-syne font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Ligações vs Meta</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={ranking} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="user.nome" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="lig" name="Ligações" radius={4}>
              {ranking.map((r, i) => (
                <Cell key={r.user.id} fill={i === 0 ? 'var(--accent)' : i === 1 ? '#a0a0c0' : '#7070a0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Pos', 'Vendedor', 'Ligações', 'Meta%', 'Reuniões', 'Taxa Conv.', 'Último Registro'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-syne font-bold" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr
                key={r.user.id}
                className="border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: r.semAtividade && period === 'hoje' ? 'rgba(224,64,96,0.05)' : i%2===0 ? 'var(--surface)' : 'var(--surface2)',
                }}
              >
                <td className="px-4 py-3">
                  <span className="font-syne font-black text-lg">{medalhas[i] ?? `#${i+1}`}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar nome={r.user.nome} color={r.user.avatar} size={28} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.user.nome}</p>
                      {r.semAtividade && period === 'hoje' && (
                        <p className="text-xs" style={{ color: 'var(--red)' }}>💤 Sem atividade hoje</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-syne font-bold text-lg" style={{ color: 'var(--accent)' }}>{r.lig}</p>
                </td>
                <td className="px-4 py-3 w-32">
                  <div className="space-y-1">
                    <p className="text-xs font-dm" style={{ color: 'var(--text)' }}>{r.pct}%</p>
                    <ProgressBar
                      value={r.pct}
                      height={4}
                      color={r.pct >= 100 ? '#30d090' : r.pct >= 50 ? '#f0c040' : '#e04060'}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-syne font-bold text-lg" style={{ color: 'var(--green)' }}>{r.reu}</p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>{r.taxa}%</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{relTime(r.lastTs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
