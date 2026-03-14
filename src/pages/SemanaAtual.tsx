// src/pages/SemanaAtual.tsx — MÓDULO PRINCIPAL
import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Phone, Handshake, X,
  CheckCircle2, AlertTriangle, Clock, BarChart2, Save, Loader
} from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { User, Call, DiaStatus } from '../types'
import { getCalls } from '../utils/storage'
import {
  getWeekKey, getWeekDates, getWeekLabel, isTodayDate,
  prevWeekKey, nextWeekKey, getCurrentWeekKey, isThisWeek,
  getMesLabel, getSemanaNumber, startOfDayTs, endOfDayTs,
  getDateForWeekDay
} from '../utils/weekUtils'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { findSemana, addSemana, updateSemana, genId } from '../utils/storage'
import { makeRegistroSemanal } from '../hooks/useWeek'
import { getStatusDia } from '../hooks/useCalls'

const STATUS_COLOR: Record<DiaStatus, string> = {
  meta_batida:  '#30d090',
  meta_parcial: '#f0c040',
  abaixo:       '#e04060',
  em_andamento: '#4080f0',
  pendente:     '#2a2a3a',
}

const STATUS_ICON: Record<DiaStatus, string> = {
  meta_batida:  '✅',
  meta_parcial: '🟡',
  abaixo:       '🔴',
  em_andamento: '🔵',
  pendente:     '⚪',
}

interface DayStats {
  ligacoes: number
  reunioes: number
  atendidas: number
  status: DiaStatus
  calls: Call[]
}

interface Props {
  user: User
  isAdmin: boolean
  users: User[]
  onNewCall: (date?: string) => void
}

