// src/pages/Cadencia.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageCircle, Mail, Check } from 'lucide-react'
import { User } from '../types'
import { getCadencias, getLeads, getTemplates } from '../utils/storage'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  user: User
  isAdmin: boolean
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  ligacao:  <Phone size={14} />,
  whatsapp: <MessageCircle size={14} />,
  email:    <Mail size={14} />,
}

const TIPO_COLORS: Record<string, string> = {
  ligacao:  '#f0c040',
  whatsapp: '#30d090',
  email:    '#4080f0',
}

export default function Cadencia({ user, isAdmin }: Props) {
  const [cadencias, setCadencias] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    Promise.all([getCadencias(), getLeads(), getTemplates()]).then(([c, l, t]) => {
      setCadencias(c)
      setLeads(l)
      setTemplates(t)
    })
  }, [])

  const todayTasks = useMemo(() => {
    return cadencias
      .filter((c: any) => c.ativa && (isAdmin || leads.find((l: any) => l.id === c.leadId)?.responsavelId === user.id))
      .flatMap((c: any) => {
        const lead = leads.find((l: any) => l.id === c.leadId)
        const startDate = new Date(c.inicioEm)
        return c.etapas
          .filter((e: any) => !e.feita)
          .map((e: any) => {
            const dueDate = format(addDays(startDate, e.dia - 1), 'yyyy-MM-dd')
            return { ...e, dueDate, lead, cadenciaId: c.id }
          })
          .filter((e: any) => e.dueDate <= today)
      })
  }, [cadencias, leads, user.id, isAdmin, today])

  return (
    <div className="p-6 font-dm">
      <div className="mb-6">
        <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>Cadência</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Sequências de contato automatizadas</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Fazer Hoje */}
        <div className="col-span-2">
          <h2 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>📋 Fazer Hoje ({todayTasks.length})</h2>
          {todayTasks.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm font-dm" style={{ color: 'var(--muted)' }}>Nenhuma tarefa de cadência para hoje!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((t: any, i: any) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: `3px solid ${TIPO_COLORS[t.tipo]}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: TIPO_COLORS[t.tipo] + '20', color: TIPO_COLORS[t.tipo] }}
                      >
                        {TIPO_ICONS[t.tipo]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {t.lead?.nome ?? 'Lead'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {t.lead?.empresa} • Dia {t.dia} da cadência
                        </p>
                        <p className="text-xs mt-1 font-dm" style={{ color: 'var(--text)' }}>{t.instrucao}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs border font-dm"
                        style={{ borderColor: TIPO_COLORS[t.tipo], color: TIPO_COLORS[t.tipo], background: TIPO_COLORS[t.tipo] + '10' }}
                      >
                        {t.tipo === 'ligacao' ? '📞 Ligar' : t.tipo === 'whatsapp' ? '💬 WhatsApp' : '📧 Email'}
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-dm" style={{ background: 'rgba(48,208,144,0.15)', color: 'var(--green)' }}>
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div>
          <h2 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>📋 Templates</h2>
          <div className="space-y-3">
            {templates.map((t: any) => (
              <div key={t.id} className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>{t.nome}</p>
                <div className="space-y-1.5">
                  {t.etapas.map((e: any, i: any) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span style={{ color: TIPO_COLORS[e.tipo] }}>{TIPO_ICONS[e.tipo]}</span>
                      <span style={{ color: 'var(--muted)' }}>Dia {e.dia}:</span>
                      <span style={{ color: 'var(--text)' }} className="truncate">{e.instrucao.slice(0, 35)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
