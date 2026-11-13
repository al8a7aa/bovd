import { tr } from '../i18n'

export type Status = 'green' | 'amber' | 'red'
export type RegionId = 'brain' | 'eyes' | 'heart' | 'immune' | 'gut' | 'bones'
export type IndicatorId =
  | 'hr' | 'sys' | 'dia' | 'spo2' | 'temp' | 'glucose' | 'sleep' | 'mood' | 'water' | 'exercise'

export interface Advice {
  title: string
  doNow: string[]
}

export interface Indicator {
  id: IndicatorId
  name: string
  unit: string
  /** input limits */
  min: number
  max: number
  step: number
  /** inclusive reference bands: inside green = normal, inside amber = watch, outside = act */
  green: [number, number]
  amber: [number, number]
  region: RegionId
  /** also compare against the astronaut's own first-week baseline */
  baseline: boolean
  why: string
  how: string[]
  low: Advice
  high: Advice
  source: string
}

export const MOOD_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great']

export const INDICATORS: Indicator[] = [
  {
    id: 'hr',
    name: 'Resting heart rate',
    unit: 'bpm',
    min: 30, max: 200, step: 1,
    green: [51, 90], amber: [41, 110],
    region: 'heart',
    baseline: true,
    why: 'Without gravity your heart works less and your blood volume drops, so the heart slowly loses fitness. Resting heart rate is the simplest early sign of dehydration, infection, stress or deconditioning.',
    how: [
      'Stay still for 5 minutes. No exercise or caffeine in the last 30 minutes.',
      'Clip the pulse oximeter on a warm finger, or press two fingers on the side of your neck.',
      'Read the display, or count beats for 30 seconds and double the number.',
    ],
    low: {
      title: 'Heart rate is low',
      doNow: [
        'Re-measure after 5 minutes of rest.',
        'Check for dizziness, faintness or chest discomfort.',
        'If you feel unwell or it stays below 41 bpm, alert the crew medical officer.',
      ],
    },
    high: {
      title: 'Heart rate is high',
      doNow: [
        'Rest for 5 minutes and re-measure.',
        'Drink 250 ml of water.',
        'Note exercise, caffeine or stress in the last 30 minutes.',
        'Take your temperature — a fast pulse often comes with fever.',
      ],
    },
    source: 'NEWS2, Royal College of Physicians (2017)',
  },
  {
    id: 'sys',
    name: 'Blood pressure — upper (systolic)',
    unit: 'mmHg',
    min: 70, max: 220, step: 1,
    green: [101, 129], amber: [91, 159],
    region: 'heart',
    baseline: true,
    why: 'In microgravity body fluid shifts toward the head and arteries can stiffen on long missions. Blood pressure shows how your circulation is coping, and low values predict fainting when gravity returns.',
    how: [
      'Anchor yourself with a foot restraint and rest for 5 minutes.',
      'Wrap the cuff on your bare upper arm, level with your heart.',
      'Stay still and silent while it inflates.',
      'Take two readings one minute apart and enter the average. The upper number goes here.',
    ],
    low: {
      title: 'Blood pressure is low',
      doNow: [
        'Drink 500 ml of water or an electrolyte drink.',
        'Re-measure in 15 minutes.',
        'Move slowly; if you feel faint, hold a handrail and tell a crewmate.',
      ],
    },
    high: {
      title: 'Blood pressure is high',
      doNow: [
        'Rest quietly for 10 minutes and re-measure.',
        'Skip caffeine and salty food for the rest of the day.',
        'Report at once if you have a severe headache, chest pain or vision changes.',
      ],
    },
    source: 'ACC/AHA blood pressure guideline (2017); NEWS2',
  },
  {
    id: 'dia',
    name: 'Blood pressure — lower (diastolic)',
    unit: 'mmHg',
    min: 40, max: 130, step: 1,
    green: [60, 79], amber: [50, 99],
    region: 'heart',
    baseline: true,
    why: 'The lower number is the pressure in your arteries between heartbeats. Together with the upper number it tracks how your blood vessels adapt to weightlessness.',
    how: [
      'Use the same reading you just took.',
      'Enter the lower of the two numbers on the display.',
    ],
    low: {
      title: 'Lower blood pressure number is low',
      doNow: [
        'Drink 500 ml of water or an electrolyte drink.',
        'Re-measure in 15 minutes.',
      ],
    },
    high: {
      title: 'Lower blood pressure number is high',
      doNow: [
        'Rest quietly for 10 minutes and re-measure.',
        'Skip caffeine and salty food for the rest of the day.',
      ],
    },
    source: 'ACC/AHA blood pressure guideline (2017)',
  },
  {
    id: 'spo2',
    name: 'Blood oxygen',
    unit: '%',
    min: 80, max: 100, step: 1,
    green: [96, 100], amber: [92, 100],
    region: 'heart',
    baseline: false,
    why: 'You live in a sealed cabin. A drop in blood oxygen can be the first sign of a lung problem, a cabin air fault or carbon dioxide building up around you.',
    how: [
      'Warm your hand and remove anything on the fingertip.',
      'Clip the pulse oximeter on your index finger.',
      'Hold still for 30 seconds until the number settles.',
    ],
    low: {
      title: 'Blood oxygen is low',
      doNow: [
        'Re-seat the sensor on a warm finger and re-measure.',
        'Move to a spot with good airflow and check the cabin air readout.',
        'If it stays below 92% or you are short of breath, alert the crew medical officer now.',
      ],
    },
    high: { title: 'Blood oxygen', doNow: [] },
    source: 'NEWS2, Royal College of Physicians (2017)',
  },
  {
    id: 'temp',
    name: 'Body temperature',
    unit: '°C',
    min: 34, max: 41, step: 0.1,
    green: [36.1, 38.0], amber: [35.1, 39.0],
    region: 'immune',
    baseline: true,
    why: 'Spaceflight weakens parts of the immune system and can wake up dormant viruses. Fever is the earliest sign of infection. Resting temperature also runs higher in space, which is why your own baseline matters.',
    how: [
      'Wait 15 minutes after eating, drinking or exercise.',
      'Place the thermometer under your tongue and close your mouth.',
      'Keep it there until it beeps.',
    ],
    low: {
      title: 'Body temperature is low',
      doNow: [
        'Put on an extra layer and re-measure in 15 minutes.',
        'Check the cabin temperature.',
      ],
    },
    high: {
      title: 'Body temperature is high',
      doNow: [
        'Re-measure in 30 minutes.',
        'Drink extra water and rest.',
        'Keep distance from crewmates and wear a mask until you know the cause.',
      ],
    },
    source: 'NEWS2 (2017); Stahn et al., Scientific Reports (2017)',
  },
  {
    id: 'glucose',
    name: 'Fasting blood sugar',
    unit: 'mg/dL',
    min: 40, max: 300, step: 1,
    green: [70, 99], amber: [54, 125],
    region: 'gut',
    baseline: true,
    why: 'Less muscle work and a packaged diet can make your body respond less well to insulin during long missions. A fasting reading shows how well you are handling your food.',
    how: [
      'Measure before breakfast, after at least 8 hours without food.',
      'Clean a fingertip with an alcohol wipe and let it dry.',
      'Prick the side of the fingertip and touch the test strip to the drop.',
      'Put the lancet in the sharps container.',
    ],
    low: {
      title: 'Blood sugar is low',
      doNow: [
        'Eat or drink 15 g of fast sugar now, such as a fruit drink bag.',
        'Re-measure in 15 minutes.',
        'Do not start a spacewalk or exercise until it is back above 70.',
      ],
    },
    high: {
      title: 'Blood sugar is high',
      doNow: [
        'Confirm you were fasting, then re-measure tomorrow morning.',
        'Choose lower-sugar menu items today and drink water.',
        'Keep your exercise session — active muscle uses sugar.',
      ],
    },
    source: 'ADA Standards of Care in Diabetes',
  },
  {
    id: 'sleep',
    name: 'Sleep last night',
    unit: 'h',
    min: 0, max: 14, step: 0.25,
    green: [7, 9.5], amber: [5.5, 11],
    region: 'brain',
    baseline: false,
    why: 'There is no natural day and night in space, and noise, workload and excitement cut sleep short. Crews average about 6 hours. Lost sleep slows reactions and raises the chance of mistakes.',
    how: [
      'Count from when you fell asleep to when you woke.',
      'Subtract any long stretches you lay awake.',
      'If you wear a wrist tracker, use its total.',
    ],
    low: {
      title: 'You slept too little',
      doNow: [
        'Protect tonight’s sleep period: no screens or work for the last hour.',
        'Dim the lights and use earplugs and an eye mask.',
        'No caffeine in the 6 hours before sleep.',
        'Ask to move any safety-critical task if you feel drowsy.',
      ],
    },
    high: {
      title: 'You slept much longer than usual',
      doNow: [
        'Check how you feel: unusual tiredness can signal illness or low mood.',
        'Take your temperature.',
      ],
    },
    source: 'Barger et al., Lancet Neurology (2014); NASA crew sleep schedule',
  },
  {
    id: 'mood',
    name: 'Mood today',
    unit: '/ 5',
    min: 1, max: 5, step: 1,
    green: [4, 5], amber: [2, 5],
    region: 'brain',
    baseline: false,
    why: 'Months of isolation, confinement and distance from home wear on everyone. Tracking mood each day lets you see a slide early, while small changes can still fix it.',
    how: [
      'Take ten seconds. Think about the whole day, not just this minute.',
      'Pick the answer that fits best. There is no wrong one.',
    ],
    low: {
      title: 'Your mood is low',
      doNow: [
        'Tell one crewmate how you are doing.',
        'Schedule something you enjoy today: music, a window view, a message home.',
        'Keep your exercise session — it lifts mood.',
      ],
    },
    high: { title: 'Mood', doNow: [] },
    source: 'NASA Human Research Program — behavioral health risk',
  },
  {
    id: 'water',
    name: 'Water drunk today',
    unit: 'L',
    min: 0, max: 6, step: 0.1,
    green: [2, 4], amber: [1.5, 5],
    region: 'gut',
    baseline: false,
    why: 'Thirst is weaker in microgravity, so it is easy to drink too little. Bones also release calcium into your urine, and low fluid intake raises the risk of kidney stones.',
    how: [
      'Add up the drink bags you finished today.',
      'Include soups and rehydrated drinks.',
    ],
    low: {
      title: 'You drank too little',
      doNow: [
        'Drink 500 ml now and keep a drink bag at your workstation.',
        'Check your urine colour — aim for pale yellow.',
      ],
    },
    high: {
      title: 'You drank a lot',
      doNow: ['Spread fluids through the day and include an electrolyte drink.'],
    },
    source: 'NASA nutrition requirements for long-duration missions',
  },
  {
    id: 'exercise',
    name: 'Exercise today',
    unit: 'min',
    min: 0, max: 240, step: 5,
    green: [90, 240], amber: [45, 240],
    region: 'bones',
    baseline: false,
    why: 'Without loading, weight-bearing bones lose about 1–1.5% of their mineral density every month and muscles shrink. Daily resistance and cardio exercise is the main protection.',
    how: [
      'Add your treadmill, cycle and resistance sessions.',
      'Count active minutes, not setup time.',
    ],
    low: {
      title: 'Exercise is below target',
      doNow: [
        'Fit in a resistance session before your sleep period if you can.',
        'If you skipped because of pain or fatigue, log it as a symptom.',
      ],
    },
    high: { title: 'Exercise', doNow: [] },
    source: 'NASA Human Research Program — bone and muscle risks',
  },
]

export const INDICATOR: Record<IndicatorId, Indicator> = Object.fromEntries(
  INDICATORS.map((i) => [i.id, i]),
) as Record<IndicatorId, Indicator>

export function formatValue(ind: Indicator, v: number): string {
  if (ind.id === 'mood') return tr(MOOD_LABELS[Math.round(v)] ?? String(v))
  if (ind.id === 'temp') return v.toFixed(1)
  return String(+v.toFixed(2))
}
