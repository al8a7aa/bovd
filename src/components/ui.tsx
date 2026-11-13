import type { ReactNode } from 'react'
import { AlertTriangle, Check, CircleAlert } from 'lucide-react'
import type { Status } from '../data/indicators'
import { tr } from '../i18n'

export { AlertCard } from './AlertCard'

export const STATUS_LABEL: Record<Status, string> = { green: 'Normal', amber: 'Watch', red: 'Act now' }
export const STATUS_HEX: Record<Status, string> = { green: '#46d39a', amber: '#f2b441', red: '#ff6b6b' }
const TONE: Record<Status, string> = { green: 'text-ok', amber: 'text-warn', red: 'text-bad' }
const ICON = { green: Check, amber: AlertTriangle, red: CircleAlert }

/** Status is always an icon plus a word, never colour alone. Plain text, no pill. */
export function StatusChip({ status, label }: { status: Status; label?: string }) {
  const Icon = ICON[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${TONE[status]}`}>
      <Icon size={14} aria-hidden />
      {label ?? tr(STATUS_LABEL[status])}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel p-4 ${className}`}>{children}</section>
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  )
}

/** Section heading with a hairline that runs to the edge, like a checklist divider. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
      {children}
      <span className="h-px flex-1 bg-line" aria-hidden />
    </h2>
  )
}

export const BTN_PRIMARY = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 font-semibold text-bg'
export const BTN_QUIET = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-4 text-sm hover:border-accent/60'

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <svg width="72" height="24" aria-hidden />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 70 + 1},${22 - ((v - min) / span) * 20}`)
    .join(' ')
  return (
    <svg width="72" height="24" viewBox="0 0 72 24" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function ReadinessRing({ score, status }: { score: number; status: Status }) {
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={tr('Readiness {score} out of 100', { score })} style={{ direction: 'ltr' }}>
      <circle cx="56" cy="56" r={r} fill="#000" stroke="#1f2a3c" strokeWidth="6" />
      <circle
        cx="56" cy="56" r={r} fill="none"
        stroke={STATUS_HEX[status]} strokeWidth="6" strokeLinecap="butt"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 56 56)"
      />
      <text x="56" y="54" textAnchor="middle" dominantBaseline="central" fill="#eef2f8" fontSize="30" fontWeight="600" fontFamily="var(--font-mono)">
        {score}
      </text>
      <text x="56" y="78" textAnchor="middle" fill="#8f9bb0" fontSize="10">
        {tr('of 100')}
      </text>
    </svg>
  )
}
