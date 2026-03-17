// src/pages/SemanaAtual.tsx — MÓDULO PRINCIPAL
import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { User, Call, DiaStatus } from '../types'

interface DayStats {
  ligacoes: number
  reunioes: number
  atendidas: number
  status: DiaStatus
  calls: Call[]
}
import { getCalls, findSemana, addSemana, updateSemana } from '../utils/storage'
import {
  getWeekKey, getWeekDates, getWeekLabel, getCurrentWeekKey, isThisWeek,
  getMesLabel, getSemanaNumber, startOfDayTs, endOfDayTs
} from '../utils/weekUtils'
import { makeRegistroSemanal } from '../hooks/useWeek'
import { getStatusDia } from '../hooks/useCalls'

import { WeekTotalsBar } from '../components/week/WeekTotalsBar'
import { DayCard } from '../components/week/DayCard'
import { SabadoCard } from '../components/week/SabadoCard'
import { DayPanel } from '../components/week/DayPanel'
import { UploadListaModal } from '../components/shared/UploadListaModal'

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
  const [sabadoData, setSabadoData] = useState<{ aprendizados?: string; plano?: string; finalizado?: boolean }>({})
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const refresh = () => setRefreshCount(c => c + 1)

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
  }, [selectedUserId, refreshCount])

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

  const selectedDayItem = selectedDay ? weekDates.find(d => d.date === selectedDay) : null
  const selectedDayStats = selectedDay ? getDayStats(selectedDay) : null

  return (
    <div className="h-full flex relative">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-syne font-black text-2xl" style={{ color: 'var(--text)' }}>
              {mesLabel.toUpperCase()} — Semana {semanaNum}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Meta Semanal: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>250 ligações</span>
              {' • '}
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>25 agendamentos</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border font-dm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {users.filter(u => u.role === 'vendedor' && u.ativo).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekKey(k => {
                  const [y, w] = k.split('-W').map(Number);
                  return w === 1 ? `${y - 1}-W52` : `${y}-W${String(w - 1).padStart(2, '0')}`;
                })}
                className="w-8 h-8 rounded-lg flex items-center justify-center border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <ChevronLeft size={16} />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={() => setWeekKey(getCurrentWeekKey())}
                  className="px-3 py-1.5 rounded-lg text-xs font-dm border font-bold uppercase transition-all"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(240,192,64,0.08)' }}
                >
                  Hoje
                </button>
              )}
              <button
                onClick={() => setWeekKey(k => {
                  const [y, w] = k.split('-W').map(Number);
                  return w === 52 ? `${y + 1}-W01` : `${y}-W${String(w + 1).padStart(2, '0')}`;
                })}
                className="w-8 h-8 rounded-lg flex items-center justify-center border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px',
                background: 'var(--s2)', border: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              📋 Upload Lista Semanal
            </button>
          </div>
        </div>

        <WeekTotalsBar ligacoes={weekStats.totalLig} reunioes={weekStats.totalReu} />

        {/* Day grid */}
        <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {weekDates.filter(d => d.dia !== 'sabado').map((wd, i) => (
            <DayCard
              key={wd.dia}
              dia={wd.dia}
              dateStr={wd.date}
              stats={getDayStats(wd.date)}
              nota={getAnotacao(wd.dia)}
              index={i}
              onClick={() => setSelectedDay(wd.date)}
              onRegisterCall={() => onNewCall(wd.date)}
            />
          ))}

          {/* SÁBADO */}
          <SabadoCard
            weekStats={weekStats}
            sabDados={getSemanaRecord()?.dias.sabado ?? sabadoData}
            onChangeAprendizados={val => {
              setSabadoData(p => ({ ...p, aprendizados: val }))
              let rec = findSemana(selectedUserId, weekKey)
              if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
              updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, aprendizados: val } } })
            }}
            onChangePlano={val => {
              setSabadoData(p => ({ ...p, plano: val }))
              let rec = findSemana(selectedUserId, weekKey)
              if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
              updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, plano_proxima_semana: val } } })
            }}
            onFinalizar={() => {
              let rec = findSemana(selectedUserId, weekKey)
              if (!rec) { rec = makeRegistroSemanal(selectedUserId, weekKey); addSemana(rec) }
              updateSemana(rec.id, { dias: { ...rec.dias, sabado: { ...rec.dias.sabado, finalizado: true } } })
              setSabadoData(p => ({ ...p, finalizado: true }))
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedDayItem && selectedDayStats && (
          <DayPanel
            dateStr={selectedDayItem.date}
            diaSemana={selectedDayItem.dia}
            stats={selectedDayStats}
            nota={getAnotacao(selectedDayItem.dia)}
            onClose={() => setSelectedDay(null)}
            onRegisterCall={() => onNewCall(selectedDayItem.date)}
            onSaveNota={nota => saveAnotacao(selectedDayItem.dia, nota)}
          />
        )}
      </AnimatePresence>
      <UploadListaModal
        isOpen={uploadModalOpen}
        currentWeekKey={weekKey}
        currentUserId={user.id}
        currentUserNome={user.nome}
        currentUserRole={user.role}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setUploadModalOpen(false)
          refresh()
        }}
      />
    </div>
  )
}
