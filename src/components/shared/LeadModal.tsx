// src/components/shared/LeadModal.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '../ui/Modal'
import { Lead, KanbanCol, User, Activity } from '../../types'
import {
  TAG_LABELS, TAG_COLORS, PRIORIDADE_LABELS, PRIORIDADE_COLORS, ORIGEM_LABELS, formatCurrency
} from '../../utils/formatters'
import { genId, addLead, updateLead, getCols } from '../../utils/storage'
import { useToast } from '../../context/ToastContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar } from '../ui/Avatar'
import { getUsers } from '../../utils/storage'
import { MessageCircle } from 'lucide-react'
import { openWhatsApp } from '../../utils/whatsapp'

interface Props {
  lead: Lead | null
  open: boolean
  onClose: () => void
  user: User
  cols: KanbanCol[]
  isAdmin: boolean
  defaultColId?: string
  onReload: () => void
}

export default function LeadModal({ lead, open, onClose, user, cols, isAdmin, defaultColId, onReload }: Props) {
  const { success } = useToast()
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    getUsers().then(setUsers)
  }, [])
  const isNew = !lead

  const [tab, setTab] = useState<'info' | 'script' | 'reunioes' | 'historico'>('info')
  const [nome, setNome] = useState(lead?.nome ?? '')
  const [empresa, setEmpresa] = useState(lead?.empresa ?? '')
  const [telefone, setTelefone] = useState(lead?.telefone ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [colId, setColId] = useState(lead?.colId ?? defaultColId ?? cols[0]?.id ?? '')
  const [responsavelId, setResponsavelId] = useState(lead?.responsavelId ?? user.id)
  const [tag, setTag] = useState<Lead['tag']>(lead?.tag ?? 'outros')
  const [prioridade, setPrioridade] = useState<Lead['prioridade']>(lead?.prioridade ?? 'media')
  const [origem, setOrigem] = useState<Lead['origem']>(lead?.origem ?? 'ligacao')
  const [valor, setValor] = useState(String(lead?.valor ?? ''))
  const [venc, setVenc] = useState(lead?.venc ?? '')
  const [obs, setObs] = useState(lead?.obs ?? '')
  const [script, setScript] = useState(lead?.script ?? '')
  const [nota, setNota] = useState('')

  const tagColor = TAG_COLORS[tag]

  const handleSave = () => {
    if (!nome.trim()) return
    if (isNew) {
      const col = cols.find(c => c.id === colId)
      const responsavel = users.find(u => u.id === responsavelId)
      const newLead: Lead = {
        id: genId(),
        colId,
        nome: nome.trim(),
        empresa: empresa.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        valor: parseFloat(valor) || 0,
        venc: venc || null,
        responsavelId,
        tag,
        prioridade,
        origem,
        obs: obs.trim(),
        atividades: [{ id: genId(), txt: 'Lead criado', tipo: 'criacao', autorId: user.id, autorNome: user.nome, ts: Date.now() }],
        reunioes: [],
        script: script || col?.script || '',
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      }
      addLead(newLead)
      success('🎯 Lead criado!')
    } else {
      updateLead(lead!.id, {
        nome: nome.trim(), empresa: empresa.trim(), telefone: telefone.trim(),
        email: email.trim(), colId, responsavelId, tag, prioridade, origem,
        valor: parseFloat(valor) || 0, venc: venc || null, obs: obs.trim(), script,
        atualizadoEm: Date.now(),
      })
      success('Lead atualizado!')
    }
    onReload()
    onClose()
  }

  const addNota = () => {
    if (!nota.trim() || !lead) return
    const act: Activity = { id: genId(), txt: nota.trim(), tipo: 'anotacao', autorId: user.id, autorNome: user.nome, ts: Date.now() }
    updateLead(lead.id, { atividades: [...lead.atividades, act], atualizadoEm: Date.now() })
    setNota('')
    onReload()
    success('Anotação salva!')
  }

  const TABS = [
    { key: 'info',      label: 'Informações' },
    { key: 'script',    label: 'Script' },
    { key: 'reunioes',  label: 'Reuniões' },
    { key: 'historico', label: 'Histórico' },
  ]

  const STATUS_ICONS: Record<string, string> = { criacao: '🟡', movimento: '🔵', nota: '📝', ligacao: '📞', reuniao: '🤝', anotacao: '✍️' }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? '🎯 Novo Lead' : lead?.nome ?? ''}
      width={680}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border font-dm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-sm font-syne font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0f' }}
          >
            💾 Salvar
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: 'var(--surface2)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className="px-3 py-1.5 rounded-lg text-sm font-dm transition-all"
            style={{
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--muted)',
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} className="w-full text-sm" placeholder="Nome do lead" />
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Empresa</label>
              <input value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full text-sm" placeholder="Nome da empresa" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Telefone</label>
              <div className="relative">
                <input value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full text-sm pr-9" placeholder="(85) 99999-0000" />
                {telefone && (
                  <button onClick={() => openWhatsApp(telefone)} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <MessageCircle size={15} style={{ color: 'var(--green)' }} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full text-sm" placeholder="email@empresa.com" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Etapa (Kanban)</label>
              <select value={colId} onChange={e => setColId(e.target.value)} className="w-full text-sm">
                {cols.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Responsável</label>
              <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)} className="w-full text-sm">
                {users.filter(u => u.role === 'vendedor' && u.ativo).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Origem</label>
              <select value={origem} onChange={e => setOrigem(e.target.value as Lead['origem'])} className="w-full text-sm">
                {Object.entries(ORIGEM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Valor (R$)</label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number" className="w-full text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Vencimento</label>
              <input value={venc} onChange={e => setVenc(e.target.value)} type="date" className="w-full text-sm" />
            </div>
            <div>
              <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Prioridade</label>
              <select value={prioridade} onChange={e => setPrioridade(e.target.value as Lead['prioridade'])} className="w-full text-sm">
                {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Tag do Segmento</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setTag(k as Lead['tag'])}
                  className="px-3 py-1.5 rounded-lg text-xs border font-dm transition-all"
                  style={{
                    borderColor: tag === k ? TAG_COLORS[k] : 'var(--border)',
                    background: tag === k ? TAG_COLORS[k] + '20' : 'var(--surface2)',
                    color: tag === k ? TAG_COLORS[k] : 'var(--muted)',
                    fontWeight: tag === k ? 600 : 400,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-dm mb-1 block" style={{ color: 'var(--muted)' }}>Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} className="w-full text-sm resize-none" placeholder="Informações estratégicas sobre este lead..." />
          </div>
        </div>
      )}

      {tab === 'script' && (
        <div>
          <p className="text-sm mb-3 font-dm" style={{ color: 'var(--muted)' }}>
            Use este script na próxima ligação com este lead.
          </p>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={10}
            className="w-full text-sm resize-none"
            placeholder="Script de abordagem para esta etapa do funil..."
          />
        </div>
      )}

      {tab === 'reunioes' && lead && (
        <div>
          {lead.reunioes.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>Nenhuma reunião agendada.</p>
          ) : (
            <div className="space-y-3">
              {lead.reunioes.map(r => (
                <div key={r.id} className="rounded-xl border p-4" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm font-dm" style={{ color: 'var(--text)' }}>
                        {format(new Date(r.data), "dd 'de' MMMM", { locale: ptBR })} às {r.hora}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.local}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-dm"
                      style={{
                        background: r.status === 'agendada' ? 'rgba(64,128,240,0.15)' : r.status === 'realizada' ? 'rgba(48,208,144,0.15)' : 'rgba(224,64,96,0.15)',
                        color: r.status === 'agendada' ? 'var(--blue)' : r.status === 'realizada' ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.obs && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{r.obs}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'historico' && lead && (
        <div>
          <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
            {lead.atividades.slice().reverse().map(a => (
              <div key={a.id} className="flex gap-3">
                <span className="text-base flex-shrink-0">{STATUS_ICONS[a.tipo] ?? '📌'}</span>
                <div>
                  <p className="text-sm font-dm" style={{ color: 'var(--text)' }}>{a.txt}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {a.autorNome} • {format(new Date(a.ts), "dd/MM HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs mb-2 font-dm" style={{ color: 'var(--muted)' }}>Adicionar anotação estratégica:</p>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={3}
              className="w-full text-sm resize-none mb-2"
              placeholder="Observação sobre este lead..."
            />
            <button
              onClick={addNota}
              className="px-4 py-2 rounded-lg text-sm font-dm"
              style={{ background: 'var(--surface3)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Salvar Nota
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

const STATUS_ICONS: Record<string, string> = { criacao: '🟡', movimento: '🔵', nota: '📝', ligacao: '📞', reuniao: '🤝', anotacao: '✍️' }
