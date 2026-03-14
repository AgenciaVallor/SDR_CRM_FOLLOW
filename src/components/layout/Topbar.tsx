// src/components/layout/Topbar.tsx
import React, { useState } from 'react'
import { Phone, Target, Search, Bell, ChevronRight } from 'lucide-react'
import { User } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'

const PAGE_LABELS: Record<string, string> = {
  dashboard:     'Dashboard',
  semana:        'Semana Atual',
  ligacoes:      'Ligações',
  followup:      'Follow-up',
  kanban:        'Kanban Pipeline',
  reunioes:      'Reuniões',
  cadencia:      'Cadência',
  whatsapp:      'WhatsApp Export',
  ranking:       'Ranking da Equipe',
  usuarios:      'Usuários',
  configuracoes: 'Configurações',
}

interface Props {
  page: string
  user: User | null
  onNewCall: () => void
  onNewLead: () => void
}

export default function Topbar({ page, user, onNewCall, onNewLead }: Props) {
  const [search, setSearch] = useState('')

  return (
    <header
      className="flex items-center gap-4 px-6"
      style={{
        height: 58,
        minHeight: 58,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
        <span style={{ color: 'var(--muted)' }} className="font-dm">VALLOR</span>
        <ChevronRight size={12} style={{ color: 'var(--border)' }} />
        <span style={{ color: 'var(--text)' }} className="font-dm font-medium">
          {PAGE_LABELS[page] ?? page}
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar contato, lead..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
          style={{ fontSize: 13 }}
        />
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onNewCall}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-dm"
          style={{ background: 'var(--accent)', color: '#0a0a0f' }}
        >
          <Phone size={14} />
          Registrar Ligação
        </motion.button>

        <motion.button
          onClick={onNewLead}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border font-dm"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface2)' }}
        >
          <Target size={14} />
          Novo Lead
        </motion.button>

        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  )
}
