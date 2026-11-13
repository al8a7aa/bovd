import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { SCHEDULE, clockNow } from '../data/schedule'
import { missionDay, useStore } from '../store'
import { tr } from '../i18n'

/** Current time, refreshed every `ms`, so countdowns and "due" states stay live. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export const canNotify = () => typeof Notification !== 'undefined'

function notify(title: string, body: string) {
  if (canNotify() && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: './icon.svg' }) } catch { /* some browsers only allow this from a service worker */ }
  }
}

// things already announced in this session, so nothing repeats
const announced = new Set<string>()

/**
 * Sends a system notification when a plan task comes due or a timer ends.
 * Works while the app is open (in a tab or installed); it cannot wake a closed app.
 */
export function useReminders() {
  useEffect(() => {
    const check = () => {
      const s = useStore.getState()
      const day = missionDay(s.startDate)
      const done = s.done[s.activeId]?.[day] ?? []
      const now = clockNow()
      for (const task of SCHEDULE) {
        const key = `task:${day}:${task.id}`
        // announce in the minute it comes due, not hours later when the app is opened
        if (task.time === now && !done.includes(task.id) && !announced.has(key)) {
          announced.add(key)
          notify(tr(task.label), tr(task.detail))
        }
      }
      for (const t of s.timers) {
        if (t.endsAt <= Date.now() && !announced.has(t.id)) {
          announced.add(t.id)
          notify(tr('Time to re-measure'), t.label)
        }
      }
    }
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])
}

/** Running re-measure timers, shown above every screen until dismissed. */
export function TimerBar() {
  const timers = useStore((s) => s.timers)
  const clearTimer = useStore((s) => s.clearTimer)
  const now = useNow(timers.length ? 1000 : 60_000)
  if (timers.length === 0) return null

  return (
    <ul className="mb-4 space-y-2" aria-label={tr('Timers')}>
      {timers.map((t) => {
        const left = Math.max(0, Math.ceil((t.endsAt - now) / 1000))
        const up = left === 0
        return (
          <li
            key={t.id}
            role={up ? 'alert' : undefined}
            className={`flex items-center gap-3 rounded-lg border px-3 ${up ? 'border-accent bg-accent/10' : 'border-line bg-panel'}`}
          >
            <BellRing size={18} className={up ? 'shrink-0 text-accent' : 'shrink-0 text-muted'} aria-hidden />
            <span className="font-mono text-lg tabular-nums" dir="ltr">
              {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1 py-2 text-sm">
              {up && <strong>{tr('Time is up.')} </strong>}
              {t.label}
            </span>
            <button onClick={() => clearTimer(t.id)} aria-label={tr('Dismiss timer')} className="grid size-11 shrink-0 place-items-center text-muted hover:text-ink">
              <X size={18} aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
