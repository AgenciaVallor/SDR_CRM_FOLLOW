// src/components/ui/Avatar.tsx
import React from 'react'

interface Props {
  nome: string
  color: string
  size?: number
}

export function Avatar({ nome, color, size = 32 }: Props) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-syne font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        color: '#0a0a0f',
        fontSize: size * 0.4,
      }}
    >
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}
