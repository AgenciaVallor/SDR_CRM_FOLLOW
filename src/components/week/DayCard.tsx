// src/components/week/DayCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DiaStatus } from '../../types'
import { isToday, isFuture } from '../../utils/weekUtils'

interface DayStats {
  ligacoes: number
  reunioes: number
  atendidas: number
  status: DiaStatus
}

interface Props {
  dia: string
  dateStr: string
  stats: DayStats
  nota: string
  index: number
  onClick: () => void
  onRegisterCall: () => void
}

const STATUS_COLOR: Record<string, string> = {
  meta_batida:  '#30d090', // verde
  meta_parcial: '#f0c040', // âmbar
  abaixo:       '#e04060', // vermelho
  pendente:     'var(--border)', // border color
}

const DIAS_CURTO: Record<string, string> = {
  segunda: 'SEG',
  terca: 'TER',
  quarta: 'QUA',
  quinta: 'QUI',
  sexta: 'SEX',
  sabado: 'SÁB',
}

export function DayCard({ dia, dateStr, stats, nota, index, onClick, onRegisterCall }: Props) {
  const isOkToday = isToday(dateStr)
  const isFuturo = isFuture(dateStr)
  
  // Custom status logic as per spec
  let statusStr = 'pendente'
  if (isOkToday) {
    statusStr = 'hoje'
  } else if (isFuturo) {
    statusStr = 'pendente'
  } else if (stats.ligacoes >= 50 && stats.reunioes >= 5) {
    statusStr = 'meta_batida'
  } else if (stats.ligacoes >= 25 || stats.reunioes >= 2) {
    statusStr = 'meta_parcial'
  } else if (stats.ligacoes > 0) {
    statusStr = 'abaixo'
  } else {
    statusStr = 'pendente'
  }

  const color = statusStr === 'hoje' ? '#f0c040' : STATUS_COLOR[statusStr]
  const glow = statusStr === 'hoje' ? '0 0 12px rgba(240,192,64,0.3)' : 'none'
  const bg = statusStr === 'hoje' ? 'var(--surface2)' : 'var(--surface)'

  const ligPct = Math.min(100, (stats.ligacoes / 50) * 100)
  const reuPct = Math.min(100, (stats.reunioes / 5) * 100)
  const convRate = stats.ligacoes > 0 ? Math.round((stats.reunioes / stats.ligacoes) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer transition-all hover:-translate-y-1 rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: bg,
        border: '1px solid var(--border)',
        borderTop: `3px solid ${color}`,
        boxShadow: glow,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="font-syne font-bold text-xs tracking-widest" style={{ color: statusStr === 'hoje' ? color : 'var(--text)' }}>
            {DIAS_CURTO[dia]}
          </p>
          <p className="text-[10px] uppercase font-dm" style={{ color: 'var(--muted)' }}>
            {format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        {/* Ponto pulsante se for hoje */}
        <div className="w-3 h-3 rounded-full flex items-center justify-center">
          <motion.div
            animate={statusStr === 'hoje' ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Ligações */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5 font-dm">
            <span style={{ color: 'var(--muted)' }}>Ligações</span>
            <span style={{ color: isFuturo ? 'var(--muted)' : 'var(--text)' }}>
              <strong className="font-syne font-bold text-sm" style={{ color: isFuturo ? 'var(--muted)' : ligPct >= 100 ? 'var(--green)' : 'var(--text)' }}>
                {stats.ligacoes}
              </strong>
              <span className="text-[10px]">/50</span>
            </span>
          </div>
          {!isFuturo && (
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
              <div className="h-full" style={{ width: `${ligPct}%`, background: ligPct >= 100 ? 'var(--green)' : ligPct >= 50 ? 'var(--accent)' : 'var(--red)' }} />
            </div>
          )}
        </div>

        {/* Reuniões */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5 font-dm">
            <span style={{ color: 'var(--muted)' }}>Reuniões</span>
            <span style={{ color: isFuturo ? 'var(--muted)' : 'var(--text)' }}>
              <strong className="font-syne font-bold text-sm" style={{ color: isFuturo ? 'var(--muted)' : reuPct >= 100 ? 'var(--green)' : 'var(--text)' }}>
                {stats.reunioes}
              </strong>
              <span className="text-[10px]">/5</span>
            </span>
          </div>
          {!isFuturo && (
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
              <div className="h-full" style={{ width: `${reuPct}%`, background: 'var(--green)' }} />
            </div>
          )}
        </div>

        {/* Taxa */}
        {!isFuturo && (
          <div className="flex justify-between text-xs pt-1">
            <span style={{ color: 'var(--muted)' }}>Taxa de conversão</span>
            <span className="font-syne font-bold" style={{ color: 'var(--blue)' }}>{convRate}%</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Preview Anotação */}
        {!isFuturo && (
          <div className="mt-2 text-xs p-2 rounded-lg border font-dm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {nota ? (
              <span className="line-clamp-2" style={{ color: 'var(--text)' }}>{nota}</span>
            ) : (
              <span className="italic" style={{ color: 'var(--muted)' }}>Sem anotação. Clique para adicionar...</span>
            )}
          </div>
        )}
      </div>

      {/* Footer com Botão */}
      <div className="p-3 bg-surface2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={e => { e.stopPropagation(); onRegisterCall() }}
          className="w-full py-2 rounded-lg text-xs font-syne font-bold transition-all hover:bg-opacity-90 flex items-center justify-center gap-1.5"
          style={{ background: 'var(--accent)', color: '#0a0a0f' }}
        >
          ➕ <span className="pt-0.5">REGISTRAR LIGAÇÃO</span>
        </button>
      </div>
    </motion.div>
  )
}
