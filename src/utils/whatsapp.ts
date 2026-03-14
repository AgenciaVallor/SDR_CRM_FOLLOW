// src/utils/whatsapp.ts

export function openWhatsApp(numero: string, mensagem?: string): void {
  const limpo = numero.replace(/\D/g, '')
  const comDDI = limpo.startsWith('55') ? limpo : `55${limpo}`
  const url = mensagem
    ? `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/${comDDI}`
  window.open(url, '_blank')
}

export function buildWhatsAppMessage(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (msg, [key, val]) => msg.replace(new RegExp(`{{${key}}}`, 'g'), val),
    template
  )
}
