import { describe, expect, it } from 'vitest'
import { INDICATOR } from '../data/indicators'
import { ENV } from '../data/environments'
import { assess, rangeStatus, type Entries } from './status'
import { buildAlerts } from './guidance'
import { badges, streak } from './gamify'
import { DEMO_DAYS, applyScenario, seedEntries } from './seed'
import { earthMarsAU, missionDose, signalDelaySeconds, solveKepler } from './physics'

describe('rangeStatus', () => {
  it('uses inclusive band edges', () => {
    expect(rangeStatus(INDICATOR.hr, 51)).toBe('green')
    expect(rangeStatus(INDICATOR.hr, 90)).toBe('green')
    expect(rangeStatus(INDICATOR.hr, 91)).toBe('amber')
    expect(rangeStatus(INDICATOR.hr, 110)).toBe('amber')
    expect(rangeStatus(INDICATOR.hr, 111)).toBe('red')
    expect(rangeStatus(INDICATOR.hr, 40)).toBe('red')
  })
  it('grades oxygen and glucose', () => {
    expect(rangeStatus(INDICATOR.spo2, 96)).toBe('green')
    expect(rangeStatus(INDICATOR.spo2, 93)).toBe('amber')
    expect(rangeStatus(INDICATOR.spo2, 91)).toBe('red')
    expect(rangeStatus(INDICATOR.glucose, 53)).toBe('red')
    expect(rangeStatus(INDICATOR.glucose, 110)).toBe('amber')
  })
})

describe('personal baseline', () => {
  const entries: Entries = {}
  for (let d = 1; d <= 7; d++) entries[d] = { values: { hr: 60 + (d % 2) }, symptoms: [] }

  it('flags an in-range value that is far from the baseline', () => {
    const a = assess(INDICATOR.hr, 78, entries)
    expect(a).toMatchObject({ status: 'amber', unusual: true, direction: 'high' })
  })
  it('ignores normal wobble', () => {
    expect(assess(INDICATOR.hr, 65, entries).status).toBe('green')
  })
  it('needs a baseline before it judges', () => {
    expect(assess(INDICATOR.hr, 78, {}).status).toBe('green')
  })
})

describe('guidance', () => {
  const base = seedEntries()
  const today = DEMO_DAYS + 1
  const ids = (e: Entries, env = ENV.transit) => buildAlerts(e, today, env).map((a) => a.id)

  it('raises one combined alert for fever with a fast pulse', () => {
    const got = ids(applyScenario(base, today, 'fever'))
    expect(got).toContain('fever')
    expect(got).not.toContain('temp')
    expect(got).not.toContain('hr')
  })
  it('detects sleep debt and low mood', () => {
    const got = ids(applyScenario(base, today, 'sleep'))
    expect(got).toContain('sleep-debt')
    expect(got).toContain('low-mood')
  })
  it('detects missed exercise and the baseline shift in pulse', () => {
    const got = ids(applyScenario(base, today, 'decon'))
    expect(got).toContain('deconditioning')
    expect(got).toContain('hr')
  })
  it('changes escalation advice with the mission setting', () => {
    const e = applyScenario(base, today, 'fever')
    const station = buildAlerts(e, today, ENV.station)[0].escalate
    const mars = buildAlerts(e, today, ENV.transit)[0].escalate
    expect(station).not.toBe(mars)
  })
  it('puts red alerts first', () => {
    const e = applyScenario(base, today, 'fever')
    e[today] = { ...e[today], symptoms: ['chest'] }
    expect(buildAlerts(e, today, ENV.station)[0].level).toBe('red')
  })
})

describe('gamification', () => {
  const base = seedEntries()
  it('counts the streak up to yesterday when today is not logged', () => {
    expect(streak(base, DEMO_DAYS + 1)).toBe(DEMO_DAYS)
    expect(streak(base, DEMO_DAYS + 2)).toBe(0)
  })
  it('awards streak badges', () => {
    const b = Object.fromEntries(badges(base, DEMO_DAYS + 1).map((x) => [x.id, x.earned]))
    expect(b.first && b.week && b.month).toBe(true)
  })
})

describe('physics', () => {
  it('solves Kepler’s equation', () => {
    const E = solveKepler(1, 0.3)
    expect(E - 0.3 * Math.sin(E)).toBeCloseTo(1, 9)
  })
  it('matches the known Earth–Mars distance at the January 2025 opposition', () => {
    expect(Math.abs(earthMarsAU(new Date('2025-01-16T00:00:00Z')) - 0.64)).toBeLessThan(0.03)
  })
  it('keeps the distance inside its physical limits all year', () => {
    for (let m = 0; m < 30; m++) {
      const d = earthMarsAU(new Date(Date.UTC(2026, m, 1)))
      expect(d).toBeGreaterThan(0.36)
      expect(d).toBeLessThan(2.7)
    }
  })
  it('gives sensible signal delays and dose', () => {
    expect(signalDelaySeconds(ENV.moon)).toBeCloseTo(1.28, 1)
    const mars = signalDelaySeconds(ENV.transit) / 60
    expect(mars).toBeGreaterThan(3)
    expect(mars).toBeLessThan(22.5)
    expect(missionDose(ENV.transit, 100).dose).toBeCloseTo(184)
  })
})
