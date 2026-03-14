// src/pages/Usuarios.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Power } from 'lucide-react'
import { User } from '../types'
import { getUsers, addUser, updateUser, genId } from '../utils/storage'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../context/ToastContext'

const COLORS = ['#f0c040','#4080f0','#8050d0','#e05a30','#30d090','#e04060']

export default function Usuarios({ onReload }: { onReload?: () => void }) {
  const [users, setUsers] = useState(() => getUsers())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const { success } = useToast()
  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<'admin'|'vendedor'>('vendedor')
  const [avatar, setAvatar] = useState('#4080f0')
  const [metaLig, setMetaLig] = useState('50')
  const [metaReu, setMetaReu] = useState('5')

  const openNew = () => { setEditing(null);setNome('');setLogin('');setSenha('');setRole('vendedor');setAvatar('#4080f0');setMetaLig('50');setMetaReu('5');setOpen(true) }
  const openEdit = (u: User) => { setEditing(u);setNome(u.nome);setLogin(u.login);setSenha(u.senha);setRole(u.role);setAvatar(u.avatar);setMetaLig(String(u.metaDiariaLigacoes));setMetaReu(String(u.metaDiariaReunioes));setOpen(true) }
  const save = () => {
    if (!nome||!login||!senha) return
    if (editing) { updateUser(editing.id,{nome,login,senha,role,avatar,metaDiariaLigacoes:+metaLig,metaDiariaReunioes:+metaReu});success('Atualizado!') }
    else { addUser({id:genId(),nome,login,senha,role,avatar,metaDiariaLigacoes:+metaLig,metaDiariaReunioes:+metaReu,ativo:true,criadoEm:Date.now()});success('Criado!') }
    setUsers(getUsers());setOpen(false);onReload?.()
  }
  const toggle = (u: User) => { updateUser(u.id,{ativo:!u.ativo});setUsers(getUsers()) }

  return (
    <div className="p-6 font-dm">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-black text-xl" style={{color:'var(--text)'}}>Usuários</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-syne font-bold" style={{background:'var(--accent)',color:'#0a0a0f'}}>
          <Plus size={14}/> Novo Usuário
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="rounded-2xl border p-5 flex items-start gap-4" style={{background:'var(--surface)',borderColor:'var(--border)',opacity:u.ativo?1:0.55}}>
            <Avatar nome={u.nome} color={u.avatar} size={48}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-syne font-bold" style={{color:'var(--text)'}}>{u.nome}</p>
                <Badge color={u.role==='admin'?'var(--accent)':'var(--blue)'}>{u.role}</Badge>
                {!u.ativo&&<Badge color="var(--muted)">Inativo</Badge>}
              </div>
              <p className="text-xs" style={{color:'var(--muted)'}}>@{u.login}</p>
              <p className="text-xs mt-1" style={{color:'var(--muted)'}}>Meta: {u.metaDiariaLigacoes} lig • {u.metaDiariaReunioes} reu/dia</p>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>openEdit(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{borderColor:'var(--border)',color:'var(--muted)'}}><Edit2 size={13}/></button>
              <button onClick={()=>toggle(u)} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{borderColor:'var(--border)',color:u.ativo?'var(--red)':'var(--green)'}}><Power size={13}/></button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title={editing?'Editar Usuário':'Novo Usuário'} width={460}
        footer={<>
          <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-lg text-sm border font-dm" style={{borderColor:'var(--border)',color:'var(--muted)'}}>Cancelar</button>
          <button onClick={save} className="px-6 py-2 rounded-lg text-sm font-syne font-bold" style={{background:'var(--accent)',color:'#0a0a0f'}}>Salvar</button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Nome *</label><input value={nome} onChange={e=>setNome(e.target.value)} className="w-full text-sm"/></div>
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Login *</label><input value={login} onChange={e=>setLogin(e.target.value)} className="w-full text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Senha *</label><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="w-full text-sm"/></div>
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Role</label>
              <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full text-sm">
                <option value="vendedor">Vendedor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Meta Lig/dia</label><input type="number" value={metaLig} onChange={e=>setMetaLig(e.target.value)} className="w-full text-sm"/></div>
            <div><label className="text-xs mb-1 block" style={{color:'var(--muted)'}}>Meta Reu/dia</label><input type="number" value={metaReu} onChange={e=>setMetaReu(e.target.value)} className="w-full text-sm"/></div>
          </div>
          <div>
            <label className="text-xs mb-2 block" style={{color:'var(--muted)'}}>Cor do Avatar</label>
            <div className="flex gap-2">{COLORS.map(c=><button key={c} onClick={()=>setAvatar(c)} className="w-8 h-8 rounded-full border-2 transition-all" style={{background:c,borderColor:avatar===c?'#fff':'transparent',transform:avatar===c?'scale(1.15)':'scale(1)'}}/>)}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
