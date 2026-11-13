export interface CrewMember {
  id: string
  name: string
  /** demo-data settings: each simulated person has their own normal */
  seed: number
  hr: number
  sleep: number
}

export const CREW: CrewMember[] = [
  { id: 'cdr', name: 'Commander', seed: 2026, hr: 62, sleep: 7.4 },
  { id: 'plt', name: 'Pilot', seed: 7, hr: 58, sleep: 7.2 },
  { id: 'ms', name: 'Mission specialist', seed: 42, hr: 68, sleep: 7.6 },
  { id: 'cmo', name: 'Medical officer', seed: 99, hr: 64, sleep: 7.0 },
]
