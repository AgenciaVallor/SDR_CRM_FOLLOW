// src/components/shared/CallModal.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, X, CheckSquare, Square, Calendar, Clock, MapPin, Bell, Link2, MessageCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Call, CallStatus, MeetingLocal, ChecklistCall } from '../../types'
import { formatPhone } from '../../utils/formatters'
import { openWhatsApp } from '../../utils/whatsapp'
import { getLeads } from '../../utils/storage'
import { genId } from '../../utils/storage'
import { getWeekKey, dayOfWeekIndex, todayStr } from '../../utils/weekUtils'
import { getISOWeekYear, getISOWeek, format } from 'date-fns'
import { useToast } from '../../context/ToastContext'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (call: Call) => void
  userId: string
  userName: string
  todayStats?: { ligacoes: number; reunioes: number }
  prefill?: Partial<Call>
}

const STATUS_OPTS: { value: CallStatus; label: string; icon: string; color: string }[] = [
  { value: 'atendida',      label: 'Atendida',       icon: '✅', color: '#30d090' },
  { value: 'perdida',       label: 'Perdida',        icon: '❌', color: '#e04060' },
  { value: 'nao-atendeu',  label: 'Não Atendeu',    icon: '📵', color: '#f0c040' },
  { value: 'caixa-postal', label: 'Caixa Postal',   icon: '📬', color: '#7070a0' },
]

const LOCAL_OPTS: { value: MeetingLocal; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'zoom',       label: 'Zoom' },
  { value: 'meet',       label: 'Google Meet' },
  { value: 'telefone',   label: 'Telefone' },
  { value: 'whatsapp',   label: 'WhatsApp' },
]

const CHECKLIST_ITEMS: { key: keyof ChecklistCall; label: string }[] = [
  { key: 'apresentouProposta',  label: 'Apresentou o serviço/proposta' },
  { key: 'levantouObjecao',     label: 'Levantou e tratou objeção' },
  { key: 'agendouProximoPasso', label: 'Agendou próximo passo' },
  { key: 'demonstrouInteresse', label: 'Lead demonstrou interesse claro' },
  { key: 'solicitouRetorno',    label: 'Solicitou retorno/material' },
]

