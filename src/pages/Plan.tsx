import { useState } from 'react'
import { Award, Bell, BellOff, CheckCircle2, Circle, Flame, Lock } from 'lucide-react'
import type { Page } from '../App'
import { SCHEDULE, clockNow, taskState, type Task } from '../data/schedule'
import { XP_PER_LEVEL, badges, streak, totalXp } from '../engine/gamify'
import { missionDay, useDoneToday, useStore } from '../store'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { BreathingCard } from '../components/Breathing'
import { canNotify, useNow } from '../components/Timers'
import { BTN_PRIMARY, BTN_QUIET, Card, PageTitle, SectionTitle } from '../components/ui'

const RANKS = ['Cadet', 'Crew member', 'Specialist', 'Flight engineer', 'Pilot', 'Commander']

/** Which plan tasks are done today, counting the health check automatically. */
function usePlan() {
  const { todayEntry } = useHealth()
  const done = useDoneToday()
  useNow(30_000) // re-check which tasks are due as the clock moves
  const now = clockNow()
  const isDone = (t: Task) => (t.auto === 'checkin' ? !!todayEntry : done.includes(t.id))
  const open = SCHEDULE.filter((t) => !isDone(t))
  // the oldest task still open is what to do next
  return { now, isDone, next: open[0], left: open.length }
}

/** The single next task, with a one-tap way to finish it. Shown on Today and in the wide side panel. */
export function NextUp({ go, compact = false }: { go: (p: Page) => void; compact?: boolean }) {
  const { now, next } = usePlan()
  const day = useStore((s) => missionDay(s.startDate))
  const toggleDone = useStore((s) => s.toggleDone)

  if (!next) {
    return <p className={`text-sm text-muted ${compact ? '' : 'rounded-lg border border-line bg-panel p-4'}`}>{tr('Today’s plan is complete.')}</p>
  }
  const due = next.time <= now
  const act = next.auto === 'checkin' ? () => go('checkin') : () => toggleDone(day, next.id)

  return (
    <div className={compact ? '' : 'rounded-lg border border-line bg-panel p-4'}>
      <div className="flex items-start gap-3">
        <span className={`font-mono text-lg tabular-nums ${due ? 'text-accent' : 'text-muted'}`} dir="ltr">{next.time}</span>
        <div className="min-w-0 flex-1">
          {!compact && <div className="font-mono text-xs uppercase tracking-widest text-muted">{due ? tr('Due now') : tr('Next up')}</div>}
          <div className="font-semibold">{tr(next.label)}</div>
          <div className="text-sm text-muted">{tr(next.detail)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={act} className={BTN_PRIMARY}>{next.auto === 'checkin' ? tr('Start check') : tr('Mark done')}</button>
        <button onClick={() => go('plan')} className={BTN_QUIET}>{tr('See full plan')}</button>
      </div>
    </div>
  )
}

function Reminders() {
  const [permission, setPermission] = useState(canNotify() ? Notification.permission : 'unsupported')
  if (permission === 'unsupported') {
    return <p className="text-sm text-muted">{tr('This browser cannot show reminders. Keep the plan open instead.')}</p>
  }
  if (permission === 'granted') {
    return (
      <p className="flex items-center gap-2 text-sm">
        <Bell size={16} className="text-accent" aria-hidden />
        {tr('Reminders are on. You get a notice when a task is due or a timer ends, while the app is open.')}
      </p>
    )
  }
  if (permission === 'denied') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <BellOff size={16} aria-hidden />
        {tr('Reminders are blocked. Allow notifications for this site in your browser settings.')}
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 flex-1 text-sm text-muted">{tr('Get a notice when a task is due or a re-measure timer ends.')}</p>
      <button onClick={() => Notification.requestPermission().then(setPermission)} className={BTN_QUIET}>
        <Bell size={16} aria-hidden />
        {tr('Turn on reminders')}
      </button>
    </div>
  )
}