export default function SemanaAtual({ user, isAdmin, users, onNewCall }: Props) {
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey)
  const [selectedUserId, setSelectedUserId] = useState(user.id)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [anotacaoDia, setAnotacaoDia] = useState<Record<string, string>>({})
  const [sabadoData, setSabadoData] = useState<{ aprendizados: string; plano: string; revisao: string }>({ aprendizados: '', plano: '', revisao: '' })
  const [saving, setSaving] = useState<string | null>(null)

  const weekLabel = getWeekLabel(weekKey)
  const mesLabel = getMesLabel(weekKey)
  const semanaNum = getSemanaNumber(weekKey)
  const isCurrentWeek = isThisWeek(weekKey)

  const weekDates = useMemo(() => getWeekDates(weekKey), [weekKey])

  // Get day stats
  const getDayStats = useCallback((dateStr: string): DayStats => {
    const start = startOfDayTs(dateStr)
    const end = endOfDayTs(dateStr)
    const ds = getCalls().filter(c =>
      c.operadorId === selectedUserId &&
      c.timestamp >= start &&
      c.timestamp <= end
    )
    const ligacoes = ds.length
    const reunioes = ds.filter(c => c.reuniaoAgendada).length
    return {
      ligacoes,
      reunioes,
      atendidas: ds.filter(c => c.status === 'atendida').length,
      status: getStatusDia(ligacoes, reunioes),
      calls: ds,
    }
  }, [selectedUserId])

  // Get annotations from storage
  const getSemanaRecord = useCallback(() => {
    return findSemana(selectedUserId, weekKey)
  }, [selectedUserId, weekKey])

  const getAnotacao = (dia: string) => {
    const rec = getSemanaRecord()
    if (!rec) return anotacaoDia[dia] ?? ''
    return (rec.dias as any)[dia]?.anotacao_dia ?? anotacaoDia[dia] ?? ''
  }

  const saveAnotacao = async (dia: string, value: string) => {
    setSaving(dia)
    let rec = findSemana(selectedUserId, weekKey)
    if (!rec) {
      rec = makeRegistroSemanal(selectedUserId, weekKey)
      addSemana(rec)
    }
    updateSemana(rec.id, {
      dias: {
        ...rec.dias,
        [dia]: { ...(rec.dias as any)[dia], anotacao_dia: value },
      },
    })
    setAnotacaoDia(prev => ({ ...prev, [dia]: value }))
    await new Promise(r => setTimeout(r, 300))
    setSaving(null)
  }

  // Week totals
  const weekStats = useMemo(() => {
    let totalLig = 0, totalReu = 0
    weekDates.filter(d => d.dia !== 'sabado').forEach(d => {
      const s = getDayStats(d.date)
      totalLig += s.ligacoes
      totalReu += s.reunioes
    })
    return { totalLig, totalReu }
  }, [weekDates, getDayStats])

  const selectedDayStats = selectedDay ? getDayStats(selectedDay) : null

  return (
    <div className="h-full flex">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-syne font-black text-2xl" style={{ color: 'var(--text)' }}>{weekLabel}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Meta: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>250 ligações</span>
              {' • '}
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>25 agendamentos</span>
              {' esta semana'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="text-sm rounded-lg px-3 py-2"
              >
                {users.filter(u => u.role === 'vendedor' && u.ativo).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekKey(k => prevWeekKey(k))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <ChevronLeft size={16} />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={() => setWeekKey(getCurrentWeekKey())}
                  className="px-3 py-1.5 rounded-lg text-xs font-dm border"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(240,192,64,0.08)' }}
                >
                  Hoje
                </button>
              )}
              <button
                onClick={() => setWeekKey(k => nextWeekKey(k))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Day grid */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {weekDates.filter(d => d.dia !== 'sabado').map(({ dia, date, label }, i) => {
            const stats = getDayStats(date)
            const isToday = isTodayDate(date)
            const isFuture = new Date(date) > new Date()
            const color = isFuture ? 'var(--muted)' : STATUS_COLOR[stats.status]
            const anotacao = getAnotacao(dia)

            return (
              <motion.div
                key={dia}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDay(date)}
                className="rounded-2xl border cursor-pointer hover:opacity-90 transition-all"
                style={{
                  background: 'var(--surface)',
                  borderColor: isToday ? 'var(--accent)' : selectedDay === date ? 'var(--blue)' : STATUS_COLOR[stats.status] + '40',
                  boxShadow: isToday ? '0 0 0 1px var(--accent)' : 'none',
                }}
              >
                {/* Card header */}
                <div
                  className="rounded-t-2xl px-4 py-2.5 flex items-center justify-between"
                  style={{
                    background: isFuture ? 'var(--surface2)' : STATUS_COLOR[stats.status] + '15',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <p className="text-xs font-syne font-bold uppercase tracking-wider" style={{ color }}>
                      {label}
                    </p>
                    <p className="text-xs font-dm" style={{ color: 'var(--muted)' }}>
                      {format(parseISO(date), "dd/MM", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="text-lg">{isFuture ? '⚪' : STATUS_ICON[stats.status]}</span>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Ligações */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--muted)' }}>📞 Ligações</span>
                      <span style={{ color: isFuture ? 'var(--muted)' : 'var(--text)', fontWeight: 600 }}>
                        {stats.ligacoes}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/50</span>
                      </span>
                    </div>
                    <ProgressBar
                      value={isFuture ? 0 : (stats.ligacoes / 50) * 100}
                      color={isFuture ? 'var(--surface3)' : stats.ligacoes >= 50 ? '#30d090' : stats.ligacoes >= 25 ? '#f0c040' : '#e04060'}
                      height={5}
                    />
                  </div>

                  {/* Reuniões */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--muted)' }}>🤝 Reuniões</span>
                      <span style={{ color: isFuture ? 'var(--muted)' : 'var(--text)', fontWeight: 600 }}>
                        {stats.reunioes}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/5</span>
                      </span>
                    </div>
                    <ProgressBar
                      value={isFuture ? 0 : (stats.reunioes / 5) * 100}
                      color="#30d090"
                      height={5}
                    />
                  </div>

                  {/* Taxa */}
                  {!isFuture && stats.ligacoes > 0 && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      📊 Taxa: <span style={{ color: 'var(--text)' }}>
                        {Math.round((stats.reunioes / stats.ligacoes) * 100)}%
                      </span>
                    </p>
                  )}

                  {/* Anotação */}
                  {!isFuture && (
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <textarea
                        value={anotacao}
                        onChange={e => setAnotacaoDia(prev => ({ ...prev, [dia]: e.target.value }))}
                        onBlur={e => saveAnotacao(dia, e.target.value)}
                        placeholder="📝 Anotação do dia..."
                        rows={2}
                        className="w-full text-xs resize-none rounded-lg"
                        style={{ fontSize: 11, padding: '6px 8px' }}
                      />
                      {saving === dia && (
                        <div className="absolute bottom-2 right-2">
                          <Loader size={10} style={{ color: 'var(--accent)' }} className="animate-spin" />
                        </div>
                      )}
                    </div>
                  )}

                  {isToday && (
                    <button
                      onClick={e => { e.stopPropagation(); onNewCall(date) }}
                      className="w-full py-2 rounded-lg text-xs font-syne font-bold"
                      style={{ background: 'var(--accent)', color: '#0a0a0f' }}
                    >
                      + Registrar Ligação
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* === SÁBADO — Revisão === */}
          {(() => {
            const sabDate = getDateForWeekDay(weekKey, 'sabado')
            const rec = getSemanaRecord()
            const sabDados = rec?.dias.sabado

            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'rgba(240,192,64,0.4)',
                }}
              >
                <div
                  className="rounded-t-2xl px-4 py-2.5"
                  style={{ background: 'rgba(240,192,64,0.1)', borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-syne font-bold" style={{ color: 'var(--accent)' }}>SÁBADO</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>REVISÃO SEMANAL</p>
                </div>
                <div className="p-4 space-y-3">
                  <div
                    className="rounded-lg p-3 text-xs"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <p style={{ color: 'var(--muted)' }}>📊 Resultado da Semana</p>
                    <div className="mt-1.5 font-syne font-bold text-sm" style={{ color: 'var(--text)' }}>
                      <span style={{ color: weekStats.totalLig >= 250 ? 'var(--green)' : 'var(--accent)' }}>
                        {weekStats.totalLig}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>/250 lig</span>
                      {' • '}
                      <span style={{ color: weekStats.totalReu >= 25 ? 'var(--green)' : 'var(--accent)' }}>
                        {weekStats.totalReu}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>/25 reu</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>🔍 O que aprendi...</p>
                    <textarea
                      defaultValue={sabDados?.aprendizados ?? sabadoData.aprendizados}
                      onChange={e => setSabadoData(p => ({ ...p, aprendizados: e.target.value }))}
                      onBlur={e => {
                        let rec = findSemana(selectedUserId, weekKey)
                        if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
                        updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, aprendizados: e.target.value } } })
                      }}
                      placeholder="O que aprendi esta semana?"
                      rows={2}
                      className="w-full resize-none text-xs"
                      style={{ fontSize: 11, padding: '6px 8px' }}
                    />
                  </div>

                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>🚀 Plano semana que vem</p>
                    <textarea
                      defaultValue={sabDados?.plano_proxima_semana ?? sabadoData.plano}
                      onChange={e => setSabadoData(p => ({ ...p, plano: e.target.value }))}
                      onBlur={e => {
                        let rec = findSemana(selectedUserId, weekKey)
                        if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
                        updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, plano_proxima_semana: e.target.value } } })
                      }}
                      placeholder="O que vou fazer diferente?"
                      rows={2}
                      className="w-full resize-none text-xs"
                      style={{ fontSize: 11, padding: '6px 8px' }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      let rec = findSemana(selectedUserId, weekKey)
                      if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
                      updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, finalizado: true } } })
                    }}
                    className="w-full py-2 rounded-lg text-xs font-syne font-semibold"
                    style={{
                      background: sabDados?.finalizado ? 'rgba(48,208,144,0.15)' : 'rgba(240,192,64,0.15)',
                      color: sabDados?.finalizado ? 'var(--green)' : 'var(--accent)',
                      border: `1px solid ${sabDados?.finalizado ? 'rgba(48,208,144,0.3)' : 'rgba(240,192,64,0.3)'}`,
                    }}
                  >
                    {sabDados?.finalizado ? '✅ Revisão Finalizada' : '✅ Finalizar Revisão'}
                  </button>
                </div>
              </motion.div>
            )
          })()}
        </div>

        {/* Week totals */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5 rounded-2xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>📞 Total da Semana</p>
              <p className="font-syne font-black text-2xl" style={{ color: weekStats.totalLig >= 250 ? 'var(--green)' : 'var(--accent)' }}>
                {weekStats.totalLig}<span className="text-base font-normal" style={{ color: 'var(--muted)' }}>/250</span>
              </p>
              <ProgressBar value={(weekStats.totalLig/250)*100} color={weekStats.totalLig >= 250 ? '#30d090' : '#f0c040'} height={4} />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>🤝 Reuniões da Semana</p>
              <p className="font-syne font-black text-2xl" style={{ color: weekStats.totalReu >= 25 ? 'var(--green)' : '#4080f0' }}>
                {weekStats.totalReu}<span className="text-base font-normal" style={{ color: 'var(--muted)' }}>/25</span>
              </p>
              <ProgressBar value={(weekStats.totalReu/25)*100} color="#30d090" height={4} />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>📊 Taxa Semanal</p>
              <p className="font-syne font-black text-2xl" style={{ color: 'var(--text)' }}>
                {weekStats.totalLig > 0 ? Math.round((weekStats.totalReu / weekStats.totalLig) * 100) : 0}%
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>meta: 10%</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>🎯 Projeção Semanal</p>
              <p className="text-sm font-dm" style={{ color: 'var(--text)' }}>
                {weekStats.totalLig >= 250
                  ? '🏆 Meta batida!'
                  : `~${Math.round((weekStats.totalLig / 5) * 5)} ligações`
                }
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {weekStats.totalLig >= 250 ? 'Semana concluída' : 'no ritmo atual'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* === Day Panel === */}
      <AnimatePresence>
        {selectedDay && selectedDayStats && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="border-l overflow-y-auto flex-shrink-0"
            style={{
              width: 380,
              borderColor: 'var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-syne font-bold" style={{ color: 'var(--text)' }}>
                    {format(parseISO(selectedDay), "EEEE, dd/MM", { locale: ptBR })}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {selectedDayStats.ligacoes} ligações • {selectedDayStats.reunioes} reuniões
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                >
                  <X size={14} />
                </button>
              </div>

              <button
                onClick={() => onNewCall(selectedDay)}
                className="w-full py-2.5 mb-4 rounded-xl font-syne font-bold text-sm"
                style={{ background: 'var(--accent)', color: '#0a0a0f' }}
              >
                + Registrar Nova Ligação
              </button>

              <div
                className="text-xs font-syne font-bold mb-3 tracking-widest"
                style={{ color: 'var(--muted)' }}
              >
                📞 LIGAÇÕES DO DIA ({selectedDayStats.ligacoes})
              </div>

              <div className="space-y-2">
                {selectedDayStats.calls.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: 'var(--muted)' }}>
                    Nenhuma ligação registrada neste dia.
                  </p>
                ) : (
                  selectedDayStats.calls.map(c => {
                    const statusColors: Record<string, string> = { atendida: '#30d090', perdida: '#e04060', 'nao-atendeu': '#f0c040', 'caixa-postal': '#7070a0' }
                    const statusLabels: Record<string, string> = { atendida: 'Atendida', perdida: 'Perdida', 'nao-atendeu': 'Não atendeu', 'caixa-postal': 'Caixa postal' }
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl p-3 border"
                        style={{
                          background: 'var(--surface2)',
                          borderColor: c.reuniaoAgendada ? 'rgba(48,208,144,0.3)' : 'var(--border)',
                          borderLeft: `3px solid ${statusColors[c.status]}`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold font-dm truncate" style={{ color: 'var(--text)' }}>
                              {c.reuniaoAgendada && <span style={{ color: 'var(--green)' }}>🤝 </span>}
                              {c.nome}
                            </p>
                            {c.empresa && (
                              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{c.empresa}</p>
                            )}
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: statusColors[c.status] + '20', color: statusColors[c.status] }}
                          >
                            {statusLabels[c.status]}
                          </span>
                        </div>
                        {c.reuniaoAgendada && c.reuniaoData && (
                          <p className="text-xs mt-1.5" style={{ color: 'var(--green)' }}>
                            📅 Reunião: {c.reuniaoData} às {c.reuniaoHora}
                          </p>
                        )}
                        {c.anotacao && (
                          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                            📝 {c.anotacao}
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
