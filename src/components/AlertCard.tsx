import { Timer } from 'lucide-react'
import type { Alert } from '../engine/guidance'
import { missionDay, useDoneToday, useStore } from '../store'
import { tr } from '../i18n'
import { STATUS_HEX, StatusChip } from './ui'

/** A finding plus its action steps. Steps are ticked off as you do them; waits get a timer. */
export function AlertCard({ alert }: { alert: Alert }) {
  const done = useDoneToday()
  const day = useStore((s) => missionDay(s.startDate))
  const toggleDone = useStore((s) => s.toggleDone)
  const startTimer = useStore((s) => s.startTimer)
  const timers = useStore((s) => s.timers)

  const keyOf = (i: number) => `${alert.id}:${i}`
  const doneCount = alert.doNow.filter((_, i) => done.includes(keyOf(i))).length

  return (
    <article className="rounded-lg border border-line bg-panel" style={{ borderInlineStartWidth: 3, borderInlineStartColor: STATUS_HEX[alert.level] }}>
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{alert.title}</h3>
          <StatusChip status={alert.level} />
        </div>
        <p className="mt-2 text-sm">{alert.seen}</p>
        <p className="mt-1 text-sm text-muted">{alert.why}</p>
      </div>

      {alert.doNow.length > 0 && (
        <div className="border-t border-line px-4 pt-3 pb-1">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
            <span>{tr('Do now')}</span>
            <span dir="ltr">{doneCount}/{alert.doNow.length}</span>
          </div>
          <ul>
            {alert.doNow.map((step, i) => {
              const checked = done.includes(keyOf(i))
              const running = timers.some((t) => t.label === step.text)
              return (
                <li key={step.text} className="flex items-center gap-2 border-b border-line/60 last:border-b-0">
                  <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 py-2 text-sm">
                    <input type="checkbox" className="size-5 shrink-0" checked={checked} onChange={() => toggleDone(day, keyOf(i))} />
                    <span className={checked ? 'text-muted line-through' : ''}>{step.text}</span>
                  </label>
                  {step.timerMin && !checked && (
                    <button
                      onClick={() => startTimer(step.text, step.timerMin!)}
                      disabled={running}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-line px-3 text-xs hover:border-accent/60 disabled:opacity-50"
                    >
                      <Timer size={14} aria-hidden />
                      {running ? tr('Timer running') : tr('{n} min timer', { n: step.timerMin })}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="border-t border-line p-4">
        <p className="text-sm">
          <span className="font-semibold">{tr('Who to tell:')} </span>
          {alert.escalate}
        </p>
        <p className="mt-2 text-xs text-muted">
          {tr('Source:')} <span dir="ltr">{alert.source}</span>
        </p>
      </div>
    </article>
  )
}
