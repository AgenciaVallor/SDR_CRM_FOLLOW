// src/App.tsx — Main app with routing and polling
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ToastProvider } from './context/ToastContext'
import { runSeed } from './utils/seed'
import { useAuth } from './hooks/useAuth'
import { useCalls } from './hooks/useCalls'
import { useLeads } from './hooks/useLeads'
import { useAlerts } from './hooks/useAlerts'
import { isBusinessHours } from './utils/weekUtils'
import { getCalls } from './utils/storage'
import { getUsers } from './utils/storage'
import { format } from 'date-fns'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import CallModal from './components/shared/CallModal'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SemanaAtual from './pages/SemanaAtual'
import Ligacoes from './pages/Ligacoes'
import FollowUp from './pages/FollowUp'
import Kanban from './pages/Kanban'
import Reunioes from './pages/Reunioes'
import Cadencia from './pages/Cadencia'
import WhatsApp from './pages/WhatsApp'
import Ranking from './pages/Ranking'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'

// Run seed before first render
runSeed()

function validateSession(): boolean {
  const raw = sessionStorage.getItem('vallor_session')
  if (!raw) return false
  try {
    const session = JSON.parse(raw)
    const users = getUsers()
    const user = users.find(u => u.id === session.userId)
    if (!user || !user.ativo) {
      sessionStorage.removeItem('vallor_session')
      return false
    }
    return true
  } catch {
    sessionStorage.removeItem('vallor_session')
    return false
  }
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

function AppInner() {
  const { session, user, login, logout, isAdmin } = useAuth()
  
  // Validate session on every protected render
  const isSessionValid = validateSession()

  const [page, setPage] = useState('dashboard')
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [callModalPrefill, setCallModalPrefill] = useState<any>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const { calls, add: addCall, reload: reloadCalls, getTodayStats, getFollowups } = useCalls(user?.id, isAdmin)
  const { leads, add: addLead, update: updateLead, moveColumn, reload: reloadLeads, getPipelineValue } = useLeads(user?.id, isAdmin)
  const { alerts, checkInactivity } = useAlerts()

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Inactivity polling every 60s
  useEffect(() => {
    if (!isAdmin) return
    checkInactivity()
    pollingRef.current = setInterval(() => { checkInactivity() }, 60000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [isAdmin, checkInactivity])

  const followupCount = useMemo(() => {
    if (!user) return 0
    const today = format(new Date(), 'yyyy-MM-dd')
    return getFollowups(isAdmin ? undefined : user.id).filter(c => c.followupData && c.followupData <= today).length
  }, [calls, user, isAdmin, getFollowups])

  const todayStats = user ? getTodayStats(user.id) : { ligacoes: 0, reunioes: 0 }
  const pipelineValue = getPipelineValue()
  const users = getUsers()

  const openCallModal = useCallback((prefill?: any) => {
    setCallModalPrefill(prefill ?? null)
    setCallModalOpen(true)
  }, [])

  const handleSaveCall = useCallback((call: any) => {
    addCall(call)
    reloadCalls()
  }, [addCall, reloadCalls])

  if (!session || !user || !isSessionValid) {
    return (
      <AnimatePresence>
        <Login onLogin={login} />
      </AnimatePresence>
    )
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard user={user} isAdmin={isAdmin} calls={calls} pipelineValue={pipelineValue} alerts={alerts} setPage={setPage} />
      case 'semana':
        return <SemanaAtual user={user} isAdmin={isAdmin} users={users} onNewCall={openCallModal} />
      case 'ligacoes':
        return <Ligacoes calls={calls} user={user} isAdmin={isAdmin} onNewCall={() => openCallModal()} />
      case 'followup':
        return <FollowUp calls={calls} user={user} isAdmin={isAdmin} onNewCall={openCallModal} onReload={reloadCalls} />
      case 'kanban':
        return <Kanban leads={leads} user={user} isAdmin={isAdmin} onReload={reloadLeads} />
      case 'reunioes':
        return <Reunioes user={user} isAdmin={isAdmin} />
      case 'cadencia':
        return <Cadencia user={user} isAdmin={isAdmin} />
      case 'whatsapp':
        return <WhatsApp user={user} isAdmin={isAdmin} calls={calls} />
      case 'ranking':
        if (!isAdmin) { setTimeout(() => setPage('dashboard'), 0); return null; }
        return <Ranking user={user} />
      case 'usuarios':
        if (!isAdmin) { setTimeout(() => setPage('dashboard'), 0); return null; }
        return <Usuarios onReload={reloadCalls} />
      case 'configuracoes':
        if (!isAdmin) { setTimeout(() => setPage('dashboard'), 0); return null; }
        return <Configuracoes />
      default:
        return <Dashboard user={user} isAdmin={isAdmin} calls={calls} pipelineValue={pipelineValue} alerts={alerts} setPage={setPage} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={logout}
        followupCount={followupCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          page={page}
          user={user}
          onNewCall={() => openCallModal()}
          onNewLead={() => setNewLeadOpen(true)}
        />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full overflow-y-auto"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Call Modal */}
      {user && (
        <CallModal
          open={callModalOpen}
          onClose={() => { setCallModalOpen(false); setCallModalPrefill(null) }}
          onSave={handleSaveCall}
          userId={user.id}
          userName={user.nome}
          todayStats={todayStats}
          prefill={callModalPrefill}
        />
      )}
    </div>
  )
}
