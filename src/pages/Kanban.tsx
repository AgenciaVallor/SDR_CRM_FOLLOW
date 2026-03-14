// src/pages/Kanban.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Edit2, MessageCircle } from 'lucide-react'
import { Lead, KanbanCol, User } from '../types'
import { getCols, getUsers, updateLead, genId, addLead } from '../utils/storage'
import { TAG_COLORS, TAG_LABELS, PRIORIDADE_COLORS, formatCurrency } from '../utils/formatters'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { openWhatsApp } from '../utils/whatsapp'
import { format, isPast, parseISO } from 'date-fns'
import LeadModal from '../components/shared/LeadModal'

interface Props {
  leads: Lead[]
  user: User
  isAdmin: boolean
  onReload: () => void
}

export default function Kanban({ leads, user, isAdmin, onReload }: Props) {
  const [cols] = useState(() => getCols().sort((a, b) => a.ordem - b.ordem))
  const users = getUsers()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLeadCol, setNewLeadCol] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterResp, setFilterResp] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filteredLeads = useMemo(() => {
    let base = isAdmin ? leads : leads.filter(l => l.responsavelId === user.id)
    if (search) {
      const q = search.toLowerCase()
      base = base.filter(l => l.nome.toLowerCase().includes(q) || l.empresa.toLowerCase().includes(q))
    }
    if (filterTag) base = base.filter(l => l.tag === filterTag)
    if (filterResp) base = base.filter(l => l.responsavelId === filterResp)
    return base
  }, [leads, search, filterTag, filterResp, isAdmin, user.id])

  const getLeadsForCol = (colId: string) => filteredLeads.filter(l => l.colId === colId)
  const getColValue = (colId: string) => getLeadsForCol(colId).reduce((s, l) => s + l.valor, 0)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) { setActiveId(null); return }
    const col = cols.find(c => c.id === over.id)
    if (col) {
      updateLead(String(active.id), { colId: col.id, atualizadoEm: Date.now() })
      onReload()
    }
    setActiveId(null)
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  const totalPipeline = useMemo(() =>
    leads.filter(l => !cols.find(c => c.id === l.colId)?.isLost).reduce((s, l) => s + l.valor, 0)
  , [leads, cols])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-4 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-1">
          <h1 className="font-syne font-black text-lg" style={{ color: 'var(--text)' }}>Kanban Pipeline</h1>
          <p className="text-xs mt-0.5 font-dm" style={{ color: 'var(--muted)' }}>
            {filteredLeads.length} leads • <span style={{ color: 'var(--green)' }}>{formatCurrency(totalPipeline)}</span> em pipeline
          </p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar lead..."
          className="text-sm px-3 py-2 rounded-lg w-48"
        />
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="text-sm px-3 py-2 rounded-lg">
          <option value="">Todas as tags</option>
          {Object.entries(TAG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {isAdmin && (
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="text-sm px-3 py-2 rounded-lg">
            <option value="">Todos</option>
            {users.filter(u => u.role === 'vendedor').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(String(e.active.id))} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max h-full">
            {cols.map(col => {
              const colLeads = getLeadsForCol(col.id)
              return (
                <SortableContext key={col.id} id={col.id} items={colLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div
                    className="flex flex-col rounded-2xl border flex-shrink-0"
                    style={{ width: 280, background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    {/* Col header */}
                    <div
                      className="px-4 py-3 rounded-t-2xl border-b flex items-center justify-between"
                      style={{
                        borderBottom: `2px solid ${col.cor}`,
                        background: col.cor + '12',
                      }}
                    >
                      <div>
                        <p className="font-syne font-bold text-sm" style={{ color: col.cor }}>{col.nome}</p>
                        <p className="text-xs font-dm" style={{ color: 'var(--muted)' }}>
                          {colLeads.length} leads • {formatCurrency(getColValue(col.id))}
                        </p>
                      </div>
                      <button
                        onClick={() => setNewLeadCol(col.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ background: col.cor + '30', color: col.cor }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {colLeads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          users={users}
                          onClick={() => setSelectedLead(lead)}
                        />
                      ))}
                      {colLeads.length === 0 && (
                        <div className="text-center py-8" style={{ color: 'var(--border)' }}>
                          <p className="text-xs">Sem leads aqui</p>
                        </div>
                      )}
                    </div>
                  </div>
                </SortableContext>
              )
            })}
          </div>
          <DragOverlay>
            {activeLead && (
              <div style={{ opacity: 0.9, transform: 'scale(1.03)' }}>
                <LeadCard lead={activeLead} users={users} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => { setSelectedLead(null); onReload() }}
          user={user}
          cols={cols}
          isAdmin={isAdmin}
          onReload={onReload}
        />
      )}
      {newLeadCol && (
        <LeadModal
          lead={null}
          open={!!newLeadCol}
          onClose={() => { setNewLeadCol(null); onReload() }}
          user={user}
          cols={cols}
          isAdmin={isAdmin}
          defaultColId={newLeadCol}
          onReload={onReload}
        />
      )}
    </div>
  )
}

function LeadCard({ lead, users, onClick }: { lead: Lead; users: User[]; onClick: () => void }) {
  const resp = users.find(u => u.id === lead.responsavelId)
  const tagColor = TAG_COLORS[lead.tag] ?? '#7070a0'
  const isVencido = lead.venc && isPast(parseISO(lead.venc))
  const temReuniao = lead.reunioes.some(r => r.status === 'agendada')

  return (
    <motion.div
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="rounded-xl border cursor-pointer transition-all"
      style={{
        background: 'var(--surface2)',
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${tagColor}`,
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge color={tagColor} size="sm">{TAG_LABELS[lead.tag]}</Badge>
          {lead.prioridade === 'alta' && (
            <span className="text-xs" style={{ color: 'var(--red)' }}>● Alta</span>
          )}
        </div>
        <p className="font-syne font-bold text-sm leading-snug" style={{ color: 'var(--text)' }}>{lead.nome}</p>
        {lead.empresa && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{lead.empresa}</p>
        )}
        {lead.valor > 0 && (
          <p className="text-sm font-syne font-bold mt-2" style={{ color: 'var(--green)' }}>
            {formatCurrency(lead.valor)}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {resp && <Avatar nome={resp.nome} color={resp.avatar} size={20} />}
            {temReuniao && <span className="text-xs" style={{ color: 'var(--green)' }}>🤝</span>}
            {lead.atividades.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{lead.atividades.length} ativ.</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {lead.venc && (
              <span className="text-xs" style={{ color: isVencido ? 'var(--red)' : 'var(--muted)' }}>
                {isVencido ? '⚠️ ' : '📅 '}{format(parseISO(lead.venc), 'dd/MM')}
              </span>
            )}
            {lead.telefone && (
              <button
                onClick={e => { e.stopPropagation(); openWhatsApp(lead.telefone) }}
                className="opacity-40 hover:opacity-100 transition-opacity ml-1"
              >
                <MessageCircle size={13} style={{ color: 'var(--green)' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
