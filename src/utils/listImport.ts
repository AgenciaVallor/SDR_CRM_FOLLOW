import * as XLSX from 'xlsx'
import { Call } from '@/types'
import { getWeekDates } from '@/utils/weekUtils'

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'

export interface RawContact {
  nome: string
  empresa: string
  telefone: string
  decisor: string
  nicho: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function cleanPhone(value: string): string {
  return value.replace(/\D/g, '')
}

function getFieldValue(row: Record<string, unknown>, variants: string[]): string {
  for (const variant of variants) {
    const key = Object.keys(row).find(
      k => k.toLowerCase().trim() === variant.toLowerCase()
    )
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return String(row[key]).trim()
    }
  }
  return ''
}

function normalizeRows(rows: Record<string, unknown>[]): RawContact[] {
  return rows
    .map(row => ({
      nome:     getFieldValue(row, ['nome', 'name', 'contato', 'contact', 'cliente']),
      empresa:  getFieldValue(row, ['empresa', 'company', 'razao social', 'razão social', 'estabelecimento']),
      telefone: getFieldValue(row, ['telefone', 'fone', 'celular', 'whatsapp', 'phone', 'tel', 'numero', 'número']),
      decisor:  getFieldValue(row, ['decisor', 'responsavel', 'responsável']),
      nicho:    getFieldValue(row, ['nicho', 'segmento', 'niche', 'categoria', 'ramo']),
    }))
    .filter(c => cleanPhone(c.telefone).length >= 8)
}

export function parseExcelFile(file: File): Promise<RawContact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: '',
          raw: false,
        }) as Record<string, unknown>[]
        const contacts = normalizeRows(rows)
        resolve(contacts)
      } catch {
        reject(new Error('Arquivo inválido. Verifique se é .xlsx ou .csv válido.'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'))
    reader.readAsArrayBuffer(file)
  })
}

export interface DistribuicaoDia {
  dia: DiaSemana
  dateStr: string
  inicio: number
  fim: number
  quantidade: number
}

export function calcularDistribuicao(
  totalContatos: number,
  weekKey: string
): DistribuicaoDia[] {
  const dias: DiaSemana[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
  const weekDatesRaw = getWeekDates(weekKey)
  // Convert array to record for easy access
  const weekDates: Record<string, string> = {}
  weekDatesRaw.forEach((d: { dia: string; date: string }) => { weekDates[d.dia] = d.date })

  const capped = Math.min(totalContatos, 250)
  const porDia = Math.floor(capped / 5)
  const resto = capped % 5

  let index = 0
  return dias.map((dia, i) => {
    const quantidade = porDia + (i === 0 ? resto : 0)
    const inicio = index + 1
    const fim = index + quantidade
    index += quantidade
    return {
      dia,
      dateStr: weekDates[dia],
      inicio,
      fim,
      quantidade,
    }
  })
}

export function distribuirContatos(
  contacts: RawContact[],
  weekKey: string,
  operadorId: string,
  operadorNome: string,
  existingCalls: Call[]
): { calls: Call[]; duplicatasIgnoradas: number } {
  const capped = contacts.slice(0, 250)
  const distribuicao = calcularDistribuicao(capped.length, weekKey)
  const calls: Call[] = []
  let duplicatasIgnoradas = 0

  const existingPhones = new Set(
    existingCalls
      .filter(c => c.semanaKey === weekKey && c.operadorId === operadorId)
      .map(c => cleanPhone(c.numero))
  )

  distribuicao.forEach(({ dia, dateStr, inicio, quantidade }) => {
    const slice = capped.slice(inicio - 1, inicio - 1 + quantidade)
    const baseTime = new Date(dateStr + 'T08:00:00')

    slice.forEach((contact, i) => {
      const phone = cleanPhone(contact.telefone)

      if (existingPhones.has(phone)) {
        duplicatasIgnoradas++
        return
      }

      existingPhones.add(phone)

      const ts = new Date(baseTime)
      ts.setMinutes(ts.getMinutes() + i * 10)

      calls.push({
        id: generateId(),
        nome:    contact.nome    || 'Sem nome',
        empresa: contact.empresa || '',
        numero:  phone,
        status:  'nao-atendeu',
        anotacao: '',
        checklist: {
          apresentouProposta:  false,
          levantouObjecao:     false,
          agendouProximoPasso: false,
          demonstrouInteresse: false,
          solicitouRetorno:    false,
        },
        reuniaoAgendada: false,
        reuniaoData:     null,
        reuniaoHora:     null,
        reuniaoLocal:    null,
        followup:        false,
        followupData:    null,
        followupNota:    '',
        followupFeito:   false,
        operadorId,
        operadorNome,
        leadId:          null,
        timestamp:       ts.getTime(),
        diaSemana:       ts.getDay() as any,
        semanaKey:       weekKey,
        mes:             dateStr.slice(0, 7),
        tentativas:      1,
        periodo:         '',
      })
    })
  })

  return { calls, duplicatasIgnoradas }
}
