// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { Session, User } from '../types'
import { getUsers, getSession, setSession, clearSession } from '../utils/storage'

export function useAuth() {
  const [session, setSessionState] = useState<Session | null>(getSession)
  const [user, setUser] = useState<User | null>(() => {
    const s = getSession()
    return s ? (getUsers().find(u => u.id === s.userId) ?? null) : null
  })

  const login = useCallback((email: string, senha: string): boolean => {
    const users = getUsers()
    const found = users.find(u => u.email === email && u.senha === senha && u.ativo)
    if (!found) return false
    const s: Session = {
      userId: found.id,
      nome: found.nome,
      email: found.email,
      role: found.role,
    }
    setSession(s)
    setSessionState(s)
    setUser(found)
    return true
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSessionState(null)
    setUser(null)
  }, [])

  const isAdmin = session?.role === 'admin'

  return { session, user, login, logout, isAdmin, isLoggedIn: !!session }
}
