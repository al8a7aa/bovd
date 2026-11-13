import { useEffect, useState } from 'react'
import type { Environment } from '../data/environments'
import type { Status } from '../data/indicators'
import { CAREER_LIMIT_MSV, missionDose } from '../engine/physics'
import { tr } from '../i18n'
import { Card, StatusChip } from './ui'

/** The team logo: a dark void with a heartbeat line that becomes an orbit ring. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="14" fill="#000" stroke="#4a5f8c" strokeWidth="1.2" />
      {/* heartbeat across the void, running on into the orbit ring */}
      <path
        d="M6 20.5 H14 L15 19.5 L16 22 L17.5 15 L19 25 L20.5 19.5 L21.5 20.5 C28 20.3 34 19 36.5 17.2 C39.5 15 36 13.6 32 13.8 M6 20.5 C1.5 21.5 0.5 25 7 25.2"
        fill="none" stroke="#1fb0dc" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
      <circle cx="36.3" cy="17.3" r="1.9" fill="#1fb0dc" />
      <g fill="#e8eef8">
        <circle cx="13" cy="11" r="0.7" /><circle cx="27" cy="10" r="0.6" /><circle cx="12" cy="29" r="0.6" /><circle cx="28" cy="30" r="0.7" />
      </g>
    </svg>
  )
}

export function RadiationCard({ env, days }: { env: Environment; days: number }) {
  const { dose, percent, daysLeft } = missionDose(env, days)
  const status: Status = percent >= 80 ? 'red' : percent >= 50 ? 'amber' : 'green'
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{tr('Radiation dose this mission')}</h3>
        <StatusChip status={status} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{dose.toFixed(0)}</span>
        <span className="text-sm text-muted">{tr('of {limit} mSv career limit', { limit: CAREER_LIMIT_MSV })}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel2" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={tr('Share of career radiation limit used')}>
        <div className={`h-full ${status === 'red' ? 'bg-bad' : status === 'amber' ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {tr('{rate} mSv per day × {days} days. At this rate you reach the limit in {left} more days.', { rate: env.doseRate, days, left: daysLeft })}
      </p>
      <p className="mt-1 text-xs text-muted">
        {tr('Estimate, not a dosimeter reading. Rate source:')} <span dir="ltr">{env.doseSource}</span>. {tr('Limit: NASA-STD-3001.')}
      </p>
    </Card>
  )
}

interface Flare {
  classType: string
  peakTime: string
}
type Source = 'NASA DONKI' | 'NOAA SWPC GOES'
type Weather = { state: 'loading' } | { state: 'offline' } | { state: 'ok'; flares: Flare[]; source: Source }

async function getJson(url: string): Promise<unknown[]> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

/** NASA DONKI first; if it does not answer, the NOAA GOES satellite flare list. */
async function loadFlares(): Promise<{ flares: Flare[]; source: Source }> {
  const end = new Date()
  const start = new Date(end.getTime() - 7 * 86_400_000)
  try {
    const rows = (await getJson(
      `https://api.nasa.gov/DONKI/FLR?startDate=${isoDate(start)}&endDate=${isoDate(end)}&api_key=DEMO_KEY`,
    )) as { classType?: string; peakTime?: string }[]
    return {
      source: 'NASA DONKI',
      flares: rows.filter((f) => f.classType).map((f) => ({ classType: f.classType!, peakTime: f.peakTime ?? '' })),
    }
  } catch {
    const rows = (await getJson('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json')) as {
      max_class?: string
      max_time?: string
    }[]
    return {
      source: 'NOAA SWPC GOES',
      flares: rows.filter((f) => f.max_class).map((f) => ({ classType: f.max_class!, peakTime: f.max_time ?? '' })),
    }
  }
}

const CACHE_KEY = 'bovd-flares-v2'
const isoDate = (d: Date) => d.toISOString().slice(0, 10)
/** "X1.2" → comparable number: letter sets the power of ten, digits the multiplier */
const flarePower = (c: string) => 10 ** 'ABCMX'.indexOf(c[0]) * (parseFloat(c.slice(1)) || 1)

/** Live solar flare list from NASA DONKI. Works without it: the card just says there is no link. */
export function SpaceWeatherCard() {
  const [w, setW] = useState<Weather>({ state: 'loading' })

  useEffect(() => {
    let alive = true
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        setW({ state: 'ok', ...JSON.parse(cached) })
        return
      }
    } catch { /* storage blocked: fetch instead */ }
    loadFlares()
      .then((data) => {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
        if (alive) setW({ state: 'ok', ...data })
      })
      .catch(() => alive && setW({ state: 'offline' }))
    return () => { alive = false }
  }, [])

  let body
  if (w.state === 'loading') body = <p className="mt-2 text-sm text-muted">{tr('Asking for the latest solar activity…')}</p>
  else if (w.state === 'offline')
    body = <p className="mt-2 text-sm text-muted">{tr('No link to Earth data right now. Your health checks still work without it.')}</p>
  else if (w.flares.length === 0) body = <p className="mt-2 text-sm">{tr('No solar flares reported in the last 7 days.')}</p>
  else {
    const top = w.flares.reduce((a, b) => (flarePower(b.classType) > flarePower(a.classType) ? b : a))
    const level: Status = top.classType[0] === 'X' ? 'red' : top.classType[0] === 'M' ? 'amber' : 'green'
    body = (
      <>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-semibold">{top.classType}</span>
          <StatusChip status={level} label={tr(level === 'red' ? 'Strong flare' : level === 'amber' ? 'Medium flare' : 'Quiet')} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {tr('Strongest solar flare of the last 7 days ({n} reported), on {date}.', { n: w.flares.length, date: top.peakTime?.slice(0, 10) })}
        </p>
        <p className="mt-2 text-sm">
          {tr(
            level === 'red'
              ? 'Strong flares can be followed by a particle storm. Know your route to the storm shelter and listen for a shelter call.'
              : level === 'amber'
                ? 'Medium flares are common. No action needed unless a particle storm warning follows.'
                : 'The Sun is quiet. No extra radiation action needed.',
          )}
        </p>
      </>
    )
  }

  return (
    <Card>
      <h3 className="font-semibold">{tr('Space weather')}</h3>
      {body}
      <p className="mt-2 text-xs text-muted">
        {tr('Live solar flare data:')} <span dir="ltr">{w.state === 'ok' ? w.source : 'NASA DONKI / NOAA SWPC GOES'}</span>
      </p>
    </Card>
  )
}
