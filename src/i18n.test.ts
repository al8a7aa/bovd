import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AR } from './ar'
import { INDICATORS, MOOD_LABELS } from './data/indicators'
import { REGIONS, SYMPTOMS } from './data/bodyRegions'
import { ENVIRONMENTS, HAZARDS } from './data/environments'
import { CREW } from './data/crew'
import { SCHEDULE } from './data/schedule'
import { MODELS } from './engine/helper'
import { PROMPTS } from './pages/Journal'
import { SCENARIOS } from './engine/seed'
import { badges, dailyMissions } from './engine/gamify'

/** Every English text the app can show: data texts plus every tr('…') literal in the source. */
export function allTexts(): string[] {
  const out = new Set<string>()
  const add = (...xs: string[]) => xs.forEach((x) => x && out.add(x))

  for (const i of INDICATORS) {
    add(i.name, i.unit, i.why, ...i.how, i.low.title, ...i.low.doNow, i.high.title, ...i.high.doNow)
  }
  add(...MOOD_LABELS)
  for (const r of REGIONS) add(r.name, r.short, r.hazard, r.does, r.inSpace, ...r.protect)
  for (const s of SYMPTOMS) add(s.label)
  for (const e of ENVIRONMENTS) add(e.name, e.returnTime, e.note, e.red, e.amber)
  for (const h of HAZARDS) add(h.name, h.effect, h.watch)
  for (const c of CREW) add(c.name)
  for (const t of SCHEDULE) add(t.label, t.detail)
  for (const m of MODELS) add(m.name, m.note)
  add('Journal', 'Private notes that stay on this device.', ...PROMPTS)
  add('The key was not accepted. Check it and paste it again.', 'Too many requests for this key right now. Wait a minute and try again.', 'No link to the online helper. Use the on-device helper instead.', 'The online helper declined to answer this question.', 'The online helper had a problem. Try again.')
  add('Plan', 'Report', 'More', 'Helper', 'An AI model on this device that explains your report.', 'Explain my health status in simple words.', 'What should I do first?', 'Why do these readings matter in space?', 'Charts of each reading over time.', 'A summary to send to the flight surgeon.', 'Where you are, the five hazards, and demo controls.')
  for (const s of SCENARIOS) add(s.name, s.what)
  for (const m of dailyMissions(undefined)) add(m.label)
  for (const b of badges({}, 1)) add(b.name, b.how)
  // texts passed to tr() through a variable
  add('Normal', 'Watch', 'Act now', 'Today', 'Check-in', 'Body', 'Trends', 'Goals', 'Mission')
  add('Cadet', 'Crew member', 'Specialist', 'Flight engineer', 'Pilot', 'Commander', ', ')
  add('Breathe in', 'Hold', 'Breathe out')

  // alert texts in the rules engine are plain sentences translated on the way out
  for (const line of readFileSync('src/engine/guidance.ts', 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('import')) continue
    for (const m of line.matchAll(/'([^']+)'/g)) {
      if (m[1].includes(' ') && m[1].length > 12 && m[1] !== 'NASA Human Research Program') out.add(m[1])
    }
  }

  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name)
      if (f.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(f.name) && !f.name.includes('.test.') && f.name !== 'ar.ts') {
        const src = readFileSync(p, 'utf8')
        for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)+)'/g)) {
          // only literals that are passed to tr(), directly or through a ?: choice inside tr(
          const before = src.slice(Math.max(0, m.index - 400), m.index)
          if (/tr\((?:[^()]|\([^()]*\))*$/.test(before)) out.add(m[1])
        }
      }
    }
  }
  walk('src')
  return [...out]
}

describe('Arabic translation', () => {
  const texts = allTexts()
  it('covers every text the app can show', () => {
    // code words the source scan picks up that are never shown
    const notText = ['local', 'online', 'setup', 'done', 'red', 'amber', 'mood', 'bpm', 'mmHg', 'mg/dL']
    const missing = texts.filter((t) => /[A-Za-z]/.test(t) && !notText.includes(t) && AR[t] === undefined)
    expect(missing).toEqual([])
  })
  it('keeps the same {slots} as the English text', () => {
    const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join()
    const broken = Object.entries(AR).filter(([en, ar]) => slots(en) !== slots(ar)).map(([en]) => en)
    expect(broken).toEqual([])
  })
})