export default function CallModal({ open, onClose, onSave, userId, userName, todayStats, prefill }: Props) {
  const { success, fire } = useToast()

  const [nome, setNome] = useState(prefill?.nome ?? '')
  const [numero, setNumero] = useState(prefill?.numero ?? '')
  const [empresa, setEmpresa] = useState(prefill?.empresa ?? '')
  const [status, setStatus] = useState<CallStatus>(prefill?.status ?? 'atendida')
  const [anotacao, setAnotacao] = useState(prefill?.anotacao ?? '')
  const [checklist, setChecklist] = useState<ChecklistCall>({
    apresentouProposta: false,
    levantouObjecao: false,
    agendouProximoPasso: false,
    demonstrouInteresse: false,
    solicitouRetorno: false,
    ...prefill?.checklist,
  })
  const [reuniao, setReuniao] = useState(prefill?.reuniaoAgendada ?? false)
  const [reuniaoData, setReuniaoData] = useState(prefill?.reuniaoData ?? '')
  const [reuniaoHora, setReuniaoHora] = useState(prefill?.reuniaoHora ?? '')
  const [reuniaoLocal, setReuniaoLocal] = useState<MeetingLocal>(prefill?.reuniaoLocal ?? 'meet')
  const [reuniaoObs, setReuniaoObs] = useState('')
  const [followup, setFollowup] = useState(prefill?.followup ?? false)
  const [followupData, setFollowupData] = useState(prefill?.followupData ?? '')
  const [followupNota, setFollowupNota] = useState(prefill?.followupNota ?? '')
  const [leadId, setLeadId] = useState<string | null>(prefill?.leadId ?? null)
  const [leadSearch, setLeadSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const leads = getLeads()
  const filteredLeads = leadSearch.length > 1
    ? leads.filter(l => l.nome.toLowerCase().includes(leadSearch.toLowerCase()) || l.empresa.toLowerCase().includes(leadSearch.toLowerCase()))
    : []

  const checklistScore = Object.values(checklist).filter(Boolean).length

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!numero.trim()) errs.numero = 'Número é obrigatório'
    if (status === 'atendida' && anotacao.trim().length < 20) {
      errs.anotacao = 'Uma ligação atendida sem anotação é dinheiro perdido. Escreva o que aconteceu. (mín. 20 caracteres)'
    }
    if (reuniao && !reuniaoData) errs.reuniaoData = 'Data obrigatória'
    if (reuniao && !reuniaoHora) errs.reuniaoHora = 'Hora obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const ts = Date.now()
    const now = new Date(ts)
    const weekKey = getWeekKey(now)

    const call: Call = {
      id: genId(),
      nome: nome.trim(),
      numero: numero.trim(),
      empresa: empresa.trim(),
      status,
      reuniaoAgendada: reuniao,
      reuniaoData: reuniao ? reuniaoData : null,
      reuniaoHora: reuniao ? reuniaoHora : null,
      reuniaoLocal,
      anotacao: anotacao.trim(),
      checklist,
      followup,
      followupData: followup ? followupData : null,
      followupNota: followup ? followupNota.trim() : '',
      followupFeito: false,
      operadorId: userId,
      operadorNome: userName,
      leadId: leadId ?? null,
      timestamp: ts,
      diaSemana: now.getDay() as 0|1|2|3|4|5|6,
      semana: weekKey,
      mes: format(now, 'yyyy-MM'),
    }

    onSave(call)

    const newLigacoes = (todayStats?.ligacoes ?? 0) + 1
    const newReunioes = (todayStats?.reunioes ?? 0) + (reuniao ? 1 : 0)

    if (newLigacoes === 50) {
      fire(`META DE LIGAÇÕES BATIDA! 50 ligações!`)
    } else if (reuniao && newReunioes === 5) {
      fire(`5 REUNIÕES AGENDADAS META BATIDA!`)
    } else if (reuniao) {
      success(`🎉 Reunião agendada para ${reuniaoData} às ${reuniaoHora}! ${newLigacoes}/50 hoje • ${newReunioes}/5 reuniões`)
    } else {
      success(`✅ Ligação registrada! ${newLigacoes}/50 hoje • ${newReunioes}/5 reuniões`)
    }

    handleClose()
  }

  const handleClose = () => {
    setNome(''); setNumero(''); setEmpresa(''); setStatus('atendida')
    setAnotacao(''); setChecklist({ apresentouProposta: false, levantouObjecao: false, agendouProximoPasso: false, demonstrouInteresse: false, solicitouRetorno: false })
    setReuniao(false); setReuniaoData(''); setReuniaoHora(''); setReuniaoLocal('meet')
    setFollowup(false); setFollowupData(''); setFollowupNota('')
    setLeadId(null); setLeadSearch(''); setErrors({})
    onClose()
  }

  const toggleCheck = (key: keyof ChecklistCall) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="📞 Registrar Ligação"
      width={640}
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-dm border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Cancelar
          </button>
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 rounded-lg text-sm font-syne font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0f' }}
          >
            💾 Salvar Ligação
          </motion.button>
        </>
      }
    >
      <div className="space-y-6">
        {/* === CONTATO === */}
        <section>
          <Label>CONTATO</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome *"
                className="w-full text-sm"
              />
              {errors.nome && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.nome}</p>}
            </div>
            <div className="relative">
              <input
                value={numero}
                onChange={e => setNumero(formatPhone(e.target.value))}
                placeholder="Número *"
                className="w-full text-sm pr-10"
              />
              {numero && (
                <button
                  onClick={() => openWhatsApp(numero)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-300 transition-colors"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle size={16} style={{ color: 'var(--green)' }} />
                </button>
              )}
              {errors.numero && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.numero}</p>}
            </div>
          </div>
          <input
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            placeholder="Empresa"
            className="w-full text-sm mt-3"
          />
        </section>

        {/* === RESULTADO === */}
        <section>
          <Label>RESULTADO</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {STATUS_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-dm border transition-all"
                style={{
                  borderColor: status === opt.value ? opt.color : 'var(--border)',
                  background: status === opt.value ? opt.color + '20' : 'var(--surface2)',
                  color: status === opt.value ? opt.color : 'var(--muted)',
                  fontWeight: status === opt.value ? 600 : 400,
                }}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* === ANOTAÇÃO === */}
        <section
          className="rounded-xl p-4 transition-all"
          style={{ borderColor: errors.anotacao ? 'var(--red)' : '#f0c04040', background: 'rgba(240,192,64,0.03)', border: '1px solid', boxShadow: errors.anotacao ? '0 0 0 1px var(--red)' : 'none' }}
        >
          <div className="flex items-center justify-between mb-2">
            <Label noMargin>📝 ANOTAÇÃO DA LIGAÇÃO</Label>
          </div>
          <textarea
            value={anotacao}
            onChange={e => setAnotacao(e.target.value.slice(0, 500))}
            placeholder={status === 'atendida'
              ? 'O que aconteceu nessa ligação? Ex: "Lead demonstrou interesse no plano mensal. Tem dores de conversão no Meta. Pediu proposta por email."'
              : 'Anotações opcionais sobre a ligação...'
            }
            className="w-full text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent rounded-lg p-3"
            style={{ 
              borderColor: errors.anotacao ? 'var(--red)' : 'var(--border)',
              minHeight: '110px',
              background: 'var(--surface2)',
              color: 'var(--text)'
            }}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs" style={{ color: 'var(--orange)' }}>
              {status === 'atendida' ? 'Obrigatória se Atendida com mínimo 20 chars' : ''}
              <br/>
              <span className="text-red-500">{errors.anotacao ?? ''}</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{anotacao.length}/500</p>
          </div>
        </section>

        {/* === CHECKLIST === */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <Label noMargin>✅ CHECKLIST DE QUALIDADE</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-4 h-1.5 rounded-full"
                    style={{ background: i < checklistScore ? 'var(--accent)' : 'var(--surface3)' }}
                  />
                ))}
              </div>
              <span className="text-xs font-dm" style={{ color: 'var(--muted)' }}>{checklistScore}/5</span>
            </div>
          </div>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleCheck(key)}
                className="w-full flex items-center gap-3 text-sm text-left font-dm hover:opacity-80 transition-opacity"
              >
                {checklist[key]
                  ? <CheckSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  : <Square size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                }
                <span style={{ color: checklist[key] ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* === REUNIÃO === */}
        <section>
          <Label>🤝 REUNIÃO AGENDADA?</Label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setReuniao(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-dm border transition-all"
              style={{
                borderColor: !reuniao ? 'var(--border)' : 'var(--border)',
                background: !reuniao ? 'var(--surface3)' : 'var(--surface2)',
                color: !reuniao ? 'var(--text)' : 'var(--muted)',
              }}
            >
              NÃO
            </button>
            <button
              onClick={() => setReuniao(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-dm border transition-all font-semibold"
              style={{
                borderColor: reuniao ? 'var(--green)' : 'var(--border)',
                background: reuniao ? 'rgba(48,208,144,0.15)' : 'var(--surface2)',
                color: reuniao ? 'var(--green)' : 'var(--muted)',
              }}
            >
              ✅ SIM — AGENDEI!
            </button>
          </div>

          <AnimatePresence>
            {reuniao && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar size={12} style={{ color: 'var(--muted)' }} />
                        <span className="text-xs font-dm" style={{ color: 'var(--muted)' }}>Data</span>
                      </div>
                      <input
                        type="date"
                        value={reuniaoData}
                        onChange={e => setReuniaoData(e.target.value)}
                        className="w-full text-sm"
                        style={{ borderColor: errors.reuniaoData ? 'var(--red)' : 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={12} style={{ color: 'var(--muted)' }} />
                        <span className="text-xs font-dm" style={{ color: 'var(--muted)' }}>Hora</span>
                      </div>
                      <input
                        type="time"
                        value={reuniaoHora}
                        onChange={e => setReuniaoHora(e.target.value)}
                        className="w-full text-sm"
                        style={{ borderColor: errors.reuniaoHora ? 'var(--red)' : 'var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {LOCAL_OPTS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setReuniaoLocal(opt.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-dm border transition-all"
                        style={{
                          borderColor: reuniaoLocal === opt.value ? 'var(--blue)' : 'var(--border)',
                          background: reuniaoLocal === opt.value ? 'rgba(64,128,240,0.15)' : 'var(--surface2)',
                          color: reuniaoLocal === opt.value ? 'var(--blue)' : 'var(--muted)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reuniaoObs}
                    onChange={e => setReuniaoObs(e.target.value)}
                    placeholder="Observação da reunião..."
                    rows={2}
                    className="w-full text-sm resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* === FOLLOW-UP === */}
        <section>
          <div className="flex items-center justify-between">
            <Label noMargin>🔔 FOLLOW-UP</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setFollowup(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-dm border transition-all"
                style={{
                  borderColor: !followup ? 'var(--border)' : 'var(--border)',
                  background: !followup ? 'var(--surface3)' : 'var(--surface2)',
                  color: !followup ? 'var(--text)' : 'var(--muted)',
                }}
              >
                NÃO
              </button>
              <button
                onClick={() => setFollowup(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-dm border transition-all"
                style={{
                  borderColor: followup ? 'var(--orange)' : 'var(--border)',
                  background: followup ? 'rgba(224,90,48,0.15)' : 'var(--surface2)',
                  color: followup ? 'var(--orange)' : 'var(--muted)',
                }}
              >
                SIM
              </button>
            </div>
          </div>

          <AnimatePresence>
            {followup && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <input
                    type="date"
                    value={followupData}
                    onChange={e => setFollowupData(e.target.value)}
                    className="text-sm"
                    placeholder="Data do retorno"
                  />
                  <input
                    value={followupNota}
                    onChange={e => setFollowupNota(e.target.value)}
                    placeholder="Nota do follow-up..."
                    className="text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* === VINCULAR LEAD === */}
        <section>
          <Label>🔗 VINCULAR A LEAD DO KANBAN</Label>
          <div className="relative mt-2">
            <input
              value={leadSearch}
              onChange={e => { setLeadSearch(e.target.value); setLeadId(null) }}
              placeholder="Buscar lead por nome ou empresa..."
              className="w-full text-sm"
            />
            {filteredLeads.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden shadow-xl"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                {filteredLeads.slice(0, 5).map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLeadId(l.id); setLeadSearch(`${l.nome} — ${l.empresa}`) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 border-b last:border-b-0 font-dm"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <span className="font-semibold">{l.nome}</span>
                    <span style={{ color: 'var(--muted)' }}> — {l.empresa}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {leadId && (
            <p className="text-xs mt-1 font-dm" style={{ color: 'var(--green)' }}>
              ✅ Lead vinculado
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}

function Label({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <p
      className={`text-xs font-syne font-bold tracking-widest ${noMargin ? '' : 'mb-2'}`}
      style={{ color: 'var(--muted)' }}
    >
      {children}
    </p>
  )
}
