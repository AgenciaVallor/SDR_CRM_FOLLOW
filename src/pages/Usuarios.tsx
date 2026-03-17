import { useState, useEffect } from 'react'
import { getUsers, updateUser, deleteUser } from '../utils/storage'
import { User } from '../types'
import { supabase } from '../lib/supabase'

const AVATAR_COLORS = [
  '#f0c040', '#4080f0', '#30d090', '#e04060',
  '#8050d0', '#e05a30', '#20a0c0', '#c060a0'
]

export default function Usuarios({ onReload }: { onReload?: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmSenha: '',
    role: 'vendedor' as 'admin' | 'gerente' | 'vendedor',
    metaDiariaLigacoes: 50, metaDiariaReunioes: 5,
    avatar: '#f0c040', ativo: true,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sessionRaw = sessionStorage.getItem('vallor_session')
  const session = sessionRaw ? JSON.parse(sessionRaw) : {}

  async function refreshUsers() {
    setLoading(true)
    try {
      const all = await getUsers()
      setUsers(all)
      onReload?.()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  function openCreate() {
    setEditingUser(null)
    setForm({
      nome: '', email: '', senha: '', confirmSenha: '',
      role: 'vendedor', metaDiariaLigacoes: 50,
      metaDiariaReunioes: 5, avatar: '#f0c040', ativo: true,
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setForm({
      nome: user.nome, email: user.email, senha: '', confirmSenha: '',
      role: user.role, metaDiariaLigacoes: user.metaDiariaLigacoes,
      metaDiariaReunioes: user.metaDiariaReunioes ?? 5,
      avatar: user.avatar, ativo: user.ativo,
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!form.email.trim()) { setFormError('Email é obrigatório.'); return }

    setSubmitting(true)
    try {
      if (!editingUser) {
        if (!form.senha || form.senha.length < 6) {
          setFormError('Senha obrigatória com mínimo 6 caracteres.'); return
        }
        if (form.senha !== form.confirmSenha) {
          setFormError('As senhas não coincidem.'); return
        }

        const userData = {
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          senha: form.senha,
          role: form.role,
          avatar: form.avatar,
          metaDiariaLigacoes: form.metaDiariaLigacoes,
          metaDiariaReunioes: form.metaDiariaReunioes,
        }

        const response = await supabase.functions.invoke('create-user', { body: userData })

        if (response.error) {
          const msg = response.error.message || 'Erro ao criar usuário'
          setFormError(msg)
          return
        }
        if (response.data?.error) {
          setFormError(response.data.error)
          return
        }
      } else {
        if (form.senha && form.senha.length < 6) {
          setFormError('Nova senha precisa ter mínimo 6 caracteres.'); return
        }
        if (form.senha && form.senha !== form.confirmSenha) {
          setFormError('As senhas não coincidem.'); return
        }

        const isMaster = editingUser.email === 'valloragencia@gmail.com'
        
        const { data, error } = await supabase.functions.invoke('update-user', {
          body: {
            userId: editingUser.id,
            updates: {
              nome: form.nome.trim(),
              role: form.role,
              avatar: form.avatar,
              meta_ligacoes: form.metaDiariaLigacoes,
              meta_reunioes: form.metaDiariaReunioes,
              ativo: isMaster ? true : form.ativo,
            },
            novaSenha: form.senha.length >= 6 ? form.senha : undefined,
          },
        })

        if (error) { setFormError('Erro: ' + error.message); return }
        if (data?.error) { setFormError(data.error); return }

        if (editingUser.id === session.userId && !form.ativo) {
          sessionStorage.removeItem('vallor_session')
          window.location.href = '/'
          return
        }
      }

      await refreshUsers()
      setModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(user: User) {
    if (user.email === 'valloragencia@gmail.com') {
      alert('O administrador master não pode ser excluído.')
      return
    }
    if (user.id === session.userId) {
      alert('Você não pode excluir sua própria conta.')
      return
    }
    const confirmed = confirm(
      `Excluir "${user.nome}"?\n\nEsta ação remove o acesso imediatamente.`
    )
    if (!confirmed) return

    setLoading(true)
    try {
      const result = await deleteUser(user.id)
      if (!result.success) {
        alert(result.error || 'Erro ao excluir usuário.')
      } else {
        await refreshUsers()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtivo(user: User) {
    if (user.email === 'valloragencia@gmail.com') return
    setLoading(true)
    try {
      const result = await updateUser(user.id, { ativo: !user.ativo })
      if (!result.success) {
        alert(result.error || 'Erro ao mudar status do usuário.')
      } else {
        await refreshUsers()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '26px', letterSpacing: '-0.5px', color: 'var(--text)'
          }}>
            Usuários
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
            Gerencie colaboradores e permissões de acesso.
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '9px 20px', borderRadius: '8px',
            background: 'var(--accent)', border: 'none',
            color: '#0a0a0f', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          + Novo Colaborador
        </button>
      </div>

      {/* Users list */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden', minHeight: '100px'
      }}>
        {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Carregando colaboradores...</div>}
        {!loading && users.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Nenhum colaborador encontrado.</div>}
        {!loading && users.map((user, i) => {
          const isMaster = user.email === 'valloragencia@gmail.com'
          const isCurrentUser = user.id === session.userId
          return (
            <div
              key={user.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 20px',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: user.ativo ? 1 : 0.55,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: user.avatar, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '15px', color: '#0a0a0f', flexShrink: 0,
              }}>
                {user.nome[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  {user.nome}
                  {isCurrentUser && (
                    <span style={{
                      fontSize: '10px', color: 'var(--muted)',
                      marginLeft: '8px', fontWeight: 400
                    }}>
                      (você)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {user.email}
                </div>
              </div>

              {/* Role badge */}
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: user.role === 'admin'
                  ? 'rgba(240,192,64,0.15)' : user.role === 'gerente' ? 'rgba(160,160,192,0.15)' : 'rgba(64,128,240,0.15)',
                color: user.role === 'admin' ? 'var(--accent)' : user.role === 'gerente' ? '#a0a0c0' : 'var(--blue)',
              }}>
                {user.role === 'admin' ? 'Admin' : user.role === 'gerente' ? 'Gerente' : 'SDR'}
              </span>

              {/* Status badge */}
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: user.ativo
                  ? 'rgba(48,208,144,0.15)' : 'rgba(224,64,96,0.15)',
                color: user.ativo ? 'var(--green)' : 'var(--red)',
              }}>
                {user.ativo ? 'Ativo' : 'Inativo'}
              </span>

              {/* Meta */}
              <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '80px', textAlign: 'right' }}>
                {user.metaDiariaLigacoes} lig/dia
              </span>

              {/* Actions */}
              {!isMaster && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(user)}
                    style={{
                      padding: '5px 12px', borderRadius: '7px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleAtivo(user)}
                    style={{
                      padding: '5px 12px', borderRadius: '7px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer',
                      background: user.ativo
                        ? 'rgba(224,64,96,0.1)' : 'rgba(48,208,144,0.1)',
                      border: `1px solid ${user.ativo
                        ? 'rgba(224,64,96,0.3)' : 'rgba(48,208,144,0.3)'}`,
                      color: user.ativo ? 'var(--red)' : 'var(--green)',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {user.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                  {!isCurrentUser && (
                    <button
                      onClick={() => handleDelete(user)}
                      style={{
                        padding: '5px 12px', borderRadius: '7px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(224,64,96,0.1)',
                        border: '1px solid rgba(224,64,96,0.3)',
                        color: 'var(--red)', fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal create / edit */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '14px', width: '480px', maxWidth: '95vw',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '20px 24px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10,
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  width: 30, height: 30, background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  color: 'var(--text)', cursor: 'pointer', fontSize: '14px',
                }}
              >✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {[
                { label: 'Nome Completo *', key: 'nome', type: 'text', placeholder: 'Ex: João Silva' },
                { label: 'Email (login) *', key: 'email', type: 'email', placeholder: 'joao@email.com' },
                { label: editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha * (mínimo 6 caracteres)', key: 'senha', type: 'password', placeholder: '••••••••' },
                { label: 'Confirmar Senha', key: 'confirmSenha', type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
                    {field.label}
                  </div>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as Record<string, unknown>)[field.key] as string}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    disabled={field.key === 'email' && editingUser?.email === 'valloragencia@gmail.com'}
                    autoComplete={field.type === 'password' ? 'current-password' : undefined}
                    autoCorrect={field.type === 'password' ? 'off' : undefined}
                    autoCapitalize={field.type === 'password' ? 'off' : undefined}
                    spellCheck={field.type === 'password' ? false : undefined}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
                      fontSize: '13px', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                      boxSizing: 'border-box', opacity: (field.key === 'email' && editingUser?.email === 'valloragencia@gmail.com') ? 0.5 : 1,
                    }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
                    Papel
                  </div>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'gerente' | 'vendedor' }))}
                    disabled={editingUser?.email === 'valloragencia@gmail.com'}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
                      fontSize: '13px', outline: 'none',
                    }}
                  >
                    <option value="vendedor">SDR</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '6px' }}>
                    Meta Diária de Ligações
                  </div>
                  <input
                    type="number"
                    value={form.metaDiariaLigacoes}
                    onChange={e => setForm(f => ({ ...f, metaDiariaLigacoes: Number(e.target.value) }))}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '10px 14px', color: 'var(--text)',
                      fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const,
                    }}
                  />
                </div>
              </div>

              {/* Avatar color picker */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '8px' }}>
                  Cor do Avatar
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {AVATAR_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => setForm(f => ({ ...f, avatar: color }))}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: color, cursor: 'pointer',
                        border: form.avatar === color
                          ? '3px solid var(--text)' : '3px solid transparent',
                        transition: 'border 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Ativo toggle (edit only, not for master) */}
              {editingUser && editingUser.email !== 'valloragencia@gmail.com' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Conta ativa</div>
                  <div
                    onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px',
                      background: form.ativo ? 'var(--green)' : 'var(--surface3)',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: form.ativo ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {form.ativo ? 'Ativo — pode entrar no sistema' : 'Inativo — sem acesso ao sistema'}
                  </span>
                </div>
              )}

              {formError && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(224,64,96,0.1)',
                  border: '1px solid rgba(224,64,96,0.3)', borderRadius: '8px',
                  color: 'var(--red)', fontSize: '13px',
                }}>
                  ⚠️ {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
              position: 'sticky', bottom: 0, background: 'var(--surface)',
            }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '8px 18px', borderRadius: '8px', background: 'var(--surface2)',
                  border: '1px solid var(--border)', color: 'var(--text)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                style={{
                  padding: '8px 18px', borderRadius: '8px',
                  background: 'var(--accent)', border: 'none',
                  color: '#0a0a0f', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Colaborador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