export default function Plan({ go }: { go: (p: Page) => void }) {
  const { entries, today } = useHealth()
  const { now, isDone, left } = usePlan()
  const toggleDone = useStore((s) => s.toggleDone)
  const xp = totalXp(entries, today)
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const into = xp % XP_PER_LEVEL
  const run = streak(entries, today)
  const earned = badges(entries, today)

  return (
    <>
      <PageTitle
        title={tr('Today’s plan')}
        sub={left === 0 ? tr('Everything is done. Rest well.') : tr('Tasks left today: {n}', { n: left })}
      />

      <Card className="mb-3"><Reminders /></Card>

      <ol className="rounded-lg border border-line bg-panel">
        {SCHEDULE.map((t) => {
          const state = taskState(t, isDone(t), now)
          const auto = t.auto === 'checkin'
          return (
            <li key={t.id} className="flex items-center gap-3 border-b border-line px-4 last:border-b-0">
              <span className={`w-12 shrink-0 font-mono text-sm tabular-nums ${state === 'due' ? 'text-accent' : 'text-muted'}`} dir="ltr">{t.time}</span>
              <div className="min-w-0 flex-1 py-3">
                <div className={state === 'done' ? 'text-muted line-through' : 'font-medium'}>{tr(t.label)}</div>
                <div className="text-sm text-muted">{tr(t.detail)}</div>
                {state === 'due' && <div className="mt-0.5 text-xs font-semibold text-accent">{tr('Due now')}</div>}
              </div>
              {auto && state !== 'done' ? (
                <button onClick={() => go('checkin')} className={BTN_QUIET}>{tr('Start check')}</button>
              ) : (
                <button
                  onClick={() => !auto && toggleDone(today, t.id)}
                  disabled={auto}
                  aria-pressed={state === 'done'}
                  aria-label={tr(state === 'done' ? 'Done' : 'Mark done')}
                  className="grid size-11 shrink-0 place-items-center"
                >
                  {state === 'done' ? <CheckCircle2 size={24} className="text-ok" aria-hidden /> : <Circle size={24} className="text-muted" aria-hidden />}
                </button>
              )}
            </li>
          )
        })}
      </ol>

      <SectionTitle>{tr('Calm your mind')}</SectionTitle>
      <BreathingCard />

      <SectionTitle>{tr('Progress')}</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex items-center gap-4">
          <Flame size={36} className={run > 0 ? 'text-warn' : 'text-muted'} aria-hidden />
          <div>
            <div className="font-mono text-3xl font-semibold tabular-nums">{tr('{n} days', { n: run })}</div>
            <div className="text-sm text-muted">{tr('Check-in streak')}</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-lg font-semibold">
              {tr('Level {n} · {rank}', { n: level, rank: tr(RANKS[Math.min(level - 1, RANKS.length - 1)]) })}
            </div>
            <div className="font-mono text-sm tabular-nums text-muted">{tr('{n} points', { n: xp })}</div>
          </div>
          <div className="mt-3 h-1.5 bg-panel2" role="progressbar" aria-valuenow={into} aria-valuemin={0} aria-valuemax={XP_PER_LEVEL} aria-label={tr('Progress to next level')}>
            <div className="h-full bg-accent" style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} />
          </div>
          <div className="mt-2 text-xs text-muted">{tr('{n} points to level {next}', { n: XP_PER_LEVEL - into, next: level + 1 })}</div>
        </Card>
      </div>

      <SectionTitle>{tr('Badges · {a} of {b}', { a: earned.filter((b) => b.earned).length, b: earned.length })}</SectionTitle>
      <ul className="grid gap-x-6 rounded-lg border border-line bg-panel px-4 sm:grid-cols-2">
        {earned.map((b) => (
          <li key={b.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            {b.earned ? <Award size={22} className="shrink-0 text-accent" aria-hidden /> : <Lock size={20} className="shrink-0 text-muted" aria-hidden />}
            <div>
              <div className={`font-medium ${b.earned ? '' : 'text-muted'}`}>{tr(b.name)}</div>
              <div className="text-xs text-muted">{b.earned ? tr('Earned') : tr(b.how)}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
