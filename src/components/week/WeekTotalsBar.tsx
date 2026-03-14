// src/components/week/WeekTotalsBar.tsx
import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Check } from 'lucide-react'

interface Props {
  ligacoes: number
  reunioes: number
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return
    const duration = 1000
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplay(end)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return <>{display}</>
}

export function WeekTotalsBar({ ligacoes, reunioes }: Props) {
  const metaLig = 250
  const metaReu = 25
  const ligPct = (ligacoes / metaLig) * 100
  const reuPct = (reunioes / metaReu) * 100
  const convRate = ligacoes > 0 ? Math.round((reunioes / ligacoes) * 100) : 0
  const restantes = Math.max(0, metaLig - ligacoes)

  const ligColor = ligPct >= 80 ? 'var(--green)' : ligPct >= 50 ? 'var(--accent)' : 'var(--red)'
  const reuColor = reuPct >= 80 ? 'var(--green)' : reuPct >= 50 ? 'var(--accent)' : 'var(--red)'

  return (
    <div className="flex border rounded-2xl overflow-hidden mt-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {/* Coluna 1: Ligações */}
      <div className="flex-1 p-5 border-r relative" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-syne font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>LigaçÕes (Meta 250)</p>
        <p className="font-syne font-black text-2xl" style={{ color: ligColor }}>
          <AnimatedNumber value={ligacoes} />
        </p>
        <div className="absolute bottom-0 left-0 h-[3px] transition-all" style={{ width: `${Math.min(100, ligPct)}%`, background: ligColor }} />
      </div>

      {/* Coluna 2: Reuniões */}
      <div className="flex-1 p-5 border-r relative" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-syne font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Agendamentos (Meta 25)</p>
        <p className="font-syne font-black text-2xl" style={{ color: reuColor }}>
          <AnimatedNumber value={reunioes} />
        </p>
        <div className="absolute bottom-0 left-0 h-[3px] transition-all" style={{ width: `${Math.min(100, reuPct)}%`, background: reuColor }} />
      </div>

      {/* Coluna 3: Conversão */}
      <div className="flex-1 p-5 border-r relative" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-syne font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Conversão Atual</p>
        <p className="font-syne font-black text-2xl" style={{ color: 'var(--blue)' }}>
          <AnimatedNumber value={convRate} />%
        </p>
        <div className="absolute bottom-0 left-0 h-[3px] transition-all" style={{ width: `${Math.min(100, (convRate / 10) * 100)}%`, background: 'var(--blue)' }} />
      </div>

      {/* Coluna 4: Restantes */}
      <div className="flex-1 p-5 relative flex items-center justify-between">
        <div>
          <p className="text-xs font-syne font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
            {restantes > 0 ? 'Faltam Ligações' : 'Semana Concluída!'}
          </p>
          <p className="font-syne font-black text-2xl" style={{ color: restantes > 0 ? 'var(--text)' : 'var(--green)' }}>
            {restantes > 0 ? <AnimatedNumber value={restantes} /> : <Check size={28} className="mt-1" />}
          </p>
        </div>
        {restantes === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 rounded-full flex items-center justify-center font-xl"
            style={{ background: 'rgba(48,208,144,0.1)' }}
          >
            🔥
          </motion.div>
        )}
      </div>
    </div>
  )
}
