// src/pages/WhatsApp.tsx
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Copy, Download, Upload, MessageCircle } from 'lucide-react'
import { User, Call } from '../types'
import { useToast } from '../context/ToastContext'
import { getLeads, getCalls } from '../utils/storage'
import { openWhatsApp, buildWhatsAppMessage } from '../utils/whatsapp'

interface Props {
  user: User
  isAdmin: boolean
  calls: Call[]
}

const DEFAULT_TEMPLATE = `Olá {{nome}}! 👋

Sou da *Agência Vallor*, especialistas em marketing digital para {{empresa}}.

Ajudamos negócios como o seu a aumentar vendas e visibilidade online com resultados mensuráveis.

Posso te apresentar como funcionaria para o seu segmento?

{{responsavel}} — Vallor Agency`

export default function WhatsApp({ user, isAdmin, calls }: Props) {
  const { success } = useToast()
  const [tab, setTab] = useState<'exportar' | 'importar' | 'mensagem'>('exportar')
  const [format, setFormat] = useState<'numeros' | 'nome_numero' | 'csv'>('numeros')
  const [filterStatus, setFilterStatus] = useState('')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [previewNome, setPreviewNome] = useState('Carlos Souza')
  const [previewEmpresa, setPreviewEmpresa] = useState('Clínica Dental')
  const [importText, setImportText] = useState('')

  const leads = getLeads()

  const exportList = useMemo(() => {
    let base = isAdmin ? calls : calls.filter(c => c.operadorId === user.id)
    if (filterStatus) base = base.filter(c => c.status === filterStatus)
    // Dedup by number
    const seen = new Set<string>()
    return base.filter(c => {
      if (seen.has(c.numero)) return false
      seen.add(c.numero); return true
    })
  }, [calls, filterStatus, isAdmin, user.id])

  const preview = useMemo(() => {
    if (format === 'numeros') return exportList.map(c => c.numero.replace(/\D/g, '')).join('\n')
    if (format === 'nome_numero') return exportList.map(c => `${c.nome} — ${c.numero}`).join('\n')
    return 'nome,numero,empresa,status\n' + exportList.map(c => `${c.nome},${c.numero},${c.empresa},${c.status}`).join('\n')
  }, [exportList, format])

  const copy = () => {
    navigator.clipboard.writeText(preview)
    success('✅ Copiado!')
  }

  const download = () => {
    const blob = new Blob([preview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vallor_lista.${format === 'csv' ? 'csv' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
    success('📥 Download iniciado!')
  }

  const previewMsg = buildWhatsAppMessage(template, {
    nome: previewNome,
    empresa: previewEmpresa,
    responsavel: user.nome,
  })

  return (
    <div className="p-6 font-dm">
      <div className="mb-5">
        <h1 className="font-syne font-black text-xl" style={{ color: 'var(--text)' }}>WhatsApp Export</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Exportar listas de contatos e criar mensagens</p>
      </div>

      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: 'var(--surface2)' }}>
        {(['exportar', 'importar', 'mensagem'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-lg text-sm font-dm capitalize transition-all"
            style={{ background: tab === t ? 'var(--surface)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--muted)', fontWeight: tab === t ? 600 : 400 }}
          >
            {t === 'exportar' ? '📤 Exportar' : t === 'importar' ? '📥 Importar' : '💬 Mensagem'}
          </button>
        ))}
      </div>

      {tab === 'exportar' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Filtros</h3>
            <div className="space-y-3">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg">
                <option value="">Todos os status</option>
                <option value="atendida">Atendida</option>
                <option value="perdida">Perdida</option>
                <option value="nao-atendeu">Não Atendeu</option>
                <option value="caixa-postal">Caixa Postal</option>
              </select>
              <div className="space-y-2">
                {(['numeros', 'nome_numero', 'csv'] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm border font-dm transition-all"
                    style={{
                      borderColor: format === f ? 'var(--accent)' : 'var(--border)',
                      background: format === f ? 'rgba(240,192,64,0.1)' : 'var(--surface2)',
                      color: format === f ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {f === 'numeros' ? '📱 Só números' : f === 'nome_numero' ? '👤 Nome + Número' : '📊 CSV completo'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border font-dm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface2)' }}>
                  <Copy size={14} /> Copiar
                </button>
                <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-dm"
                  style={{ background: 'var(--accent)', color: '#0a0a0f' }}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Preview ({exportList.length} contatos)</h3>
            <pre
              className="rounded-xl border p-4 text-xs overflow-auto max-h-64 font-mono"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              {preview || 'Nenhum contato encontrado.'}
            </pre>
          </div>
        </div>
      )}

      {tab === 'importar' && (
        <div className="max-w-lg">
          <p className="text-sm mb-3 font-dm" style={{ color: 'var(--muted)' }}>Cole os números (um por linha) para criar leads automaticamente no Kanban.</p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={10}
            className="w-full text-sm resize-none font-mono"
            placeholder="85988001122&#10;85999334455&#10;85977221133..."
          />
          <div className="mt-3 p-3 rounded-lg border text-xs" style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
            {importText.trim().split('\n').filter(Boolean).length} números detectados
          </div>
          <button
            className="mt-3 w-full py-2.5 rounded-xl text-sm font-syne font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0f' }}
          >
            📥 Importar e Criar Leads
          </button>
        </div>
      )}

      {tab === 'mensagem' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Template</h3>
            <p className="text-xs mb-2 font-dm" style={{ color: 'var(--muted)' }}>
              Variáveis: {'{{nome}}'}, {'{{empresa}}'}, {'{{responsavel}}'}
            </p>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={10}
              className="w-full text-sm resize-none"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input value={previewNome} onChange={e => setPreviewNome(e.target.value)} placeholder="Nome de preview" className="text-sm" />
              <input value={previewEmpresa} onChange={e => setPreviewEmpresa(e.target.value)} placeholder="Empresa de preview" className="text-sm" />
            </div>
          </div>
          <div>
            <h3 className="font-syne font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Preview da mensagem</h3>
            <pre
              className="rounded-xl border p-4 text-sm whitespace-pre-wrap font-dm"
              style={{ background: '#1a2518', borderColor: 'rgba(48,208,144,0.2)', color: 'var(--text)', minHeight: 200 }}
            >
              {previewMsg}
            </pre>
            <button
              onClick={() => openWhatsApp('5585988001122', previewMsg)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold"
              style={{ background: '#25d366', color: '#fff' }}
            >
              <MessageCircle size={16} />
              Abrir no WhatsApp Web
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
