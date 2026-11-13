import { useState } from 'react'
import { Activity, CalendarClock, ClipboardCheck, FileText, Languages, MessageCircle, LayoutDashboard, Menu, PersonStanding, Rocket } from 'lucide-react'
import type { IndicatorId } from './data/indicators'
import { useStore } from './store'
import { useCrewStatus, useHealth } from './hooks'
import { setLang, tr, useLang } from './i18n'
import { delayText } from './engine/physics'
import { Logo } from './components/space'
import { TimerBar, useReminders } from './components/Timers'
import { NextUp } from './pages/Plan'
import { STATUS_HEX, STATUS_LABEL, StatusChip } from './components/ui'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Body from './pages/Body'
import Trends from './pages/Trends'
import Plan from './pages/Plan'
import Report from './pages/Report'
import Mission from './pages/Mission'
import More from './pages/More'
import Helper from './pages/Helper'

export type Page = 'home' | 'checkin' | 'plan' | 'body' | 'trends' | 'report' | 'ask' | 'mission' | 'more'

type NavItem = { id: Page; label: string; icon: typeof Activity }
/** Computer: every destination in the side rail. */
const RAIL: NavItem[] = [
  { id: 'home', label: 'Today', icon: LayoutDashboard },
  { id: 'checkin', label: 'Check-in', icon: ClipboardCheck },
  { id: 'plan', label: 'Plan', icon: CalendarClock },
  { id: 'body', label: 'Body', icon: PersonStanding },
  { id: 'trends', label: 'Trends', icon: Activity },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'ask', label: 'Helper', icon: MessageCircle },
  { id: 'mission', label: 'Mission', icon: Rocket },
]
/** Phone: the four daily jobs under the thumb, the rest behind "More". */
const TABS: NavItem[] = [...RAIL.slice(0, 4), { id: 'more', label: 'More', icon: Menu }]
const IN_MORE: Page[] = ['more', 'trends', 'report', 'ask', 'mission']

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [trendId, setTrendId] = useState<IndicatorId>('hr')
  const lang = useLang()
  const { today, env, demo } = useHealth()
  const crew = useCrewStatus()
  const activeId = useStore((s) => s.activeId)
  const setActive = useStore((s) => s.setActive)
  const startOwnMission = useStore((s) => s.startOwnMission)
  useReminders()

  const openTrend = (id: IndicatorId) => {
    setTrendId(id)
    setPage('trends')
  }

  // each language is named in its own script so its speakers can find it
  const langButton = (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      lang={lang === 'ar' ? 'en' : 'ar'}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-ink"
    >
      <Languages size={16} aria-hidden />
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  )

  return (
    <div className="flex min-h-full overflow-x-clip">
      {/* computer and tablet: side rail */}
      <nav aria-label={tr('Main')} className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-e border-line bg-panel p-3 md:flex print:hidden">
        <div className="px-2 pt-2 pb-6">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-widest">
            <Logo /> <span dir="ltr">BÖVD</span>
          </div>
          <div className="mt-1 font-mono text-xs text-muted">{tr('Mission day {day}', { day: today })}</div>
        </div>
        {RAIL.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${active ? 'bg-panel2 text-accent' : 'text-muted hover:text-ink'}`}
            >
              <Icon size={18} aria-hidden />
              {tr(label)}
            </button>
          )
        })}
        <div className="mt-auto hidden xl:block">{langButton}</div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* phone and tablet: top bar with the crew switch. On a wide screen the side panel does this job. */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-line bg-bg px-4 xl:hidden print:hidden">
          <span className="flex items-center md:hidden"><Logo size={28} /></span>
          <label className="sr-only" htmlFor="crew">{tr('Crew member')}</label>
          <select
            id="crew"
            value={activeId}
            onChange={(e) => setActive(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-md border border-line bg-panel px-3 text-sm md:max-w-72 md:flex-none"
          >
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {tr(c.name)} — {tr(c.status ? STATUS_LABEL[c.status] : 'No readings yet')}
              </option>
            ))}
          </select>
          <span className="md:flex-1" />
          {langButton}
        </header>

        <main className="mx-auto w-full max-w-4xl min-w-0 flex-1 px-4 pt-5 pb-24 md:px-8 md:pb-10">
          {demo && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-s-2 border-accent bg-panel px-3 py-2 text-sm print:hidden">
              <span>
                <strong>{tr('Simulated data.')}</strong> {tr('This is a demo crew, not real people.')}
              </span>
              <button onClick={startOwnMission} className="min-h-11 font-medium text-accent underline underline-offset-4">
                {tr('Start my own record')}
              </button>
            </div>
          )}
          <TimerBar />
          {page === 'home' && <Dashboard go={setPage} openTrend={openTrend} />}
          {page === 'checkin' && <CheckIn key={activeId} go={setPage} />}
          {page === 'plan' && <Plan go={setPage} />}
          {page === 'body' && <Body openTrend={openTrend} />}
          {page === 'trends' && <Trends id={trendId} setId={setTrendId} />}
          {page === 'report' && <Report />}
          {page === 'ask' && <Helper key={activeId} />}
          {page === 'mission' && <Mission />}
          {page === 'more' && <More go={setPage} items={RAIL.slice(4)} />}
        </main>
      </div>

      {/* wide screens only: the crew and the next task stay in view on every page */}
      <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto border-s border-line bg-panel p-4 xl:block print:hidden">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{tr('Crew')}</h2>
        <ul className="mt-2">
          {crew.map((c) => {
            const active = c.id === activeId
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c.id)}
                  aria-pressed={active}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 border-s-2 px-3 text-start text-sm ${active ? 'border-accent bg-panel2 text-ink' : 'border-transparent text-muted hover:text-ink'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: c.status ? STATUS_HEX[c.status] : '#8f9bb0' }} aria-hidden />
                    {tr(c.name)}
                  </span>
                  {c.status ? <StatusChip status={c.status} /> : <span className="text-xs">{tr('No readings yet')}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        <h2 className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">{tr('Next up')}</h2>
        <div className="mt-2">
          <NextUp go={setPage} compact />
        </div>

        <h2 className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">{tr('Link to Earth')}</h2>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">{tr('Where')}</dt><dd className="text-end">{tr(env.name)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">{tr('Signal delay')}</dt><dd className="text-end">{delayText(env)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">{tr('Return to Earth')}</dt><dd className="text-end">{tr(env.returnTime)}</dd></div>
        </dl>
      </aside>

      {/* phone: bottom tab bar */}
      <nav aria-label={tr('Main')} className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-panel md:hidden print:hidden">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === 'more' ? IN_MORE.includes(page) : page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 border-t-2 text-xs ${active ? 'border-accent text-accent' : 'border-transparent text-muted'}`}
            >
              <Icon size={20} aria-hidden />
              {tr(label)}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
