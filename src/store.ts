import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnvId } from './data/environments'
import { CREW } from './data/crew'
import type { Entries, Entry } from './engine/status'
import { DEMO_DAYS, applyScenario, seedEntries, type ScenarioId } from './engine/seed'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Mission day number for today; day 1 is the start date. */
export function missionDay(startDate: string): number {
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d).getTime()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((now.getTime() - start) / 86_400_000) + 1)
}

export interface Timer {
  id: string
  label: string
  /** epoch milliseconds */
  endsAt: number
}

interface State {
  envId: EnvId
  startDate: string
  /** one health record per crew member, keyed by crew id */
  records: Record<string, Entries>
  activeId: string
  /** true while the records are the simulated demo crew */
  demo: boolean
  /** ticked plan tasks and alert steps: crew id → mission day → keys */
  done: Record<string, Record<number, string[]>>
  timers: Timer[]
  /** private journal text: crew id → mission day → entry. Never leaves the device. */
  journal: Record<string, Record<number, string>>
  setJournal: (day: number, text: string) => void
  setEnv: (id: EnvId) => void
  setActive: (id: string) => void
  saveEntry: (day: number, entry: Entry) => void
  toggleDone: (day: number, key: string) => void
  startTimer: (label: string, minutes: number) => void
  clearTimer: (id: string) => void
  resetDemo: () => void
  runScenario: (id: ScenarioId) => void
  startOwnMission: () => void
}

const demoState = () => ({
  startDate: isoDaysAgo(DEMO_DAYS),
  records: Object.fromEntries(CREW.map((c) => [c.id, seedEntries(c.seed, c.hr, c.sleep)])),
  demo: true,
  done: {},
  timers: [],
  journal: {},
})

const NONE: string[] = []
/** Keys ticked today by the selected crew member. */
export const useDoneToday = () =>
  useStore((s) => s.done[s.activeId]?.[missionDay(s.startDate)] ?? NONE)

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      envId: 'transit',
      activeId: CREW[0].id,
      ...demoState(),
      setEnv: (envId) => set({ envId }),
      setActive: (activeId) => set({ activeId }),
      saveEntry: (day, entry) => {
        const { records, activeId } = get()
        set({ records: { ...records, [activeId]: { ...records[activeId], [day]: entry } } })
      },
      toggleDone: (day, key) => {
        const { done, activeId } = get()
        const mine = done[activeId] ?? {}
        const list = mine[day] ?? []
        const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
        set({ done: { ...done, [activeId]: { ...mine, [day]: next } } })
      },
      setJournal: (day, text) => {
        const { journal, activeId } = get()
        const mine = { ...(journal[activeId] ?? {}) }
        // an empty entry is removed rather than kept as a blank day
        if (text.trim()) mine[day] = text.trim()
        else delete mine[day]
        set({ journal: { ...journal, [activeId]: mine } })
      },
      startTimer: (label, minutes) =>
        set({ timers: [...get().timers, { id: `${Date.now()}`, label, endsAt: Date.now() + minutes * 60_000 }] }),
      clearTimer: (id) => set({ timers: get().timers.filter((t) => t.id !== id) }),
      resetDemo: () => set(demoState()),
      runScenario: (id) => {
        const fresh = demoState()
        const { activeId } = get()
        fresh.records[activeId] = applyScenario(fresh.records[activeId], missionDay(fresh.startDate), id)
        set(fresh)
      },
      startOwnMission: () => set({ startDate: isoDaysAgo(0), records: {}, demo: false, done: {}, timers: [], journal: {} }),
    }),
    { name: 'bovd-v2' },
  ),
)
