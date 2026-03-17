import { useState, useCallback, useEffect } from 'react'
import { RegistroSemanal, DiaRegistro, SabadoRegistro } from '../types'
import { getSemana as fetchSemana, upsertSemana } from '../utils/storage'
import {
  getCurrentWeekKey, getDateForWeekDay,
  getMesLabel, getSemanaNumber, prevWeekKey, nextWeekKey
} from '../utils/weekUtils'
import { getISOWeekYear } from 'date-fns'

function makeDiaRegistro(date: string): DiaRegistro {
  return {
    data: date,
    meta_ligacoes: 50,
    meta_reunioes: 5,
    ligacoes_feitas: 0,
    reunioes_agendadas: 0,
    taxa_conversao: 0,
    status: 'pendente',
    anotacao_dia: '',
  }
}

function makeSabadoRegistro(date: string): SabadoRegistro {
  return {
    data: date,
    revisao_semana: '',
    total_ligacoes_semana: 0,
    total_reunioes_semana: 0,
    meta_ligacoes_semana: 250,
    meta_reunioes_semana: 25,
    aprendizados: '',
    plano_proxima_semana: '',
    finalizado: false,
  }
}

export function makeRegistroSemanal(userId: string, weekKey: string): RegistroSemanal {
  const dias = ['segunda','terca','quarta','quinta','sexta'] as const
  const records = Object.fromEntries(
    dias.map(dia => [dia, makeDiaRegistro(getDateForWeekDay(weekKey, dia))])
  ) as Record<string, DiaRegistro>
  const sabado = makeSabadoRegistro(getDateForWeekDay(weekKey, 'sabado'))
  return {
    id: `${userId}-${weekKey}`,
    userId,
    semanaKey: weekKey,
    mes: getMesLabel(weekKey),
    ano: getISOWeekYear(new Date()),
    numeroDaSemana: getSemanaNumber(weekKey),
    dias: {
      segunda: records['segunda'],
      terca:   records['terca'],
      quarta:  records['quarta'],
      quinta:  records['quinta'],
      sexta:   records['sexta'],
      sabado,
    },
  }
}

export function useWeek(userId: string) {
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey)
  const [semana, setSemana] = useState<RegistroSemanal | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      let s = await fetchSemana(userId, weekKey)
      if (!s) {
        s = makeRegistroSemanal(userId, weekKey)
        await upsertSemana(userId, weekKey, s)
      }
      setSemana(s)
    } finally {
      setLoading(false)
    }
  }, [userId, weekKey])

  useEffect(() => {
    reload()
  }, [reload])

  const getSemana = () => semana

  const saveAnotacaoDia = async (dia: string, anotacao: string) => {
    if (!semana) return
    const updated = {
      dias: {
        ...semana.dias,
        [dia]: { ...(semana.dias as any)[dia], anotacao_dia: anotacao },
      },
    }
    await upsertSemana(userId, weekKey, updated)
    await reload()
  }

  const saveSabadoField = async (field: keyof SabadoRegistro, value: string | boolean) => {
    if (!semana) return
    const updated = {
      dias: {
        ...semana.dias,
        sabado: { ...semana.dias.sabado, [field]: value },
      },
    }
    await upsertSemana(userId, weekKey, updated)
    await reload()
  }

  const goToPrevWeek = useCallback(() => setWeekKey(k => prevWeekKey(k)), [])
  const goToNextWeek = useCallback(() => setWeekKey(k => nextWeekKey(k)), [])
  const goToCurrentWeek = useCallback(() => setWeekKey(getCurrentWeekKey()), [])

  return { weekKey, setWeekKey, getSemana, saveAnotacaoDia, saveSabadoField, goToPrevWeek, goToNextWeek, goToCurrentWeek, loading }
}
