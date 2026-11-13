import { useMemo } from 'react'
import { ENV } from './data/environments'
import { CREW } from './data/crew'
import type { Status } from './data/indicators'
import { buildAlerts } from './engine/guidance'
import { assessEntry, latestEntry, type Entries } from './engine/status'
import { missionDay, useStore } from './store'
import { useLang } from './i18n'

const EMPTY: Entries = {}

/** Everything the screens need about "now" for the selected crew member. */
export function useHealth() {
  const records = useStore((s) => s.records)
  const activeId = useStore((s) => s.activeId)
  const startDate = useStore((s) => s.startDate)
  const envId = useStore((s) => s.envId)
  const demo = useStore((s) => s.demo)
  const lang = useLang()
  const today = missionDay(startDate)
  const env = ENV[envId]
  const entries = records[activeId] ?? EMPTY

  return useMemo(() => {
    const latest = latestEntry(entries, today)
    return {
      entries,
      today,
      env,
      demo,
      member: CREW.find((c) => c.id === activeId) ?? CREW[0],
      latest,
      todayEntry: entries[today],
      assessments: latest ? assessEntry(entries, latest.entry) : {},
      alerts: buildAlerts(entries, today, env),
    }
  }, [entries, today, env, demo, activeId, lang])
}

/** One overall status per crew member, for the crew bar. */
export function useCrewStatus(): { id: string; name: string; status: Status | null; checkedToday: boolean }[] {
  const records = useStore((s) => s.records)
  const startDate = useStore((s) => s.startDate)
  const envId = useStore((s) => s.envId)
  const today = missionDay(startDate)

  return useMemo(
    () =>
      CREW.map((c) => {
        const entries = records[c.id] ?? EMPTY
        const alerts = buildAlerts(entries, today, ENV[envId])
        const status: Status | null = !latestEntry(entries, today)
          ? null
          : alerts.some((a) => a.level === 'red')
            ? 'red'
            : alerts.length
              ? 'amber'
              : 'green'
        return { id: c.id, name: c.name, status, checkedToday: !!entries[today] }
      }),
    [records, today, envId],
  )
}
