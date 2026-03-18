import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'

export interface FollowUpContact {
  id: string
  nome: string
  numero: string
  empresa: string
  semana_key: string
  criado_em: string
  status: string
  anotacao: string
  followup_data?: string
}

export function useFollowUpAlert() {
  const { user: currentUser } = useAuth()
  const [contacts, setContacts] = useState<FollowUpContact[]>([])
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const sessionKey = `vallor_followup_alert_${currentUser.id}_${format(new Date(), 'yyyy-MM-dd')}`
    const alreadyShown = sessionStorage.getItem(sessionKey)
    if (alreadyShown) return

    async function checkFollowUps() {
      if (!currentUser) return
      const today = format(new Date(), 'yyyy-MM-dd')

      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('operador_id', currentUser.id)
        .eq('followup', true)
        .eq('followup_feito', false)
        .lte('followup_data', today)
        .order('followup_data', { ascending: true })
        .limit(50)

      if (data && data.length > 0) {
        setContacts(data.map(c => ({
          id: c.id,
          nome: c.nome,
          numero: c.numero,
          empresa: c.empresa || '',
          semana_key: c.semana_key,
          criado_em: c.criado_em,
          status: c.status,
          anotacao: c.anotacao || '',
          followup_data: c.followup_data
        })))
        setShowAlert(true)
        sessionStorage.setItem(sessionKey, 'true')
      }
    }

    checkFollowUps()
  }, [currentUser])

  function dismiss() { setShowAlert(false) }

  return { contacts, showAlert, dismiss }
}
