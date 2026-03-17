// src/App.tsx — Main app with routing and polling
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Session, User } from './types'
import { ToastProvider } from './context/ToastContext'
import { runSeed } from './utils/seed'
import { useAuth } from './hooks/useAuth'
import { useCalls } from './hooks/useCalls'
import { useLeads } from './hooks/useLeads'
import { useAlerts } from './hooks/useAlerts'
import { isBusinessHours } from './utils/weekUtils'
import { loginUser, logoutUser, getCurrentSession, getCalls, getUsers } from './utils/storage'
import { format } from 'date-fns'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import CallModal from './components/shared/CallModal'
import { OnboardingModal } from './components/shared/OnboardingModal'

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

// validateSession removed - logic moved to getCurrentSession

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

function AppInner() {
  const { user, login, logout, isAdmin, setUser, loading: authLoading } = useAuth()
  const [appLoading, setAppLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    getCurrentSession().then(u => {
      if (u) setUser(u)
      setAppLoading(false)
    })
  }, [setUser])

  const [page, setPage] = useState('dashboard')
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [callModalPrefill, setCallModalPrefill] = useState<any>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  
  const { calls, add: addCall, reload: reloadCalls, getTodayStats, getFollowups, loading: callsLoading } = useCalls(user?.id, isAdmin)
  const { leads, add: addLead, update: updateLead, moveColumn, reload: reloadLeads, getPipelineValue, loading: leadsLoading } = useLeads(user?.id, isAdmin)
  const { alerts, checkInactivity } = useAlerts()

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showOnboarding, setShowOnboarding] = useState(() => {
    const alreadySeenThisSession = sessionStorage.getItem('vallor_onboarding_shown')
    return !alreadySeenThisSession
  })

  function handleOnboardingConcluir() {
    sessionStorage.setItem('vallor_onboarding_shown', 'true')
    setShowOnboarding(false)
  }

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

  const [allUsers, setAllUsers] = useState<User[]>([])
  useEffect(() => {
    if (isAdmin) {
      getUsers().then(setAllUsers)
    }
  }, [isAdmin])

  const openCallModal = useCallback((prefill?: any) => {
    setCallModalPrefill(prefill ?? null)
    setCallModalOpen(true)
  }, [])

  async function handleLogin(email: string, senha: string) {
    setLoginLoading(true)
    setLoginError('')
    const u = await login(email, senha)
    if (!u) {
      setLoginError('Usuário ou senha incorretos.')
    }
    setLoginLoading(false)
  }

  async function handleLogout() {
    await logout()
  }

  if (appLoading || authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#fff' }}>Carregando...</div>
  }

  if (!user) {
    return (
      <AnimatePresence>
        <Login onLogin={handleLogin} loading={loginLoading} error={loginError} />
      </AnimatePresence>
    )
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard user={user} isAdmin={isAdmin} calls={calls} pipelineValue={pipelineValue} alerts={alerts} setPage={setPage} />
      case 'semana':
        return <SemanaAtual user={user} isAdmin={isAdmin} users={allUsers} onNewCall={openCallModal} />
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
      {callModalOpen && user && (
        <CallModal
          open={callModalOpen}
          onClose={() => setCallModalOpen(false)}
          onSave={async (call: any) => {
            await addCall(call)
            reloadCalls()
          }}
          userId={user.id}
          userName={user.nome}
          prefill={callModalPrefill}
          todayStats={todayStats}
        />
      )}

      {showOnboarding && user && (
        <OnboardingModal
          nomeUsuario={user.nome}
          onConcluir={handleOnboardingConcluir}
        />
      )}
    </div>
  )
}
