// src/components/layout/Sidebar.tsx
import React from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Phone, Bell, Target,
  Users, Settings, Trophy, MessageSquare, Flame,
  Handshake, LogOut, ChevronRight
} from 'lucide-react'
import { User } from '../../types'

interface NavItem {
  key: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { key: 'semana',        label: 'Semana Atual',     icon: Calendar },
  { key: 'ligacoes',      label: 'Ligações',         icon: Phone },
  { key: 'followup',      label: 'Follow-up',        icon: Bell },
  { key: 'kanban',        label: 'Kanban Pipeline',  icon: Target },
  { key: 'reunioes',      label: 'Reuniões',         icon: Handshake },
  { key: 'cadencia',      label: 'Cadência',         icon: Flame },
  { key: 'whatsapp',      label: 'WhatsApp Export',  icon: MessageSquare },
]

const ADMIN_ITEMS: NavItem[] = [
  { key: 'ranking',       label: 'Ranking Equipe',   icon: Trophy },
  { key: 'usuarios',      label: 'Usuários',         icon: Users },
  { key: 'configuracoes', label: 'Configurações',    icon: Settings },
]

interface Props {
  page: string
  setPage: (p: string) => void
  user: User | null
  onLogout: () => void
  followupCount?: number
}

export default function Sidebar({ page, setPage, user, onLogout, followupCount = 0 }: Props) {
  const isAdmin = user?.role === 'admin'

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 220,
        minWidth: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="font-syne font-black text-2xl tracking-tight" style={{ color: 'var(--accent)' }}>
          VALLOR
        </div>
        <div className="text-xs mt-0.5 font-dm" style={{ color: 'var(--muted)' }}>Sales CRM</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavBtn
            key={item.key}
            item={item}
            active={page === item.key}
            onClick={() => setPage(item.key)}
            badge={item.key === 'followup' ? followupCount : 0}
          />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t" style={{ borderColor: 'var(--border)' }} />
            {ADMIN_ITEMS.map(item => (
              <NavBtn
                key={item.key}
                item={item}
                active={page === item.key}
                onClick={() => setPage(item.key)}
              />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 rounded-lg p-2" style={{ background: 'var(--surface2)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-syne font-bold text-sm flex-shrink-0"
            style={{ background: user?.avatar ?? '#f0c040', color: '#0a0a0f' }}
          >
            {user?.nome?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.nome}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {user?.role === 'admin' ? 'Admin' : 'Vendedor'}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="opacity-50 hover:opacity-100 transition-opacity"
            title="Sair"
          >
            <LogOut size={14} style={{ color: 'var(--text)' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavBtn({ item, active, onClick, badge = 0 }: {
  item: NavItem
  active: boolean
  onClick: () => void
  badge?: number
}) {
  const Icon = item.icon
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
      style={{
        background: active ? 'rgba(240,192,64,0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
      }}
    >
      <Icon size={16} />
      <span className="flex-1 text-left font-dm">{item.label}</span>
      {badge > 0 && (
        <span
          className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center relative"
          style={{ background: 'var(--red)', color: '#fff' }}
        >
          {badge > 9 ? '9+' : badge}
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'var(--red)', opacity: 0.4 }}
          />
        </span>
      )}
      {active && (
        <div
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </motion.button>
  )
}
