// src/pages/Login.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Lock, User, Eye, EyeOff } from 'lucide-react'

interface Props {
  onLogin: (email: string, senha: string) => Promise<void>
  loading?: boolean
  error?: string
}

export default function Login({ onLogin, loading, error }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [internalError, setInternalError] = useState('')
  const [shaking, setShaking] = useState(false)
  
  const displayError = error || internalError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalError('')
    await onLogin(email, senha)
    if (error || internalError) {
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden grid-bg"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(240,192,64,0.07) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(64,128,240,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="font-syne font-black text-6xl tracking-tighter"
            style={{ color: 'var(--accent)', textShadow: '0 0 40px rgba(240,192,64,0.3)' }}
          >
            VALLOR
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm mt-3 font-dm"
            style={{ color: 'var(--muted)' }}
          >
            Sistema de Alta Performance
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-xs mt-1 font-syne font-semibold"
            style={{ color: 'var(--accent)', opacity: 0.8 }}
          >
            50 ligações • 5 agendamentos • Todo dia
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          animate={shaking ? { x: [-4, 4, -4, 4, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-8 border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <h1 className="font-syne font-bold text-xl mb-6" style={{ color: 'var(--text)' }}>
            Entrar no Sistema
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full pl-9 pr-4 py-3 text-sm"
                required
                autoComplete="email"
                type="email"
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-9 pr-10 py-3 text-sm"
                required
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <AnimatePresence>
              {displayError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs rounded-lg px-3 py-2 font-dm"
                  style={{ color: 'var(--red)', background: 'rgba(224,64,96,0.1)' }}
                >
                  {displayError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl font-syne font-bold text-sm tracking-wide mt-2 transition-opacity"
              style={{
                background: 'var(--accent)',
                color: '#0a0a0f',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
