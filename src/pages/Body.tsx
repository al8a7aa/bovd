import { useState } from 'react'
import { INDICATORS, formatValue, type IndicatorId, type RegionId, type Status } from '../data/indicators'
import { REGIONS, SYMPTOMS } from '../data/bodyRegions'
import { regionStatus } from '../engine/status'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { BreathingCard } from '../components/Breathing'
import { AlertCard, Card, PageTitle, STATUS_HEX, STATUS_LABEL, StatusChip } from '../components/ui'

/** hotspot centre and which side its label sits on */
const SPOTS: Record<RegionId, { x: number; y: number; side: 'left' | 'right' }> = {
  brain: { x: 160, y: 36, side: 'right' },
  eyes: { x: 160, y: 62, side: 'left' },
  immune: { x: 160, y: 112, side: 'left' },
  heart: { x: 174, y: 140, side: 'right' },
  gut: { x: 160, y: 196, side: 'left' },
  bones: { x: 178, y: 330, side: 'right' },
}
const NEUTRAL = '#93a3bf'

export default function Body({ openTrend }: { openTrend: (id: IndicatorId) => void }) {
  const { entries, latest, assessments, alerts } = useHealth()
  const [selected, setSelected] = useState<RegionId>('heart')

  const statusOf = (id: RegionId): Status | null => (latest ? regionStatus(id, entries, latest.entry) : null)
  const region = REGIONS.find((r) => r.id === selected)!
  const regionState = statusOf(selected)
  const regionAlerts = alerts.filter((a) => a.region === selected)
  const regionSymptoms = SYMPTOMS.filter((s) => s.region === selected && latest?.entry.symptoms.includes(s.id))

  return (
    <>
      <PageTitle title={tr('Body map')} sub={tr('Select a body system to see its status, how spaceflight affects it and what protects it.')} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex justify-center self-start">
          {/* the figure keeps one layout in both languages; only the label text changes */}
          <svg viewBox="0 0 320 440" className="w-full max-w-80" role="group" aria-label={tr('Body systems')} style={{ direction: 'ltr' }}>
            <g fill="#1d2a44" stroke="#2c3d5f" strokeWidth="1.5">
              <circle cx="160" cy="48" r="32" />
              <rect x="150" y="76" width="20" height="16" />
              <rect x="118" y="88" width="84" height="146" rx="26" />
              <rect x="94" y="94" width="22" height="130" rx="11" transform="rotate(8 105 94)" />
              <rect x="204" y="94" width="22" height="130" rx="11" transform="rotate(-8 215 94)" />
              <rect x="124" y="222" width="32" height="200" rx="15" />
              <rect x="164" y="222" width="32" height="200" rx="15" />
            </g>
            {REGIONS.map((r) => {
              const s = SPOTS[r.id]
              const st = statusOf(r.id)
              const color = st ? STATUS_HEX[st] : NEUTRAL
              const active = selected === r.id
              const lx = s.side === 'right' ? 250 : 70
              return (
                <g
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${tr(r.name)}${st ? `: ${tr(STATUS_LABEL[st])}` : ''}`}
                  onClick={() => setSelected(r.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(r.id))}
                  className="cursor-pointer"
                >
                  <line x1={s.x} y1={s.y} x2={lx} y2={s.y} stroke={color} strokeWidth="1" opacity="0.5" />
                  {st && st !== 'green' && <circle cx={s.x} cy={s.y} r="9" fill={color} className="pulse-ring" />}
                  <circle cx={s.x} cy={s.y} r={active ? 11 : 9} fill={color} stroke={active ? '#e8eef8' : '#080d18'} strokeWidth="2.5" />
                  <text
                    x={s.side === 'right' ? lx + 4 : lx - 4}
                    y={s.y}
                    textAnchor={s.side === 'right' ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight={active ? 700 : 500}
                    fill={active ? '#e8eef8' : NEUTRAL}
                  >
                    {tr(r.short)}
                  </text>
                  {/* generous invisible hit area */}
                  <rect x={s.side === 'left' ? 0 : s.x - 13} y={s.y - 13} width={s.side === 'left' ? s.x + 13 : 320 - s.x + 13} height="26" fill="transparent" />
                </g>
              )
            })}
          </svg>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">{tr(region.name)}</h2>
              {regionState ? <StatusChip status={regionState} /> : <span className="text-xs text-muted">{tr('No readings yet')}</span>}
            </div>
            <p className="mt-2 text-sm">{tr(region.does)}</p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">
              {tr('Spaceflight hazard: {hazard}', { hazard: tr(region.hazard) })}
            </h3>
            <p className="mt-1 text-sm text-muted">{tr(region.inSpace)}</p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{tr('Your latest readings')}</h3>
            <ul className="mt-1 divide-y divide-line">
              {INDICATORS.filter((i) => i.region === selected).map((i) => {
                const v = latest?.entry.values[i.id]
                const a = assessments[i.id]
                return (
                  <li key={i.id}>
                    <button onClick={() => openTrend(i.id)} className="flex w-full items-center justify-between gap-3 py-2.5 text-start text-sm hover:text-accent">
                      <span>{tr(i.name)}</span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums text-muted">{v === undefined ? '—' : `${formatValue(i, v)} ${i.id === 'mood' ? '' : tr(i.unit)}`}</span>
                        {a && <StatusChip status={a.status} />}
                      </span>
                    </button>
                  </li>
                )
              })}
              {INDICATORS.every((i) => i.region !== selected) && (
                <li className="py-2.5 text-sm text-muted">{tr('No daily measurement. This system is tracked through symptoms and a weekly vision test.')}</li>
              )}
            </ul>
            {regionSymptoms.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="font-semibold">{tr('Symptoms logged:')} </span>
                {regionSymptoms.map((s) => tr(s.label)).join(tr(', '))}
              </p>
            )}

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{tr('How to protect it')}</h3>
            <ul className="mt-1 list-disc space-y-1 ps-5 text-sm">
              {region.protect.map((p) => (
                <li key={p}>{tr(p)}</li>
              ))}
            </ul>
          </Card>
          {regionAlerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
          {selected === 'brain' && <BreathingCard />}
        </div>
      </div>
    </>
  )
}
