// src/pages/Usuarios.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Power } from 'lucide-react'
import { User } from '../types'
import { getUsers, addUser, updateUser, genId, getCalls } from '../utils/storage'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../context/ToastContext'
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

const COLORS = ['#f0c040','#4080f0','#8050d0','#e05a30','#30d090','#e04060']

export default function Usuarios({ onReload }: { onReload?: () => void }) {
  const [users, setUsers] = useState(() => getUsers())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const { success, error: toastError } = useToast()
  
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [role, setRole] = useState<'admin'|'vendedor'>('vendedor')
  const [avatar, setAvatar] = useState('#4080f0')
  const [metaLig, setMetaLig] = useState('50')
  const [metaReu, setMetaReu] = useState('5')

  const openNew = () => { 
    setEditing(null);setNome('');setEmail('');setSenha('');setConfirmaSenha('');
    setRole('vendedor');setAvatar('#4080f0');setMetaLig('50');setMetaReu('5');setOpen(true);
  }
  
  const openEdit = (u: User) => { 
    setEditing(u);setNome(u.nome);setEmail(u.email);setSenha(u.senha);setConfirmaSenha(u.senha);
    setRole(u.role);setAvatar(u.avatar);setMetaLig(String(u.metaDiariaLigacoes));setMetaReu(String(u.metaDiariaReunioes));setOpen(true);
  }

  const save = () => {
    if (!nome || !email || !senha || !confirmaSenha) {
      toastError('Preencha todos os campos obrigatórios.')
      return
    }
    
    if (senha.length < 6) {
      toastError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (senha !== confirmaSenha) {
      toastError('As senhas não coincidem.')
      return
    }

    const emailExists = users.some(u => u.email === email && (!editing || u.id !== editing.id))
    if (emailExists) {
      toastError('Este email já está cadastrado.')
      return
    }

    if (editing) {
      updateUser(editing.id, { nome, email, senha, role, avatar, metaDiariaLigacoes: +metaLig, metaDiariaReunioes: +metaReu })
      success('Atualizado!')
    } else { 
      addUser({ id: genId(), nome, email, senha, role, avatar, metaDiariaLigacoes: +metaLig, metaDiariaReunioes: +metaReu, ativo: true, criadoEm: Date.now() })
      success('Criado!') 
    }
    setUsers(getUsers())
    setOpen(false)
    onReload?.()
  }

  const toggle = (u: User) => { 
    if (u.id === 'u-master') return
    updateUser(u.id, { ativo: !u.ativo })
    setUsers(getUsers()) 
  }

  const totalCallsByOperador = useMemo(() => {
    const s = startOfMonth(new Date()).getTime()
    const e = endOfMonth(new Date()).getTime()
    const calls = getCalls().filter(c => c.timestamp >= s && c.timestamp <= e)
    const map: Record<string, number> = {}
    calls.forEach(c => map[c.operadorId] = (map[c.operadorId] || 0) + 1)
    return map
  }, [users])

  return (
    <div className="p-6 font-dm">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-black text-xl" style={{color:'var(--text)'}}>Usuários</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-syne font-bold hover:scale-105 transition-transform" style={{background:'var(--accent)',color:'#0a0a0f'}}>
          <Plus size={14}/> Novo Colaborador
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="rounded-2xl border p-5 flex items-start gap-4 transition-all" style={{background:'var(--surface)',borderColor:'var(--border)',opacity:u.ativo?1:0.55}}>
            <Avatar nome={u.nome} color={u.avatar} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-syne font-bold" style={{color:'var(--text)'}}>{u.nome}</p>
                <Badge color={u.role==='admin'?'var(--accent)':'var(--blue)'}>{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</Badge>
                {!u.ativo && <Badge color="var(--red)">Inativo</Badge>}
                {u.id === 'u-master' && <Badge color="var(--green)">Master</Badge>}
              </div>
              <p className="text-xs" style={{color:'var(--muted)'}}>{u.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-xs" style={{color:'var(--muted)'}}>Meta: {u.metaDiariaLigacoes} lig • {u.metaDiariaReunioes} reu/dia</p>
                <p className="text-xs" style={{color:'var(--accent)'}}>{totalCallsByOperador[u.id] || 0} lig. neste mês</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => openEdit(u)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-white/5 transition-colors" 
                style={{borderColor:'var(--border)',color:'var(--muted)'}}
              >
                <Edit2 size={13}/>
              </button>
              <button 
                onClick={() => toggle(u)} 
                disabled={u.id === 'u-master'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${u.id === 'u-master' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5'}`}
                style={{borderColor:'var(--border)',color:u.ativo?'var(--red)':'var(--green)'}}
                title={u.id === 'u-master' ? 'Administrador Master não pode ser inativado' : u.ativo ? 'Desativar usuário' : 'Ativar usuário'}
              >
                <Power size={13}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing?'Editar Colaborador':'Novo Colaborador'} width={480}
        footer={<>
          <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-lg text-sm border font-dm hover:bg-white/5" style={{borderColor:'var(--border)',color:'var(--muted)'}}>Cancelar</button>
          <button onClick={save} className="px-6 py-2 rounded-lg text-sm font-syne font-bold hover:scale-105 transition-transform" style={{background:'var(--accent)',color:'#0a0a0f'}}>Salvar Colaborador</button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Nome completo *</label>
              <input value={nome} onChange={e=>setNome(e.target.value)} className="w-full text-sm" placeholder="Ex: João Silva"/>
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>E-mail *</label>
              <input 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                className="w-full text-sm" 
                disabled={editing?.id === 'u-master'}
                placeholder="nome@empresa.com"
                style={{ opacity: editing?.id === 'u-master' ? 0.6 : 1 }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Senha *</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="w-full text-sm" placeholder="Mínimo 6 caracteres"/>
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Confirmação de Senha *</label>
              <input type="password" value={confirmaSenha} onChange={e=>setConfirmaSenha(e.target.value)} className="w-full text-sm" placeholder="Digite a senha novamente"/>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Papel</label>
              <select value={role} disabled={editing?.id === 'u-master'} onChange={e=>setRole(e.target.value as any)} className="w-full text-sm cursor-pointer" style={{ opacity: editing?.id === 'u-master' ? 0.6 : 1 }}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Meta Ligações</label>
              <input type="number" min="1" value={metaLig} onChange={e=>setMetaLig(e.target.value)} className="w-full text-sm"/>
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{color:'var(--muted)'}}>Meta Reuniões</label>
              <input type="number" min="1" value={metaReu} onChange={e=>setMetaReu(e.target.value)} className="w-full text-sm"/>
            </div>
          </div>

          <div>
            <label className="text-xs mb-2 block font-bold" style={{color:'var(--muted)'}}>Cor do Avatar</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setAvatar(c)} 
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110" 
                  style={{background:c, borderColor: avatar === c ? '#fff' : 'transparent', transform: avatar === c ? 'scale(1.15)' : 'scale(1)'}}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
