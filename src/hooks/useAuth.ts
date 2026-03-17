import { useState, useCallback } from 'react'
import { User } from '../types'
import { loginUser, logoutUser } from '../utils/storage'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = useCallback(async (email: string, senha: string): Promise<boolean> => {
    const found = await loginUser(email, senha)
    if (!found) return false
    setUser(found)
    return true
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return { user, login, logout, isAdmin, isLoggedIn: !!user, loading, setUser }
}
