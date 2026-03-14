// src/components/ui/Badge.tsx
import React from 'react'

interface Props {
  children: React.ReactNode
  color?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, color = 'var(--accent)', size = 'sm' }: Props) {
  return (
    <span
      className="inline-flex items-center rounded-full font-semibold font-dm"
      style={{
        background: color + '22',
        color,
        fontSize: size === 'sm' ? 11 : 12,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  )
}
