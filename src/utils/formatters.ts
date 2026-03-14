// src/utils/formatters.ts — Phone mask, currency, etc.

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatTime(hora: string): string {
  return hora
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export const TAG_LABELS: Record<string, string> = {
  dentista: 'Dentista',
  otica: 'Ótica',
  imoveis: 'Imóveis',
  turismo: 'Turismo',
  seguros: 'Seguros',
  saude: 'Saúde',
  outros: 'Outros',
}

export const TAG_COLORS: Record<string, string> = {
  dentista: '#4080f0',
  otica:    '#8050d0',
  imoveis:  '#e05a30',
  turismo:  '#30d090',
  seguros:  '#e04060',
  saude:    '#f0c040',
  outros:   '#7070a0',
}

export const STATUS_LABELS: Record<string, string> = {
  atendida:     'Atendida',
  perdida:      'Perdida',
  'nao-atendeu': 'Não Atendeu',
  'caixa-postal': 'Caixa Postal',
}

export const STATUS_COLORS: Record<string, string> = {
  atendida:      '#30d090',
  perdida:       '#e04060',
  'nao-atendeu': '#f0c040',
  'caixa-postal': '#7070a0',
}

export const LOCAL_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  zoom:       'Zoom',
  meet:       'Google Meet',
  telefone:   'Telefone',
  whatsapp:   'WhatsApp',
}

export const PRIORIDADE_LABELS: Record<string, string> = {
  alta:  'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const PRIORIDADE_COLORS: Record<string, string> = {
  alta:  '#e04060',
  media: '#f0c040',
  baixa: '#30d090',
}

export const ORIGEM_LABELS: Record<string, string> = {
  ligacao:   'Ligação',
  indicacao: 'Indicação',
  ads:       'Anúncio',
  organico:  'Orgânico',
  outro:     'Outro',
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(diff / 86400000)}d`
}
