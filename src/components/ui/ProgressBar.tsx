// src/components/ui/ProgressBar.tsx
import React from 'react'

interface Props {
  value: number        // 0-100
  color?: string
  height?: number
  showGlow?: boolean
}

export function ProgressBar({ value, color = '#f0c040', height = 6, showGlow = false }: Props) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'var(--surface3)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: showGlow ? `0 0 8px ${color}80` : 'none',
        }}
      />
    </div>
  )
}

interface StatBarProps {
  label: string
  value: number
  max: number
  color?: string
  icon?: string
}

export function StatBar({ label, value, max, color = '#f0c040', icon }: StatBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-dm">
        <span style={{ color: 'var(--muted)' }}>{icon} {label}</span>
        <span style={{ color: 'var(--text)' }} className="font-semibold">
          {value}<span style={{ color: 'var(--muted)' }}>/{max}</span>
        </span>
      </div>
      <ProgressBar value={pct} color={color} height={5} showGlow={pct >= 100} />
    </div>
  )
}
