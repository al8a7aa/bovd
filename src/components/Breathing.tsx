import { useEffect, useState } from 'react'
import { tr } from '../i18n'
import { Card } from './ui'

const PHASE_SECONDS = 4
const ROUNDS = 5
/** box breathing: in, hold, out, hold — each the same length */
const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'] as const
const TOTAL = PHASE_SECONDS * PHASES.length * ROUNDS

export function BreathingCard() {
  // seconds since start; null = not running
  const [t, setT] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const running = t !== null

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setT((x) => (x === null ? x : x + 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (t !== null && t >= TOTAL) {
      setT(null)
      setFinished(true)
    }
  }, [t])

  const phase = running ? Math.floor(t / PHASE_SECONDS) % PHASES.length : 0
  const round = running ? Math.floor(t / (PHASE_SECONDS * PHASES.length)) + 1 : 1
  const left = running ? PHASE_SECONDS - (t % PHASE_SECONDS) : PHASE_SECONDS
  // lungs full after "in" and through the first hold; empty after "out" and through the second
  const full = running && phase <= 1

  return (
    <Card>
      <h3 className="font-semibold">{tr('Breathing exercise')}</h3>
      <p className="mt-1 text-sm text-muted">
        {tr('Box breathing calms your body in under two minutes. Use it before sleep or when you feel tense.')}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="grid size-32 shrink-0 place-items-center rounded-full border border-line" aria-hidden>
          <div
            className="grid size-28 place-items-center rounded-full bg-accent/25 ring-2 ring-accent motion-reduce:transition-none"
            style={{
              transform: `scale(${full ? 1 : 0.55})`,
              transition: running ? `transform ${PHASE_SECONDS}s linear` : 'transform 0.4s ease',
            }}
          />
        </div>

        <div className="min-w-40 flex-1">
          {running ? (
            <>
              {/* only the phase name is announced; the countdown would be too chatty */}
              <div className="text-2xl font-semibold" aria-live="assertive">{tr(PHASES[phase])}</div>
              <div className="mt-1 text-4xl font-semibold tabular-nums text-accent" aria-hidden>{left}</div>
              <div className="mt-1 text-sm text-muted">{tr('Round {n} of {total}', { n: round, total: ROUNDS })}</div>
            </>
          ) : (
            <p className="text-sm" aria-live="polite">
              {finished ? tr('Done. Notice how you feel now.') : tr('Follow the circle: in for 4, hold for 4, out for 4, hold for 4.')}
            </p>
          )}
          <button
            onClick={() => {
              setFinished(false)
              setT(running ? null : 0)
            }}
            className={`mt-3 rounded-md px-4 py-2.5 font-semibold ${running ? 'border border-line text-ink' : 'bg-accent text-bg'}`}
          >
            {running ? tr('Stop') : finished ? tr('Go again') : tr('Start')}
          </button>
        </div>
      </div>
    </Card>
  )
}
