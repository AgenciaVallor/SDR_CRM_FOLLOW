import React, { useState, useRef, useEffect } from 'react'
import { User } from '@/types'
import {
  parseExcelFile,
  calcularDistribuicao,
  distribuirContatos,
  RawContact,
} from '@/utils/listImport'
import { getCalls, saveCall, getUsers } from '@/utils/storage'
import { getWeekKey, getMondayOfWeek, fmtBR } from '@/utils/weekUtils'
import { addDays } from 'date-fns'

interface UploadListaModalProps {
  isOpen: boolean
  currentWeekKey: string
  currentUserId: string
  currentUserNome: string
  currentUserRole: 'admin' | 'gerente' | 'vendedor'
  onClose: () => void
  onSuccess: () => void
}

export function UploadListaModal({
  isOpen,
  currentWeekKey,
  currentUserId,
  currentUserNome,
  currentUserRole,
  onClose,
  onSuccess,
}: UploadListaModalProps) {
  const [contacts, setContacts] = useState<RawContact[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [weekKey, setWeekKey] = useState(currentWeekKey)
  const [operadorId, setOperadorId] = useState(currentUserId)
  const [operadorNome, setOperadorNome] = useState(currentUserNome)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    getUsers().then(u => setUsers(u.filter((u: User) => u.role === 'vendedor' && u.ativo)))
  }, [])
  const distribuicao = contacts.length > 0 ? calcularDistribuicao(contacts.length, weekKey) : []

  const thisWeek = getWeekKey(new Date())
  const nextMonday = addDays(getMondayOfWeek(thisWeek), 7)
  const nextWeek = getWeekKey(nextMonday)

  if (!isOpen) return null

  async function handleFile(file: File) {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const parsed = await parseExcelFile(file)
      if (parsed.length === 0) {
        setError('Nenhum contato com telefone válido encontrado no arquivo.')
        setContacts([])
        setFileName('')
      } else {
        setContacts(parsed)
        setFileName(file.name)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar arquivo.')
      setContacts([])
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleResponsavelChange(userId: string) {
    const user = users.find(u => u.id === userId)
    if (user) {
      setOperadorId(user.id)
      setOperadorNome(user.nome)
    }
  }

  async function handleImportar() {
    if (contacts.length === 0) return
    const existing = await getCalls()
    const { calls, duplicatasIgnoradas } = distribuirContatos(
      contacts,
      weekKey,
      operadorId,
      operadorNome,
      existing
    )
    for (const call of calls) {
      await saveCall(call)
    }
    const total = calls.length
    const msg = duplicatasIgnoradas > 0
      ? `✅ ${total} contatos importados! ${duplicatasIgnoradas} duplicatas ignoradas.`
      : `✅ ${total} contatos importados e distribuídos na semana!`
    alert(msg)
    onSuccess()
    onClose()
    setContacts([])
    setFileName('')
  }

  const capped = Math.min(contacts.length, 250)
  const excedente = contacts.length > 250

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--s1)', zIndex: 10,
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px' }}>
            📋 Upload Lista Semanal
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, background: 'var(--s2)',
              border: '1px solid var(--border)', borderRadius: '7px',
              color: 'var(--text)', cursor: 'pointer', fontSize: '14px',
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${contacts.length > 0 ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              color: contacts.length > 0 ? 'var(--green)' : 'var(--muted)',
              background: contacts.length > 0 ? 'rgba(48,208,144,0.05)' : 'var(--s2)',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
            {loading ? (
              <div>⏳ Processando arquivo...</div>
            ) : contacts.length > 0 ? (
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{fileName}</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {contacts.length} contatos encontrados
                  {excedente && <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>
                    (apenas os primeiros 250 serão importados)
                  </span>}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Arraste o arquivo aqui</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>ou clique para selecionar</div>
                <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--muted)' }}>
                  Aceita .xlsx · .csv · máximo 250 contatos
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(224,64,96,0.1)',
              border: '1px solid rgba(224,64,96,0.3)', borderRadius: '8px',
              color: 'var(--red)', fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Preview */}
          {contacts.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '8px' }}>
                Prévia (primeiros 3 contatos)
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {contacts.slice(0, 3).map((c, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    fontSize: '12px', display: 'flex', gap: '12px',
                  }}>
                    <span style={{ color: 'var(--muted)', minWidth: '20px' }}>{i + 1}</span>
                    <span style={{ color: 'var(--text)', flex: 1 }}>{c.nome || 'Sem nome'}</span>
                    <span style={{ color: 'var(--muted)', flex: 1 }}>{c.empresa || '—'}</span>
                    <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{c.telefone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Semana target */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
              Semana Alvo
            </div>
            <select
              value={weekKey}
              onChange={e => setWeekKey(e.target.value)}
              style={{
                width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
                fontSize: '13px', outline: 'none',
              }}
            >
              <option value={thisWeek}>Esta semana</option>
              <option value={nextWeek}>Próxima semana</option>
            </select>
          </div>

          {/* Responsável (admin only) */}
          {currentUserRole === 'admin' && users.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
                Responsável
              </div>
              <select
                value={operadorId}
                onChange={e => handleResponsavelChange(e.target.value)}
                style={{
                  width: '100%', background: 'var(--s2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
                  fontSize: '13px', outline: 'none',
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Distribuição */}
          {distribuicao.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '8px' }}>
                Como será distribuído
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {distribuicao.map((d, i) => {
                  const nomes = { segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta' } as const
                  return (
                    <div key={d.dia} style={{
                      padding: '10px 14px',
                      borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {nomes[d.dia as keyof typeof nomes]} · {fmtBR(d.dateStr)}
                      </span>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: d.quantidade === 50 ? 'var(--green)' : 'var(--accent)',
                        fontWeight: 700,
                      }}>
                        {d.quantidade} contatos
                      </span>
                    </div>
                  )
                })}
                <div style={{
                  padding: '10px 14px', background: 'rgba(240,192,64,0.08)',
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '13px', fontWeight: 700,
                }}>
                  <span style={{ color: 'var(--accent)' }}>Total</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {capped} contatos
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
          position: 'sticky', bottom: 0, background: 'var(--s1)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: '8px', background: 'var(--s2)',
              border: '1px solid var(--border)', color: 'var(--text)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleImportar}
            disabled={contacts.length === 0}
            style={{
              padding: '8px 18px', borderRadius: '8px',
              background: contacts.length === 0 ? 'var(--s3)' : 'var(--accent)',
              border: 'none',
              color: contacts.length === 0 ? 'var(--muted)' : '#0a0a0f',
              cursor: contacts.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ✅ Importar e Distribuir
          </button>
        </div>
      </div>
    </div>
  )
}
