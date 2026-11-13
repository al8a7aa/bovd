import type { Environment } from '../data/environments'
import { tr } from '../i18n'

const AU_KM = 149_597_870.7
const LIGHT_KM_S = 299_792.458
const MOON_KM = 384_400
export const CAREER_LIMIT_MSV = 600

/** Mean orbital elements at J2000 and their change per century (JPL approximate positions). */
const EARTH = { a: 1.00000261, e: 0.01671123, L: 100.46457166, dL: 35999.37244981, w: 102.93768193, dw: 0.32327364 }
const MARS = { a: 1.52371034, e: 0.0933941, L: -4.55343205, dL: 19140.30268499, w: -23.94362959, dw: 0.44441088 }

const rad = (deg: number) => (deg * Math.PI) / 180

/** Solve Kepler's equation E − e·sin E = M with Newton's method. */
export function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 12; i++) {
    const step = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= step
    if (Math.abs(step) < 1e-10) break
  }
  return E
}

/** Position in the plane of the solar system, in AU. Orbit tilt is ignored (under 2° for Mars). */
function position(p: typeof EARTH, centuries: number): [number, number] {
  const w = rad(p.w + p.dw * centuries)
  const M = rad(p.L + p.dL * centuries) - w
  const E = solveKepler(M, p.e)
  const x = p.a * (Math.cos(E) - p.e)
  const y = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E)
  return [x * Math.cos(w) - y * Math.sin(w), x * Math.sin(w) + y * Math.cos(w)]
}

export function earthMarsAU(date: Date): number {
  const julianDay = date.getTime() / 86_400_000 + 2440587.5
  const T = (julianDay - 2451545.0) / 36525
  const [ex, ey] = position(EARTH, T)
  const [mx, my] = position(MARS, T)
  return Math.hypot(mx - ex, my - ey)
}

/** One-way signal time to Earth in seconds. */
export function signalDelaySeconds(env: Environment, date = new Date()): number {
  if (env.link === 'moon') return MOON_KM / LIGHT_KM_S
  if (env.link === 'mars') return (earthMarsAU(date) * AU_KM) / LIGHT_KM_S
  return 0.01
}

export function delayText(env: Environment, date = new Date()): string {
  const s = signalDelaySeconds(env, date)
  if (s < 1) return tr('Under 1 second')
  if (s < 60) return tr('{s} seconds', { s: s.toFixed(1) })
  return tr('{m} minutes each way today', { m: (s / 60).toFixed(1) })
}

/** Mission dose so far = dose rate × days (the integral of a steady rate). */
export function missionDose(env: Environment, days: number) {
  const dose = env.doseRate * days
  return {
    dose,
    percent: (dose / CAREER_LIMIT_MSV) * 100,
    daysLeft: Math.max(0, Math.floor((CAREER_LIMIT_MSV - dose) / env.doseRate)),
  }
}
