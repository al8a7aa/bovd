import { useState } from 'react'
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react'
import type { Page } from '../App'
import { INDICATORS, MOOD_LABELS, formatValue, type IndicatorId } from '../data/indicators'
import { SYMPTOMS } from '../data/bodyRegions'
import { assess, assessEntry, type Entry } from '../engine/status'
import { useStore } from '../store'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { Card, PageTitle, StatusChip } from '../components/ui'

const MOOD_FACES = ['', '😞', '🙁', '😐', '🙂', '😄']

export default function CheckIn({ go }: { go: (p: Page) => void }) {
  const { entries, today, latest, todayEntry } = useHealth()
  const saveEntry = useStore((s) => s.saveEntry)

  // Start each control at the last reading so small day-to-day changes are quick to enter.
  const start = todayEntry ?? latest?.entry
  const [values, setValues] = useState<Record<IndicatorId, number>>(
    () =>
      Object.fromEntries(
        INDICATORS.map((i) => [i.id, start?.values[i.id] ?? Math.round(((i.green[0] + Math.min(i.green[1], i.max)) / 2) / i.step) * i.step]),
      ) as Record<IndicatorId, number>,
  )
  const [skipped, setSkipped] = useState<Set<IndicatorId>>(new Set())
  const [symptoms, setSymptoms] = useState<string[]>(todayEntry?.symptoms ?? [])
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState<Entry | null>(null)

  const total = INDICATORS.length + 1
  const ind = INDICATORS[step]

  const finish = () => {
    const entry: Entry = {
      values: Object.fromEntries(INDICATORS.filter((i) => !skipped.has(i.id)).map((i) => [i.id, values[i.id]])),
      symptoms,
    }
    saveEntry(today, entry)
    setSaved(entry)
  }

  if (saved) {
    const a = assessEntry({ ...entries, [today]: saved }, saved)
    const flagged = INDICATORS.filter((i) => a[i.id] && a[i.id]!.status !== 'green')
    return (
      <>
        <PageTitle title={tr('Check saved')} sub={tr('Mission day {day}', { day: today })} />
        <Card>
          <p className="text-lg font-semibold">
            {flagged.length === 0 ? tr('Everything you measured is in range.') : tr('Readings that need a look: {n}', { n: flagged.length })}
          </p>
          <ul className="mt-3 divide-y divide-line">
            {INDICATORS.filter((i) => a[i.id]).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{tr(i.name)}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-muted">
                    {formatValue(i, saved.values[i.id]!)} {i.id !== 'mood' && tr(i.unit)}
                  </span>
                  <StatusChip status={a[i.id]!.status} />
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => go('home')} className="mt-4 rounded-md bg-accent px-4 py-2.5 font-semibold text-bg">
            {tr('See what to do')}
          </button>
        </Card>
      </>
    )
  }

  const set = (v: number) => {
    const clamped = Math.min(ind.max, Math.max(ind.min, v))
    setValues({ ...values, [ind.id]: +clamped.toFixed(2) })
    if (skipped.has(ind.id)) {
      const next = new Set(skipped)
      next.delete(ind.id)
      setSkipped(next)
    }
  }
  const skip = () => {
    setSkipped(new Set(skipped).add(ind.id))
    setStep(step + 1)
  }

  return (
    <>
      <PageTitle title={tr('Daily health check')} sub={tr('Mission day {day} · step {step} of {total}', { day: today, step: step + 1, total })} />
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-panel2" aria-hidden>
        <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      {ind ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">{tr(ind.name)}</h2>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{tr('How to measure')}</h3>
            <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm">
              {ind.how.map((s) => (
                <li key={s}>{tr(s)}</li>
              ))}
            </ol>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{tr('Why it matters in space')}</h3>
            <p className="mt-2 text-sm text-muted">{tr(ind.why)}</p>
          </Card>

          <Card className="flex flex-col">
            <label htmlFor="reading" className="text-xs font-semibold uppercase tracking-wider text-muted">
              {tr('Your reading')}
            </label>
            {ind.id === 'mood' ? (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => set(m)}
                    aria-pressed={values.mood === m}
                    className={`rounded-md border px-1 py-3 text-center ${values.mood === m ? 'border-accent bg-accent/10' : 'border-line bg-panel2'}`}
                  >
                    <div className="text-2xl" aria-hidden>{MOOD_FACES[m]}</div>
                    <div className="mt-1 text-xs">{tr(MOOD_LABELS[m])}</div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* numbers and sliders stay left-to-right in both languages */}
                <div className="mt-3 flex items-center gap-3" dir="ltr">
                  <button onClick={() => set(values[ind.id] - ind.step)} aria-label={tr('Decrease')} className="grid size-11 place-items-center rounded-md border border-line bg-panel2">
                    <Minus size={18} />
                  </button>
                  <div className="flex flex-1 items-baseline justify-center gap-2">
                    <input
                      id="reading"
                      type="number"
                      inputMode="decimal"
                      value={values[ind.id]}
                      min={ind.min}
                      max={ind.max}
                      step={ind.step}
                      onChange={(e) => e.target.value !== '' && set(Number(e.target.value))}
                      className="w-32 rounded-md border border-line bg-bg px-2 py-2 text-center text-3xl font-semibold tabular-nums"
                    />
                    <span className="text-muted">{tr(ind.unit)}</span>
                  </div>
                  <button onClick={() => set(values[ind.id] + ind.step)} aria-label={tr('Increase')} className="grid size-11 place-items-center rounded-md border border-line bg-panel2">
                    <Plus size={18} />
                  </button>
                </div>
                <input
                  type="range"
                  dir="ltr"
                  aria-label={tr(ind.name)}
                  value={values[ind.id]}
                  min={ind.min}
                  max={ind.max}
                  step={ind.step}
                  onChange={(e) => set(Number(e.target.value))}
                  className="mt-4 w-full"
                />
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
              <StatusChip status={assess(ind, values[ind.id], entries).status} />
              <span className="text-muted">
                {tr('Normal range: {range}', {
                  range: ind.id === 'mood' ? tr('Good to Great') : `${ind.green[0]}–${ind.green[1]} ${tr(ind.unit)}`,
                })}
              </span>
            </div>
            {start?.values[ind.id] !== undefined && (
              <p className="mt-2 text-xs text-muted">
                {tr('Starts at your last reading ({v}). Change it to today’s measurement.', { v: formatValue(ind, start.values[ind.id]!) })}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-6">
              <button onClick={() => setStep(step - 1)} disabled={step === 0} className="flex items-center gap-1 rounded-md border border-line px-3 py-2.5 text-sm disabled:opacity-40">
                <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden /> {tr('Back')}
              </button>
              <div className="flex gap-2">
                <button onClick={skip} className="rounded-md px-3 py-2.5 text-sm text-muted hover:text-ink">
                  {tr('Not measured')}
                </button>
                <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-md bg-accent px-4 py-2.5 font-semibold text-bg">
                  {tr('Next')} <ArrowRight size={16} className="rtl:rotate-180" aria-hidden />
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <h2 className="text-xl font-semibold">{tr('Any symptoms today?')}</h2>
          <p className="mt-1 text-sm text-muted">{tr('Tap everything that applies. Leave empty if you feel fine.')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = symptoms.includes(s.id)
              return (
                <button
                  key={s.id}
                  aria-pressed={on}
                  onClick={() => setSymptoms(on ? symptoms.filter((x) => x !== s.id) : [...symptoms, s.id])}
                  className={`rounded-full border px-3 py-2 text-sm ${on ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-panel2 text-muted'}`}
                >
                  {tr(s.label)}
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 rounded-md border border-line px-3 py-2.5 text-sm">
              <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden /> {tr('Back')}
            </button>
            <button onClick={finish} className="rounded-md bg-accent px-4 py-2.5 font-semibold text-bg">
              {tr('Save check')}
            </button>
          </div>
        </Card>
      )}
    </>
  )
}
