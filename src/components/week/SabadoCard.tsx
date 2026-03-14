// src/components/week/SabadoCard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { ProgressBar } from '../ui/ProgressBar'

interface Props {
  weekStats: { totalLig: number; totalReu: number }
  sabDados?: { aprendizados?: string; plano?: string; finalizado?: boolean }
  onChangeAprendizados: (val: string) => void
  onChangePlano: (val: string) => void
  onFinalizar: () => void
}

export function SabadoCard({ weekStats, sabDados, onChangeAprendizados, onChangePlano, onFinalizar }: Props) {
  const isFinalizado = sabDados?.finalizado ?? false

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border flex flex-col h-full"
      style={{
        background: 'var(--surface)',
        borderColor: isFinalizado ? 'var(--green)' : 'rgba(240,192,64,0.4)',
      }}
    >
      <div
        className="rounded-t-2xl px-4 py-3 border-b"
        style={{
          background: isFinalizado ? 'rgba(48,208,144,0.1)' : 'rgba(240,192,64,0.1)',
          borderColor: 'var(--border)'
        }}
      >
        <p className="text-xs font-syne font-bold tracking-widest" style={{ color: isFinalizado ? 'var(--green)' : 'var(--accent)' }}>SÁB</p>
        <p className="text-[10px] uppercase font-dm" style={{ color: 'var(--muted)' }}>REVISÃO SEMANAL</p>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Resultado */}
        <div className="rounded-xl p-3" style={{ background: 'var(--surface2)' }}>
          <p className="text-xs mb-2 font-dm" style={{ color: 'var(--muted)' }}>📊 Resultado da Semana</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-syne font-bold">
                <span style={{ color: 'var(--text)' }}>{weekStats.totalLig}<span className="text-[10px] font-dm font-normal" style={{ color: 'var(--muted)' }}>/250 lig</span></span>
              </div>
              <ProgressBar value={(weekStats.totalLig/250)*100} color={weekStats.totalLig >= 250 ? 'var(--green)' : 'var(--accent)'} height={4} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-syne font-bold">
                <span style={{ color: 'var(--text)' }}>{weekStats.totalReu}<span className="text-[10px] font-dm font-normal" style={{ color: 'var(--muted)' }}>/25 reu</span></span>
              </div>
              <ProgressBar value={(weekStats.totalReu/25)*100} color="var(--green)" height={4} />
            </div>
          </div>
        </div>

        {/* Textareas */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col h-[45%]">
            <p className="text-xs mb-1 font-dm" style={{ color: 'var(--muted)' }}>O que aprendi esta semana?</p>
            <textarea
              defaultValue={sabDados?.aprendizados}
              onChange={e => onChangeAprendizados(e.target.value)}
              placeholder="Minhas principais lições..."
              className="flex-1 w-full resize-none text-xs p-2 rounded-lg border font-dm"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={isFinalizado}
            />
          </div>
          <div className="flex flex-col h-[45%]">
            <p className="text-xs mb-1 font-dm" style={{ color: 'var(--muted)' }}>Plano para a próxima semana</p>
            <textarea
              defaultValue={sabDados?.plano}
              onChange={e => onChangePlano(e.target.value)}
              placeholder="O que vou fazer diferente?"
              className="flex-1 w-full resize-none text-xs p-2 rounded-lg border font-dm"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={isFinalizado}
            />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onFinalizar}
          disabled={isFinalizado}
          className="w-full py-2.5 rounded-xl text-xs font-syne font-bold transition-all mt-2 flex justify-center items-center gap-2"
          style={{
            background: isFinalizado ? 'rgba(48,208,144,0.15)' : 'var(--accent)',
            color: isFinalizado ? 'var(--green)' : '#0a0a0f',
            border: isFinalizado ? '1px solid rgba(48,208,144,0.3)' : 'none'
          }}
        >
          {isFinalizado ? '✅ REVISÃO FINALIZADA' : 'Finalizar Revisão da Semana'}
        </button>
      </div>
    </motion.div>
  )
}
