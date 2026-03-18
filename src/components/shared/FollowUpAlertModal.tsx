import { FollowUpContact } from '@/hooks/useFollowUpAlert'

interface Props {
  contacts: FollowUpContact[]
  onDismiss: () => void
  onGoToFollowUp: () => void
}

export function FollowUpAlertModal({ contacts, onDismiss, onGoToFollowUp }: Props) {
  const grouped = contacts.reduce((acc, c) => {
    const day = c.followup_data || c.criado_em?.slice(0, 10) || 'sem data'
    if (!acc[day]) acc[day] = []
    acc[day].push(c)
    return acc
  }, {} as Record<string, FollowUpContact[]>)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        background: '#13131a', border: '1px solid #2a2a3a',
        borderRadius: '16px', padding: '28px', maxWidth: '480px',
        width: '100%', maxHeight: '80vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px' }}>🔔</span>
          <div>
            <h2 style={{ color: '#f0c040', fontWeight: 700, fontSize: '18px', margin: 0 }}>
              Follow-ups pendentes
            </h2>
            <p style={{ color: '#7070a0', fontSize: '13px', margin: 0 }}>
              {contacts.length} contato{contacts.length > 1 ? 's' : ''} aguardando retorno
            </p>
          </div>
        </div>

        {Object.entries(grouped).map(([day, items]) => (
          <div key={day} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 600, color: '#e04060',
              letterSpacing: '0.04em', marginBottom: '8px', textTransform: 'uppercase'
            }}>
              📅 {day}
            </div>
            {items.map(c => (
              <div key={c.id} style={{
                background: '#1a1a28', borderRadius: '10px',
                padding: '12px', marginBottom: '8px',
                borderLeft: '3px solid #f0c040'
              }}>
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>{c.nome}</div>
                {c.empresa && <div style={{ color: '#7070a0', fontSize: '12px' }}>{c.empresa}</div>}
                <div style={{ color: '#5090f0', fontSize: '12px', marginTop: '4px' }}>{c.numero}</div>
                {c.anotacao && (
                  <div style={{
                    color: '#a0a0c0', fontSize: '12px', marginTop: '6px',
                    fontStyle: 'italic', borderTop: '1px solid #2a2a3a', paddingTop: '6px'
                  }}>
                    "{c.anotacao}"
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onGoToFollowUp}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: '#f0c040', border: 'none', color: '#0a0a0f',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}
          >
            Ver lista de follow-up →
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: '12px 20px', borderRadius: '10px',
              background: '#2a2a3a', border: 'none', color: '#a0a0c0',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer'
            }}
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  )
}
