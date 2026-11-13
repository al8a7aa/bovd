import type { RegionId } from './indicators'

export interface Region {
  id: RegionId
  name: string
  /** one-word label on the body figure */
  short: string
  hazard: string
  does: string
  inSpace: string
  protect: string[]
}

export const REGIONS: Region[] = [
  {
    id: 'brain',
    short: 'Brain',
    name: 'Brain & behaviour',
    hazard: 'Isolation and confinement',
    does: 'Controls attention, memory, mood and sleep.',
    inSpace:
      'Months in a small space with the same few people, no natural daylight and a heavy workload disturb sleep and wear down mood and concentration.',
    protect: [
      'Keep a fixed sleep and wake time.',
      'Use bright light after waking and dim light before sleep.',
      'Stay in touch with family and take your scheduled time off.',
    ],
  },
  {
    id: 'eyes',
    short: 'Eyes',
    name: 'Eyes & vision',
    hazard: 'Altered gravity',
    does: 'Focus light so you can read displays and work with your hands.',
    inSpace:
      'Fluid shifts toward your head and raises pressure behind the eyes. On long missions this can swell the optic nerve and blur near vision (called SANS).',
    protect: [
      'Do the near-vision card test once a week, one eye at a time.',
      'Report any blur, blind spots or headaches early.',
      'Keep your adjustable glasses within reach.',
    ],
  },
  {
    id: 'heart',
    short: 'Heart',
    name: 'Heart & circulation',
    hazard: 'Altered gravity',
    does: 'Pumps oxygen-rich blood to every organ.',
    inSpace:
      'With no gravity to work against, the heart muscle weakens and blood volume falls. Arteries can stiffen, and radiation adds long-term risk.',
    protect: [
      'Do your cardio session every day.',
      'Drink enough fluid.',
      'Measure pulse and blood pressure at the same time each day.',
    ],
  },
  {
    id: 'immune',
    short: 'Immune',
    name: 'Immune system',
    hazard: 'Space radiation and a closed environment',
    does: 'Finds and fights infections.',
    inSpace:
      'Stress, radiation and poor sleep weaken immune cells, and dormant viruses can wake up. In a sealed cabin, germs pass easily between crew.',
    protect: [
      'Sleep 7 hours or more.',
      'Clean hands and shared surfaces.',
      'Report rashes, sore throat or fever on the day they start.',
    ],
  },
  {
    id: 'gut',
    short: 'Nutrition',
    name: 'Nutrition & metabolism',
    hazard: 'Hostile closed environment and distance from Earth',
    does: 'Turns food and water into energy and building material.',
    inSpace:
      'All food is packaged and resupply is far away. Appetite and thirst drop, and less active muscle handles sugar less well. Too little fluid raises kidney stone risk.',
    protect: [
      'Eat your full planned menu, even when you are not hungry.',
      'Drink at least 2 litres a day.',
      'Take your vitamin D supplement.',
    ],
  },
  {
    id: 'bones',
    short: 'Bones',
    name: 'Bones & muscles',
    hazard: 'Altered gravity',
    does: 'Carry your weight and let you move and lift.',
    inSpace:
      'Unloaded bones lose about 1–1.5% of their density each month, mostly in the hips, spine and legs. Muscles shrink within weeks.',
    protect: [
      'Do resistance exercise every day.',
      'Do not skip sessions two days in a row.',
      'Log back or joint pain so the plan can be adjusted.',
    ],
  },
]

export interface Symptom {
  id: string
  label: string
  region: RegionId
  /** symptoms that always raise an alert */
  urgent?: 'amber' | 'red'
}

export const SYMPTOMS: Symptom[] = [
  { id: 'headache', label: 'Headache', region: 'brain' },
  { id: 'fatigue', label: 'Unusual tiredness', region: 'brain' },
  { id: 'vision', label: 'Blurred vision', region: 'eyes', urgent: 'amber' },
  { id: 'congestion', label: 'Stuffy head or puffy face', region: 'eyes' },
  { id: 'dizzy', label: 'Dizziness', region: 'heart' },
  { id: 'chest', label: 'Chest pain or tightness', region: 'heart', urgent: 'red' },
  { id: 'breath', label: 'Short of breath', region: 'heart', urgent: 'red' },
  { id: 'throat', label: 'Sore throat or cough', region: 'immune' },
  { id: 'rash', label: 'Skin rash', region: 'immune' },
  { id: 'nausea', label: 'Nausea', region: 'gut' },
  { id: 'back', label: 'Back or joint pain', region: 'bones' },
]
