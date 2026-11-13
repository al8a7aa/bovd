import { INDICATORS } from '../data/indicators'
import { assessEntry, type Entries, type Entry } from './status'

export interface Mission {
  id: string
  label: string
  done: boolean
}

export function dailyMissions(entry: Entry | undefined): Mission[] {
  const v = entry?.values ?? {}
  return [
    { id: 'checkin', label: 'Complete today’s health check', done: !!entry },
    { id: 'exercise', label: 'Exercise for 90 minutes or more', done: (v.exercise ?? 0) >= 90 },
    { id: 'sleep', label: 'Sleep 7 hours or more', done: (v.sleep ?? 0) >= 7 },
    { id: 'water', label: 'Drink 2 litres or more', done: (v.water ?? 0) >= 2 },
  ]
}

/** consecutive logged days ending today, or yesterday if today is not logged yet */
export function streak(entries: Entries, today: number): number {
  let d = entries[today] ? today : today - 1
  let n = 0
  while (d >= 1 && entries[d]) {
    n++
    d--
  }
  return n
}

function longestRun(entries: Entries, today: number, ok: (e: Entry) => boolean): number {
  let best = 0
  let run = 0
  for (let d = 1; d <= today; d++) {
    const e = entries[d]
    run = e && ok(e) ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

export const XP_PER_MISSION = 10
export const XP_PER_LEVEL = 200

export function totalXp(entries: Entries, today: number): number {
  let xp = 0
  for (let d = 1; d <= today; d++) {
    if (entries[d]) xp += dailyMissions(entries[d]).filter((m) => m.done).length * XP_PER_MISSION
  }
  return xp
}

export interface Badge {
  id: string
  name: string
  how: string
  earned: boolean
}

export function badges(entries: Entries, today: number): Badge[] {
  const logged = longestRun(entries, today, () => true)
  const allGreen = Object.values(entries).some((e) => {
    const a = Object.values(assessEntry(entries, e))
    return a.length === INDICATORS.length && a.every((x) => x.status === 'green')
  })
  return [
    { id: 'first', name: 'First check', how: 'Log your first health check', earned: logged >= 1 },
    { id: 'week', name: 'Steady week', how: 'Log 7 days in a row', earned: logged >= 7 },
    { id: 'month', name: 'Mission habit', how: 'Log 30 days in a row', earned: logged >= 30 },
    {
      id: 'bones',
      name: 'Iron bones',
      how: 'Hit the exercise target 7 days in a row',
      earned: longestRun(entries, today, (e) => (e.values.exercise ?? 0) >= 90) >= 7,
    },
    {
      id: 'rest',
      name: 'Well rested',
      how: 'Sleep 7 hours or more for 5 nights in a row',
      earned: longestRun(entries, today, (e) => (e.values.sleep ?? 0) >= 7) >= 5,
    },
    {
      id: 'hydrated',
      name: 'Hydrated',
      how: 'Drink 2 litres or more for 7 days in a row',
      earned: longestRun(entries, today, (e) => (e.values.water ?? 0) >= 2) >= 7,
    },
    { id: 'green', name: 'All systems go', how: 'Have every indicator in the normal range on one day', earned: allGreen },
  ]
}
