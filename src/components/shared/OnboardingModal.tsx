import { useState } from 'react'
import { REGRAS_SDR, MISSAO } from '@/data/treinamento'

interface OnboardingModalProps {
  nomeUsuario: string
  onConcluir: () => void
}

export function OnboardingModal({ nomeUsuario, onConcluir }: OnboardingModalProps) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      emoji: '🏛️',
      titulo: `Bem-vindo(a), ${nomeUsuario.split(' ')[0]}!`,
      subtitulo: 'Missão da Vallor',
      conteudo: (
        <div>
          <div style={{
            background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)',
            borderRadius: '10px', padding: '20px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
            lineHeight: '1.8', color: 'var(--text)', fontStyle: 'italic',
          }}>
            "{MISSAO}"
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.7' }}>
            Você não está aqui para vender anúncio. Você está aqui para ajudar empresas a prosperarem. Isso muda sua postura na ligação.
          </div>
        </div>
      ),
    },
    {
      emoji: '🎯',
      titulo: 'Sua Meta Diária',
      subtitulo: 'O número que define tudo',
      conteudo: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { num: '50', label: 'ligações por dia', cor: 'var(--accent)' },
            { num: '5', label: 'reuniões agendadas por dia', cor: 'var(--green)' },
            { num: '20', label: 'fechamentos por mês', cor: 'var(--blue)' },
          ].map(item => (
            <div key={item.num} style={{
              background: 'var(--s2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '36px', color: item.cor, lineHeight: 1, minWidth: '60px',
              }}>{item.num}</div>
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
          <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '4px 0' }}>
            Se não ligar, não bate meta. Se não bater meta, é porque não ligou a quantidade estabelecida.
          </div>
        </div>
      ),
    },
    {
      emoji: '⚡',
      titulo: '10 Regras do SDR Vallor',
      subtitulo: 'Leia antes de cada turno',
      conteudo: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {REGRAS_SDR.map((regra, i) => (
            <div key={i} style={{
              background: 'var(--s2)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '12px 14px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                fontSize: '12px', color: 'var(--accent)',
                minWidth: '24px', marginTop: '1px',
              }}>{i + 1}</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.6' }}>{regra}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      emoji: '📞',
      titulo: 'Scripts e Objeções',
      subtitulo: 'Sua arma principal',
      conteudo: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: 'var(--s2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px',
            fontSize: '13px', color: 'var(--text)', lineHeight: '1.7',
          }}>
            O script completo de abordagem, as respostas para as 6 principais objeções e os horários disponíveis para reunião estão disponíveis no botão <strong style={{ color: 'var(--accent)' }}>📋 Script</strong> dentro do modal de ligação.
          </div>
          <div style={{
            background: 'rgba(48,208,144,0.08)', border: '1px solid rgba(48,208,144,0.2)',
            borderRadius: '10px', padding: '16px',
            fontSize: '13px', color: 'var(--green)', lineHeight: '1.7',
          }}>
            ✅ Sempre que agendar uma reunião: avise o Hellden no WhatsApp imediatamente.<br />
            ✅ Registre TODAS as ligações no sistema — sem registro, não existe.<br />
            ✅ Escreva a anotação da ligação quando o prospect atender. Isso é seu histórico de vendas.
          </div>
          <div style={{
            background: 'var(--s2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px',
            fontSize: '13px', color: 'var(--text)', lineHeight: '1.7',
          }}>
            <strong style={{ color: 'var(--accent)' }}>Lembre:</strong> Você não vende gestão de tráfego. Você não vende artes. Você vende <strong>AUMENTO DE RECEITA</strong>. Você é um parceiro estratégico — não mais uma agência.
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '580px', maxWidth: '96vw',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'var(--s3)' }}>
          <div style={{
            height: '100%', background: 'var(--accent)',
            width: `${((step + 1) / steps.length) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{current.emoji}</div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '20px', letterSpacing: '-0.5px',
          }}>{current.titulo}</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', marginBottom: '20px' }}>
            {current.subtitulo}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 20px' }}>
          {current.conteudo}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {step + 1} de {steps.length}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: '9px 20px', borderRadius: '8px',
                background: 'var(--s2)', border: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
              }}>← Voltar</button>
            )}
            <button onClick={() => { if (isLast) { onConcluir() } else { setStep(s => s + 1) } }} style={{
              padding: '9px 24px', borderRadius: '8px',
              background: 'var(--accent)', border: 'none',
              color: '#0a0a0f', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {isLast ? '✅ Estou pronto para ligar!' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
