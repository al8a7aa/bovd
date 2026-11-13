import { ChevronRight } from 'lucide-react'
import type { Page } from '../App'
import { INDICATORS, formatValue, type IndicatorId, type Status } from '../data/indicators'
import { readiness } from '../engine/status'
import { streak } from '../engine/gamify'
import { delayText } from '../engine/physics'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { RadiationCard, SpaceWeatherCard } from '../components/space'
import { NextUp } from './Plan'
import { AlertCard, BTN_PRIMARY, Card, PageTitle, ReadinessRing, SectionTitle, Sparkline, STATUS_HEX, StatusChip } from '../components/ui'

interface Props {
  go: (p: Page) => void
  openTrend: (id: IndicatorId) => void
}

export default function Dashboard({ go, openTrend }: Props) {
  const { entries, today, env, member, latest, todayEntry, assessments, alerts } = useHealth()
  const place = tr(env.name)

  if (!latest) {
    return (
      <>
        <PageTitle title={tr('Welcome aboard, {name}', { name: tr(member.name) })} sub={tr('Mission day {day} · {place}', { day: today, place })} />
        <Card>
          <p>{tr('You have no health checks yet. The first week sets your personal baseline, so try to log every day.')}</p>
          <button onClick={() => go('checkin')} className={`mt-4 ${BTN_PRIMARY}`}>
            {tr('Start first health check')}
          </button>
        </Card>
      </>
    )
  }

  const score = readiness(entries, latest.entry)
  const overall: Status = alerts.some((a) => a.level === 'red') ? 'red' : alerts.length ? 'amber' : 'green'
  const headline =
    overall === 'green'
      ? tr('All indicators are in range.')
      : overall === 'amber'
        ? tr('Items to watch: {n}', { n: alerts.length })
        : tr('Something needs action now.')

  return (
    <>
      <PageTitle
        title={tr('{name} — today', { name: tr(member.name) })}
        sub={tr('Mission day {day} · {place} · signal delay to Earth: {delay}', { day: today, place, delay: delayText(env) })}
      />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4 sm:contents">
          <ReadinessRing score={score} status={overall} />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs uppercase tracking-widest text-muted">{tr('Health readiness')}</div>
            <p className="mt-1 text-lg font-semibold">{headline}</p>
            <p className="mt-1 text-sm text-muted">
              {tr('Based on your check on day {day}.', { day: latest.day })} {latest.day !== today && tr('Today’s check is still due.')}{' '}
              {tr('Streak: {n} days.', { n: streak(entries, today) })}
            </p>
          </div>
        </div>
        <button onClick={() => go('checkin')} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
          {todayEntry ? tr('Update today’s check') : tr('Start today’s check')}
        </button>
      </Card>

      {/* on a wide screen the side panel already shows the next task */}
      <div className="mt-3 xl:hidden">
        <NextUp go={go} />
      </div>

      {alerts.length > 0 && (
        <>
          <SectionTitle>{tr('What to do')}</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </>
      )}

      <SectionTitle>{tr('Your indicators')}</SectionTitle>
      {/* one table, not a wall of tiles: every reading on a line with its status */}
      <ul className="rounded-lg border border-line bg-panel">
        {INDICATORS.map((ind) => {
          const v = latest.entry.values[ind.id]
          const a = assessments[ind.id]
          const history: number[] = []
          for (let d = Math.max(1, latest.day - 13); d <= latest.day; d++) {
            const x = entries[d]?.values[ind.id]
            if (x !== undefined) history.push(x)
          }
          return (
            <li key={ind.id} className="border-b border-line last:border-b-0">
              <button
                onClick={() => openTrend(ind.id)}
                className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-4 py-2 text-start hover:bg-panel2 md:grid-cols-[minmax(0,1fr)_7rem_5rem_8rem_auto]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{tr(ind.name)}</span>
                  {/* phone: status sits under the name; computer: it has its own column */}
                  <span className="mt-0.5 flex items-center gap-2 md:hidden">
                    {a ? <StatusChip status={a.status} /> : <span className="text-xs text-muted">{tr('Not measured')}</span>}
                  </span>
                </span>
                <span className="text-end">
                  <span className="font-mono text-lg font-semibold tabular-nums">{v === undefined ? '—' : formatValue(ind, v)}</span>
                  {v !== undefined && ind.id !== 'mood' && <span className="ms-1 text-xs text-muted">{tr(ind.unit)}</span>}
                </span>
                <span className="hidden md:block">
                  <Sparkline values={history} color={a ? STATUS_HEX[a.status] : '#8f9bb0'} />
                </span>
                <span className="hidden md:block">
                  {a ? <StatusChip status={a.status} /> : <span className="text-xs text-muted">{tr('Not measured')}</span>}
                  {a?.unusual && <span className="block text-xs text-muted">{tr('Unusual for you')}</span>}
                </span>
                <ChevronRight size={16} className="text-muted rtl:rotate-180" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>

      <SectionTitle>{tr('Your environment')}</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <RadiationCard env={env} days={today} />
        <SpaceWeatherCard />
      </div>
    </>
  )
}
