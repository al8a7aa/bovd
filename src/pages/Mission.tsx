import { ENVIRONMENTS, HAZARDS } from '../data/environments'
import { INDICATORS } from '../data/indicators'
import { SCENARIOS } from '../engine/seed'
import { delayText } from '../engine/physics'
import { useStore } from '../store'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { Card, PageTitle, SectionTitle } from '../components/ui'

const EXTRA_SOURCES = [
  'NASA Human Research Program — 5 Hazards of Human Spaceflight (nasa.gov/hrp/hazards)',
  'NASA Human Research Program — Risks of Human Spaceflight (nasa.gov/hrp/risks)',
  'Canadian Space Agency — Monitoring Radiation for Astronaut Health (2026)',
  'NASA-STD-3001 — 600 mSv career radiation limit',
  'NASA DONKI / NOAA SWPC GOES — live solar flare reports',
]

export default function Mission() {
  const { env, demo } = useHealth()
  const { setEnv, runScenario, resetDemo, startOwnMission } = useStore()
  const sources = [...new Set(INDICATORS.map((i) => i.source)), ...EXTRA_SOURCES]

  return (
    <>
      <PageTitle title={tr('Mission')} sub={tr('Where you are changes how much help you can get, and how fast.')} />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">{tr('Where are you?')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ENVIRONMENTS.map((e) => {
          const active = e.id === env.id
          return (
            <button
              key={e.id}
              onClick={() => setEnv(e.id)}
              aria-pressed={active}
              className={`rounded-lg border p-4 text-start ${active ? 'border-accent bg-accent/10' : 'border-line bg-panel hover:border-accent/50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{tr(e.name)}</span>
                {active && <span className="text-xs font-semibold text-accent">{tr('Selected')}</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{tr(e.note)}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-muted">{tr('Gravity')}</dt><dd className="mt-0.5" dir="ltr">{e.gravity}</dd></div>
                <div><dt className="text-muted">{tr('Signal delay')}</dt><dd className="mt-0.5">{delayText(e)}</dd></div>
                <div><dt className="text-muted">{tr('Return to Earth')}</dt><dd className="mt-0.5">{tr(e.returnTime)}</dd></div>
              </dl>
            </button>
          )
        })}
      </div>

      <SectionTitle>{tr('The five hazards of spaceflight')}</SectionTitle>
      <Card>
        <ul className="divide-y divide-line">
          {HAZARDS.map((h) => (
            <li key={h.name} className="py-3 first:pt-0 last:pb-0">
              <div className="font-semibold">{tr(h.name)}</div>
              <p className="mt-0.5 text-sm text-muted">{tr(h.effect)}</p>
              <p className="mt-1 text-sm"><span className="text-muted">{tr('Watch:')} </span>{tr(h.watch)}</p>
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>{tr('Demo controls')}</SectionTitle>
      <Card>
        <p className="text-sm text-muted">
          {tr('Load a simulated situation to see how the app responds. Each one reloads the demo crew and applies the situation to the selected crew member.')}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => runScenario(s.id)} className="rounded-md border border-line bg-panel2 p-3 text-start hover:border-accent/50">
              <div className="font-semibold">{tr(s.name)}</div>
              <div className="mt-0.5 text-xs text-muted">{tr(s.what)}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={resetDemo} className="rounded-md border border-line px-3 py-2 text-sm">
            {tr('Load healthy demo crew')}
          </button>
          <button
            onClick={() => (demo || window.confirm(tr('This deletes your saved health checks and starts a new record at day 1. Continue?'))) && startOwnMission()}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            {tr('Start an empty record')}
          </button>
        </div>
      </Card>

      <SectionTitle>{tr('About')}</SectionTitle>
      <Card className="text-sm">
        <p>
          {tr('BÖVD is a hackathon prototype by team BÖVD (Ibn Al Atheer School, Shinas, Oman) for the NASA Space Apps Challenge 2026. It is not a medical device and does not diagnose. All data stays on this device.')}
        </p>
        <p className="mt-2 text-muted">
          {tr('Signal delay uses the Earth–Mars distance from Kepler’s equation, solved with Newton’s method.')}
        </p>
        <p className="mt-3 text-muted">{tr('Reference ranges and guidance are based on:')}</p>
        <ul className="mt-1 list-disc space-y-0.5 ps-5 text-muted" dir="ltr">
          {sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Card>
    </>
  )
}
