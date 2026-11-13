import type { Entries, Entry } from './status'

/** small deterministic generator so the demo looks the same on every machine */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_DAYS = 60

/** Simulated astronaut: a healthy 60-day record with normal day-to-day variation. */
export function seedEntries(seed = 2026, hrBase = 62, sleepBase = 7.4): Entries {
  const rnd = mulberry32(seed)
  const noise = (spread: number) => (rnd() + rnd() + rnd() - 1.5) * spread
  const round = (v: number, step: number) => Math.round(v / step) * step
  const entries: Entries = {}
  for (let d = 1; d <= DEMO_DAYS; d++) {
    const restDay = d % 7 === 0
    const symptoms: string[] = []
    if (d <= 4) symptoms.push('congestion')
    if (d >= 2 && d <= 5) symptoms.push('back')
    entries[d] = {
      values: {
        hr: Math.round(hrBase + noise(5)),
        sys: Math.round(116 + noise(6)),
        dia: Math.round(73 + noise(4)),
        spo2: Math.round(98 + noise(1)),
        temp: +(36.9 + noise(0.25)).toFixed(1),
        glucose: Math.round(88 + noise(6)),
        sleep: Math.max(5.75, round(sleepBase + noise(0.9), 0.25)),
        mood: Math.min(5, Math.max(3, Math.round(4.2 + noise(0.9)))),
        water: +(2.6 + noise(0.5)).toFixed(1),
        exercise: restDay ? 95 : round(130 + noise(25), 5),
      },
      symptoms,
    }
  }
  return entries
}

export type ScenarioId = 'fever' | 'sleep' | 'decon'

export const SCENARIOS: { id: ScenarioId; name: string; what: string }[] = [
  { id: 'fever', name: 'Fever today', what: 'Temperature 38.6 °C with a fast pulse and sore throat.' },
  { id: 'sleep', name: 'A week of bad sleep', what: 'Five short nights and a falling mood.' },
  { id: 'decon', name: 'Skipped exercise', what: 'Ten days of missed sessions; resting pulse creeping up.' },
]

/** Overlay a demo scenario on the record, ending on `today` (which gets an entry). */
export function applyScenario(base: Entries, today: number, id: ScenarioId): Entries {
  const entries: Entries = { ...base }
  const copy = (d: number): Entry => {
    const src = entries[d] ?? entries[d - 1] ?? Object.values(entries).at(-1)!
    return { values: { ...src.values }, symptoms: [] }
  }
  if (id === 'fever') {
    const e = copy(today)
    e.values.temp = 38.6
    e.values.hr = 104
    e.values.sleep = 6.25
    e.values.mood = 3
    e.values.exercise = 60
    e.symptoms = ['throat', 'fatigue']
    entries[today] = e
  }
  if (id === 'sleep') {
    const hours = [5.5, 5.25, 5, 5.5, 4.75, 5]
    const moods = [3, 3, 3, 2, 2, 2]
    hours.forEach((h, i) => {
      const d = today - (hours.length - 1 - i)
      if (d < 1) return
      const e = copy(d)
      e.values.sleep = h
      e.values.mood = moods[i]
      if (i >= 3) e.symptoms = ['fatigue', 'headache']
      entries[d] = e
    })
  }
  if (id === 'decon') {
    for (let i = 0; i < 10; i++) {
      const d = today - (9 - i)
      if (d < 1) continue
      const e = copy(d)
      e.values.exercise = [40, 30, 35, 20, 30, 25, 40, 30, 20, 25][i]
      e.values.hr = 66 + i
      entries[d] = e
    }
  }
  return entries
}
