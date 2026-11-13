import { INDICATOR, INDICATORS, formatValue, type IndicatorId, type Status } from '../data/indicators'
import { SYMPTOMS } from '../data/bodyRegions'
import type { Environment } from '../data/environments'
import { tr } from '../i18n'
import { recentMean, type Alert } from './guidance'
import { assessEntry, latestEntry, type Entries } from './status'
import { delayText } from './physics'

const LABEL: Record<Status, string> = { green: 'Normal', amber: 'Watch', red: 'Act now' }
const WEEKLY: IndicatorId[] = ['hr', 'sys', 'dia', 'temp', 'sleep', 'exercise', 'water']

interface Input {
  name: string
  entries: Entries
  today: number
  env: Environment
  alerts: Alert[]
  /** ticked step keys for today, e.g. "fever:0" */
  done: string[]
}

/** Plain-text status report an astronaut can send to the flight surgeon. */
export function buildReport({ name, entries, today, env, alerts, done }: Input): string {
  const latest = latestEntry(entries, today)
  const out: string[] = [
    tr('HEALTH REPORT — {name}', { name }),
    tr('Mission day {day} · {place}', { day: today, place: tr(env.name) }),
    tr('Signal delay to Earth: {delay}', { delay: delayText(env) }),
    '',
  ]
  if (!latest) return [...out, tr('No readings yet')].join('\n')

  const overall: Status = alerts.some((a) => a.level === 'red') ? 'red' : alerts.length ? 'amber' : 'green'
  out.push(tr('Overall: {status}', { status: tr(LABEL[overall]) }), '')

  out.push(tr('Latest readings (mission day {day})', { day: latest.day }))
  const a = assessEntry(entries, latest.entry)
  for (const ind of INDICATORS) {
    const v = latest.entry.values[ind.id]
    const x = a[ind.id]
    if (v === undefined || !x) continue
    const unit = ind.id === 'mood' ? '' : ` ${tr(ind.unit)}`
    const note = x.unusual ? ` (${tr('Unusual for you')})` : ''
    out.push(`- ${tr(ind.name)}: ${formatValue(ind, v)}${unit} — ${tr(LABEL[x.status])}${note}`)
  }

  out.push('', tr('7-day averages'))
  for (const id of WEEKLY) {
    const m = recentMean(entries, latest.day, id, 7)
    if (m !== null) out.push(`- ${tr(INDICATOR[id].name)}: ${+m.toFixed(1)} ${tr(INDICATOR[id].unit)}`)
  }

  const symptoms = SYMPTOMS.filter((s) => latest.entry.symptoms.includes(s.id)).map((s) => tr(s.label))
  const separator = tr(', ')
  const list = symptoms.length ? symptoms.join(separator) : tr('none')
  out.push('', tr('Symptoms: {list}', { list }))

  out.push('', tr('Open findings: {n}', { n: alerts.length }))
  for (const al of alerts) {
    const stepsDone = al.doNow.filter((_, i) => done.includes(`${al.id}:${i}`)).length
    out.push(`- [${tr(LABEL[al.level])}] ${al.title}. ${al.seen}`)
    if (al.doNow.length) out.push(`  ${tr('Steps done: {a} of {b}', { a: stepsDone, b: al.doNow.length })}`)
  }

  out.push('', tr('Made by the BÖVD prototype. Not a medical record.'))
  return out.join('\n')
}
