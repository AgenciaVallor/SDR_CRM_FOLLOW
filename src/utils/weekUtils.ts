// src/utils/weekUtils.ts — Week key helpers and date math

import {
  getISOWeek,
  getISOWeekYear,
  format,
  addDays,
  startOfISOWeek,
  parseISO,
  startOfDay,
  endOfDay,
  isToday as isTodayFns,
  isThisISOWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function getWeekKey(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-${String(week).padStart(2, '0')}`
}

export function getMondayOfWeek(weekKey: string): Date {
  const [yearStr, weekStr] = weekKey.split('-')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)
  // Jan 4th is always in week 1
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = startOfISOWeek(jan4)
  return addDays(startOfWeek1, (week - 1) * 7)
}

const dayOffsets: Record<string, number> = {
  segunda: 0,
  terca: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sabado: 5,
}

export function getDateForWeekDay(weekKey: string, dia: string): string {
  const monday = getMondayOfWeek(weekKey)
  return format(addDays(monday, dayOffsets[dia] ?? 0), 'yyyy-MM-dd')
}

export function getCurrentWeekKey(): string {
  return getWeekKey(new Date())
}

export function formatDatePtBR(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function getWeekDates(weekKey: string): Array<{ dia: string; date: string; label: string }> {
  const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  const labels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return days.map((dia, i) => ({
    dia,
    date: getDateForWeekDay(weekKey, dia),
    label: labels[i],
  }))
}

export function isToday(dateStr: string): boolean {
  try {
    return isTodayFns(parseISO(dateStr))
  } catch {
    return false
  }
}

export function isFuture(dateStr: string): boolean {
  try {
    return startOfDay(parseISO(dateStr)).getTime() > startOfDay(new Date()).getTime()
  } catch {
    return false
  }
}

export function isThisWeek(weekKey: string): boolean {
  return weekKey === getCurrentWeekKey()
}

export function startOfDayTs(dateStr: string): number {
  return startOfDay(parseISO(dateStr)).getTime()
}

export function endOfDayTs(dateStr: string): number {
  return endOfDay(parseISO(dateStr)).getTime()
}

export function getWeekLabel(weekKey: string): string {
  const monday = getMondayOfWeek(weekKey)
  const sunday = addDays(monday, 6)
  const monthName = format(monday, 'MMMM yyyy', { locale: ptBR })
  const week = getISOWeek(monday)
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} — Semana ${week}`
}

export function prevWeekKey(weekKey: string): string {
  const monday = getMondayOfWeek(weekKey)
  return getWeekKey(addDays(monday, -7))
}

export function nextWeekKey(weekKey: string): string {
  const monday = getMondayOfWeek(weekKey)
  return getWeekKey(addDays(monday, 7))
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  return `há ${days}d`
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getMesLabel(weekKey: string): string {
  const monday = getMondayOfWeek(weekKey)
  const label = format(monday, 'MMMM yyyy', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function getSemanaNumber(weekKey: string): number {
  return getISOWeek(getMondayOfWeek(weekKey))
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isBusinessHours(): boolean {
  const h = new Date().getHours()
  return h >= 8 && h < 18
}

export function isWeekday(date: Date): boolean {
  const d = date.getDay()
  return d >= 1 && d <= 5
}

export function dayOfWeekIndex(dateStr: string): 0|1|2|3|4|5|6 {
  return parseISO(dateStr).getDay() as 0|1|2|3|4|5|6
}
