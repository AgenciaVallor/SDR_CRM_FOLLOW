// src/pages/Configuracoes.tsx
import React, { useState } from 'react'
import { getCols, updateCol, getTemplates, setTemplates, genId } from '../utils/storage'
import { KanbanCol, CadenciaTemplate } from '../types'
import { useToast } from '../context/ToastContext'

export default function Configuracoes() {
  const [cols, setCols] = useState(() => getCols().sort((a,b)=>a.ordem-b.ordem))
  const [templates, setTemplatesState] = useState(() => getTemplates())
  const { success } = useToast()

  const saveScript = (colId: string, script: string) => {
    updateCol(colId, { script })
    setCols(getCols().sort((a,b)=>a.ordem-b.ordem))
    success('Script salvo!')
  }

  return (
    <div className="p-6 font-dm space-y-8">
      <h1 className="font-syne font-black text-xl" style={{color:'var(--text)'}}>Configurações</h1>

      {/* Scripts por etapa */}
      <section>
        <h2 className="font-syne font-bold text-base mb-4" style={{color:'var(--text)'}}>📝 Scripts por Etapa do Kanban</h2>
        <div className="space-y-4">
          {cols.map(col => (
            <ScriptEditor key={col.id} col={col} onSave={saveScript} />
          ))}
        </div>
      </section>

      {/* Metas padrão */}
      <section>
        <h2 className="font-syne font-bold text-base mb-4" style={{color:'var(--text)'}}>🎯 Metas Padrão</h2>
        <div className="rounded-2xl border p-5" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
          <div className="grid grid-cols-3 gap-4">
            {[
              {label:'Meta Ligações/dia', value:'50'},
              {label:'Meta Reuniões/dia', value:'5'},
              {label:'Taxa Conversão Meta', value:'10%'},
            ].map(m=>(
              <div key={m.label} className="rounded-xl p-4" style={{background:'var(--surface2)'}}>
                <p className="text-xs mb-1" style={{color:'var(--muted)'}}>{m.label}</p>
                <p className="font-syne font-black text-2xl" style={{color:'var(--accent)'}}>{m.value}</p>
                <p className="text-xs mt-1" style={{color:'var(--muted)'}}>Regra Sagrada Vallor</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border" style={{borderColor:'rgba(240,192,64,0.3)',background:'rgba(240,192,64,0.05)'}}>
            <p className="text-sm font-syne font-bold text-center" style={{color:'var(--accent)'}}>
              50 ligações • 5 agendamentos • Todo dia.
            </p>
            <p className="text-xs text-center mt-1" style={{color:'var(--muted)'}}>Esta é a regra central do sistema Vallor.</p>
          </div>
        </div>
      </section>

      {/* Templates WhatsApp */}
      <section>
        <h2 className="font-syne font-bold text-base mb-4" style={{color:'var(--text)'}}>💬 Templates WhatsApp por Etapa</h2>
        <p className="text-sm" style={{color:'var(--muted)'}}>Configure os templates de mensagem em WhatsApp &gt; Mensagem.</p>
      </section>
    </div>
  )
}

function ScriptEditor({ col, onSave }: { col: KanbanCol; onSave: (id: string, s: string) => void }) {
  const [script, setScript] = useState(col.script)
  return (
    <div className="rounded-xl border p-4" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{background:col.cor}}/>
        <p className="font-syne font-bold text-sm" style={{color:col.cor}}>{col.nome}</p>
      </div>
      <textarea
        value={script}
        onChange={e=>setScript(e.target.value)}
        rows={3}
        className="w-full text-sm resize-none"
        placeholder="Script de abordagem para esta etapa..."
      />
      <button onClick={()=>onSave(col.id,script)} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-dm" style={{background:'var(--surface2)',color:'var(--text)',border:'1px solid var(--border)'}}>
        Salvar Script
      </button>
    </div>
  )
}
