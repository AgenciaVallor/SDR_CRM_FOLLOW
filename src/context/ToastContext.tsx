// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { ToastItem } from '../types'
import { genId } from '../utils/storage'

interface ToastContextType {
  addToast: (message: string, type?: ToastItem['type'], duration?: number) => void
  success: (msg: string) => void
  error: (msg: string) => void
  warn: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const COLORS = {
  success: '#30d090',
  error:   '#e04060',
  warning: '#f0c040',
  info:    '#4080f0',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'success', duration = 4000) => {
    const id = genId()
    setToasts(t => [...t, { id, message, type, duration }])
    setTimeout(() => remove(id), duration)
  }, [remove])

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast])
  const error   = useCallback((msg: string) => addToast(msg, 'error',   5000), [addToast])
  const warn    = useCallback((msg: string) => addToast(msg, 'warning'), [addToast])
  const info    = useCallback((msg: string) => addToast(msg, 'info'),    [addToast])

  return (
    <ToastContext.Provider value={{ addToast, success, error, warn, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = ICONS[toast.type]
            const color = COLORS[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-2xl border"
                style={{
                  background: 'var(--surface)',
                  borderColor: color + '40',
                  boxShadow: `0 4px 24px ${color}20`,
                }}
              >
                <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm leading-snug flex-1" style={{ color: 'var(--text)' }}>{toast.message}</p>
                <button
                  onClick={() => remove(toast.id)}
                  className="opacity-40 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text)', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
