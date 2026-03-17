// src/components/week/DayPanel.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X } from 'lucide-react'
import { Call } from '../../types'
import { DIAS_NOMES } from '../../utils/constants'
import { User } from '@/types'
import { getFeedbacksForCall, saveFeedback } from '@/utils/storage'

interface Props {
  user: User // Add user prop
  dateStr: string
  diaSemana: string
  stats: { ligacoes: number; reunioes: number; calls: Call[] }
  nota: string
  onClose: () => void
  onRegisterCall: () => void
  onSaveNota: (nota: string) => void
}

const statusColors: Record<string, string> = { atendida: '#30d090', perdida: '#e04060', 'nao-atendeu': '#f0c040', 'caixa-postal': '#7070a0' }
const statusLabels: Record<string, string> = { atendida: 'Atendida', perdida: 'Perdida', 'nao-atendeu': 'Não atendeu', 'caixa-postal': 'Caixa postal' }

function CallFeedbackSection({ call, currentUser }: { call: Call, currentUser: User }) {
  const [feedbacks, setFeedbacks]   = useState<any[]>([])
  const [newFeedback, setNewFeedback] = useState('')
  const [saving, setSaving]         = useState(false)
  const canFeedback = currentUser.role === 'admin' || currentUser.role === 'gerente'

  useEffect(() => {
    getFeedbacksForCall(call.id).then(setFeedbacks)
  }, [call.id])

  async function handleSave() {
    if (!newFeedback.trim()) return
    setSaving(true)
    await saveFeedback(call.id, currentUser.id, currentUser.nome, newFeedback.trim())
    setFeedbacks(await getFeedbacksForCall(call.id))
    setNewFeedback('')
    setSaving(false)
  }

  if (feedbacks.length === 0 && !canFeedback) return null

  return (
    <div style={{
      marginTop: '8px', paddingTop: '8px',
      borderTop: '1px solid var(--border)',
    }}>
      {feedbacks.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {feedbacks.map(fb => (
            <div key={fb.id} style={{
              background: 'rgba(240,192,64,0.06)',
              border: '1px solid rgba(240,192,64,0.15)',
              borderRadius: '6px', padding: '8px 10px',
              marginBottom: '4px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, marginBottom: '3px' }}>
                💬 {fb.autorNome} · {new Date(fb.criadoEm).toLocaleDateString('pt-BR')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.5 }}>
                {fb.texto}
              </div>
            </div>
          ))}
        </div>
      )}

      {canFeedback && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={newFeedback}
            onChange={e => setNewFeedback(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            placeholder="Deixar feedback..."
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '6px 10px', color: 'var(--text)',
              fontSize: '11px', outline: 'none', fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <button onClick={handleSave} disabled={saving || !newFeedback.trim()} style={{
            padding: '6px 12px', borderRadius: '6px', border: 'none',
            background: newFeedback.trim() ? 'var(--accent)' : 'var(--surface3)',
            color: newFeedback.trim() ? '#0a0a0f' : 'var(--muted)',
            fontSize: '11px', fontWeight: 700, cursor: newFeedback.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {saving ? '...' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  )
}

export function DayPanel({ user: currentUser, dateStr, diaSemana, stats, nota, onClose, onRegisterCall, onSaveNota }: Props) {
  const [localNota, setLocalNota] = useState(nota)
  const [saving, setSaving] = useState(false)

  // Debounced save
  useEffect(() => {
    if (localNota === nota) return
    const t = setTimeout(() => {
      setSaving(true)
      onSaveNota(localNota)
      setTimeout(() => setSaving(false), 300)
    }, 800)
    return () => clearTimeout(t)
  }, [localNota, nota, onSaveNota])

  const ligPct = Math.min(100, (stats.ligacoes / 50) * 100)
  const reuPct = Math.min(100, (stats.reunioes / 5) * 100)

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backdropFilter: 'blur(2px)', background: 'rgba(10,10,15,0.4)' }}
      />
      
      {/* Panel */}
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="fixed top-0 right-0 bottom-0 w-[400px] z-50 flex flex-col shadow-2xl border-l"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-syne font-black text-xl capitalize" style={{ color: 'var(--text)' }}>
              {DIAS_NOMES[diaSemana as keyof typeof DIAS_NOMES] || format(parseISO(dateStr), 'EEEE', { locale: ptBR })}
            </h2>
            <p className="text-sm font-dm" style={{ color: 'var(--muted)' }}>
              {format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface2 transition-colors text-muted">
            <X size={20} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="p-5 flex gap-3">
          <div className="flex-1 rounded-xl p-3 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-dm mb-1" style={{ color: 'var(--muted)' }}>Ligações hoje</p>
            <p className="font-syne font-bold text-xl mb-2" style={{ color: ligPct >= 100 ? 'var(--green)' : 'var(--text)' }}>
              {stats.ligacoes}<span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/50</span>
            </p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
              <div className="h-full" style={{ width: `${ligPct}%`, background: ligPct >= 100 ? 'var(--green)' : ligPct >= 50 ? 'var(--accent)' : 'var(--red)' }} />
            </div>
          </div>
          <div className="flex-1 rounded-xl p-3 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-dm mb-1" style={{ color: 'var(--muted)' }}>Agendamentos</p>
            <p className="font-syne font-bold text-xl mb-2" style={{ color: reuPct >= 100 ? 'var(--green)' : 'var(--text)' }}>
              {stats.reunioes}<span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/5</span>
            </p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
              <div className="h-full" style={{ width: `${reuPct}%`, background: 'var(--green)' }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 custom-scrollbar">
          {/* Section 1: Anotação do dia */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-syne font-bold tracking-widest" style={{ color: 'var(--muted)' }}>📝 ANOTAÇÃO DO DIA</h3>
              <span className="text-[10px] font-dm" style={{ color: saving ? 'var(--accent)' : 'var(--muted)' }}>
                {saving ? 'Salvando...' : 'Salvo'}
              </span>
            </div>
            <textarea
              value={localNota}
              onChange={e => setLocalNota(e.target.value)}
              placeholder="Anotações gerais do dia..."
              rows={3}
              className="w-full resize-none p-3 rounded-xl border text-sm font-dm"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] font-dm" style={{ color: 'var(--muted)' }}>{localNota.length} caracteres</span>
              <button 
                onClick={() => { onSaveNota(localNota); setSaving(true); setTimeout(() => setSaving(false), 300) }}
                className="text-xs px-3 py-1 bg-surface3 rounded-md hover:bg-surface2 transition-colors border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Salvar Nota
              </button>
            </div>
          </div>

          {/* Section 2: Ligações do dia */}
          <div>
            <h3 className="text-xs font-syne font-bold tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
              📞 LIGAÇÕES DO DIA ({stats.ligacoes})
            </h3>
            
            <button
              onClick={onRegisterCall}
              className="w-full mb-4 py-3 border-2 border-dashed rounded-xl font-syne font-bold text-sm transition-all hover:bg-surface2 flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <span className="text-lg leading-none">+</span> Nova Ligação
            </button>

            <div className="space-y-3">
              {[...stats.calls].sort((a,b) => b.timestamp - a.timestamp).map(c => {
                const checklistCount = Object.values(c.checklist).filter(Boolean).length
                const d = new Date(c.timestamp)
                const timeStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`

                return (
                  <div key={c.id} className="rounded-xl p-3 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold font-dm truncate" style={{ color: 'var(--text)' }}>
                          {c.nome}
                        </p>
                        {c.empresa && <p className="text-xs truncate font-dm" style={{ color: 'var(--muted)' }}>{c.empresa}</p>}
                      </div>
                      <span className="font-mono text-xs opacity-50">{timeStr}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-dm" style={{ background: statusColors[c.status] + '20', color: statusColors[c.status] }}>
                        {statusLabels[c.status]}
                      </span>
                      {checklistCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-dm" style={{ background: 'var(--surface3)', color: 'var(--muted)' }}>
                          ✅ {checklistCount}/5 checklist
                        </span>
                      )}
                    </div>

                    {c.anotacao && (
                      <div className="text-[11px] font-dm p-2 rounded-lg italic" style={{ background: '#0a0a0f', color: 'var(--text)' }}>
                        "{c.anotacao}"
                      </div>
                    )}

                    {c.reuniaoAgendada && (
                      <div className="mt-2 text-[11px] font-dm p-2 rounded-lg border" style={{ background: 'rgba(48,208,144,0.1)', borderColor: 'rgba(48,208,144,0.3)', color: 'var(--green)' }}>
                        📅 Reunião: {c.reuniaoData} às {c.reuniaoHora} ({c.reuniaoLocal})
                      </div>
                    )}
                    
                    <CallFeedbackSection call={c} currentUser={currentUser} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
