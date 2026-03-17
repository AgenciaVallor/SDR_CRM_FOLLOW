import { useState } from 'react'
import { SCRIPTS, OBJECOES } from '@/data/treinamento'

interface ScriptPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ScriptPanel({ isOpen, onClose }: ScriptPanelProps) {
  const [tab, setTab] = useState<'scripts' | 'objecoes'>('scripts')
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0])

  if (!isOpen) return null

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--accent)' : 'var(--s2)',
    color: active ? '#0a0a0f' : 'var(--muted)',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        width: '720px',
        maxWidth: '96vw',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--s1)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '17px' }}>
              📋 Scripts & Objeções — Vallor
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Use antes e durante a ligação. Seja dinâmico — não seja um robô.
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, background: 'var(--s2)',
            border: '1px solid var(--border)', borderRadius: '7px',
            color: 'var(--text)', cursor: 'pointer', fontSize: '14px',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button style={tabStyle(tab === 'scripts')} onClick={() => setTab('scripts')}>📞 Scripts de Abordagem</button>
          <button style={tabStyle(tab === 'objecoes')} onClick={() => setTab('objecoes')}>🛡️ Quebrando Objeções</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {tab === 'scripts' && (
            <>
              {/* Script selector */}
              <div style={{
                width: '200px', borderRight: '1px solid var(--border)',
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px',
                overflowY: 'auto', flexShrink: 0,
              }}>
                {SCRIPTS.map(s => (
                  <button key={s.id} onClick={() => setSelectedScript(s)} style={{
                    padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                    cursor: 'pointer', border: 'none',
                    background: selectedScript.id === s.id ? 'rgba(240,192,64,0.12)' : 'transparent',
                    color: selectedScript.id === s.id ? 'var(--accent)' : 'var(--muted)',
                    fontSize: '12px', fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.15s',
                  }}>
                    {s.titulo}
                  </button>
                ))}
              </div>

              {/* Script content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '15px', marginBottom: '16px', color: 'var(--accent)',
                }}>
                  {selectedScript.titulo}
                </div>
                <div style={{
                  background: 'var(--s2)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '18px 20px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                  lineHeight: '1.9', color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedScript.conteudo}
                </div>
              </div>
            </>
          )}

          {tab === 'objecoes' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {OBJECOES.map(o => (
                <div key={o.id} style={{
                  background: 'var(--s2)', border: '1px solid var(--border)',
                  borderRadius: '10px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(224,64,96,0.08)',
                    borderBottom: '1px solid var(--border)',
                    fontWeight: 700, fontSize: '13px', color: 'var(--red)',
                  }}>
                    {o.gatilho}
                  </div>
                  <div style={{
                    padding: '14px 16px',
                    fontSize: '13px', lineHeight: '1.8',
                    color: 'var(--text)', whiteSpace: 'pre-wrap',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {o.resposta}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
