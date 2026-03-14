// src/hooks/useWeek.ts
import { useState, useCallback } from 'react'
import { RegistroSemanal, DiaRegistro, SabadoRegistro } from '../types'
import { getSemanas, findSemana, addSemana, updateSemana } from '../utils/storage'
import {
  getCurrentWeekKey, getWeekDates, getDateForWeekDay,
  getMesLabel, getSemanaNumber, prevWeekKey, nextWeekKey
} from '../utils/weekUtils'
import { getISOWeek, getISOWeekYear } from 'date-fns'

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

  const getOrCreateSemana = useCallback((uid: string, wKey: string): RegistroSemanal => {
    let s = findSemana(uid, wKey)
    if (!s) {
      s = makeRegistroSemanal(uid, wKey)
      addSemana(s)
    }
    return s
  }, [])

  const getSemana = useCallback((): RegistroSemanal => {
    return getOrCreateSemana(userId, weekKey)
  }, [userId, weekKey, getOrCreateSemana])

  const saveAnotacaoDia = useCallback((dia: string, anotacao: string) => {
    const s = getOrCreateSemana(userId, weekKey)
    updateSemana(s.id, {
      dias: {
        ...s.dias,
        [dia]: { ...(s.dias as any)[dia], anotacao_dia: anotacao },
      },
    })
  }, [userId, weekKey, getOrCreateSemana])

  const saveSabadoField = useCallback((field: keyof SabadoRegistro, value: string | boolean) => {
    const s = getOrCreateSemana(userId, weekKey)
    updateSemana(s.id, {
      dias: {
        ...s.dias,
        sabado: { ...s.dias.sabado, [field]: value },
      },
    })
  }, [userId, weekKey, getOrCreateSemana])

  const goToPrevWeek = useCallback(() => setWeekKey(k => prevWeekKey(k)), [])
  const goToNextWeek = useCallback(() => setWeekKey(k => nextWeekKey(k)), [])
  const goToCurrentWeek = useCallback(() => setWeekKey(getCurrentWeekKey()), [])

  return { weekKey, setWeekKey, getSemana, saveAnotacaoDia, saveSabadoField, goToPrevWeek, goToNextWeek, goToCurrentWeek }
}
