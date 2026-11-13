import { INDICATORS, type Indicator, type IndicatorId, type RegionId, type Status } from '../data/indicators'
import { SYMPTOMS } from '../data/bodyRegions'

export interface Entry {
  values: Partial<Record<IndicatorId, number>>
  symptoms: string[]
}
export type Entries = Record<number, Entry>

export interface Assessment {
  status: Status
  direction: 'low' | 'high' | null
  /** in range, but far from this astronaut's own first-week baseline */
  unusual: boolean
  baselineMean: number | null
}

const BASELINE_DAYS = 7
const BASELINE_MIN_READINGS = 5
const RANK: Record<Status, number> = { green: 0, amber: 1, red: 2 }

export function worst(a: Status, b: Status): Status {
  return RANK[a] >= RANK[b] ? a : b
}

export function rangeStatus(ind: Indicator, v: number): Status {
  if (v >= ind.green[0] && v <= ind.green[1]) return 'green'
  if (v >= ind.amber[0] && v <= ind.amber[1]) return 'amber'
  return 'red'
}

export function baselineStats(entries: Entries, id: IndicatorId): { mean: number; sd: number } | null {
  const xs: number[] = []
  for (let d = 1; d <= BASELINE_DAYS; d++) {
    const v = entries[d]?.values[id]
    if (v !== undefined) xs.push(v)
  }
  if (xs.length < BASELINE_MIN_READINGS) return null
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length)
  return { mean, sd }
}

export function assess(ind: Indicator, v: number, entries: Entries): Assessment {
  let status = rangeStatus(ind, v)
  let direction: Assessment['direction'] = v < ind.green[0] ? 'low' : v > ind.green[1] ? 'high' : null
  let unusual = false
  let baselineMean: number | null = null

  if (ind.baseline) {
    const b = baselineStats(entries, ind.id)
    if (b) {
      baselineMean = b.mean
      // never flag ordinary day-to-day wobble: need 2 SD and at least 5% of the scale
      const limit = Math.max(2 * b.sd, 0.05 * (ind.max - ind.min))
      if (Math.abs(v - b.mean) > limit) {
        unusual = true
        if (status === 'green') {
          status = 'amber'
          direction = v > b.mean ? 'high' : 'low'
        }
      }
    }
  }
  return { status, direction, unusual, baselineMean }
}

export function latestEntry(entries: Entries, maxDay: number): { day: number; entry: Entry } | null {
  for (let d = maxDay; d >= 1; d--) {
    if (entries[d]) return { day: d, entry: entries[d] }
  }
  return null
}

export function assessEntry(entries: Entries, entry: Entry): Partial<Record<IndicatorId, Assessment>> {
  const out: Partial<Record<IndicatorId, Assessment>> = {}
  for (const ind of INDICATORS) {
    const v = entry.values[ind.id]
    if (v !== undefined) out[ind.id] = assess(ind, v, entries)
  }
  return out
}

export function regionStatus(region: RegionId, entries: Entries, entry: Entry): Status | null {
  const a = assessEntry(entries, entry)
  let s: Status | null = null
  for (const ind of INDICATORS) {
    const x = a[ind.id]
    if (ind.region === region && x) s = s ? worst(s, x.status) : x.status
  }
  for (const sym of SYMPTOMS) {
    if (sym.region === region && entry.symptoms.includes(sym.id)) {
      s = worst(s ?? 'green', sym.urgent ?? 'amber')
    }
  }
  return s
}

/** 0–100 score for the at-a-glance ring */
export function readiness(entries: Entries, entry: Entry): number {
  const a = assessEntry(entries, entry)
  let score = 100
  for (const x of Object.values(a)) {
    if (x.status === 'amber') score -= 8
    if (x.status === 'red') score -= 20
  }
  score -= entry.symptoms.length * 4
  return Math.max(0, score)
}
