export interface Task {
  id: string
  /** local time, 24-hour "HH:MM" */
  time: string
  label: string
  detail: string
  /** done automatically when today's health check is saved */
  auto?: 'checkin'
}

/** One mission day. Times follow a station-style schedule: work, exercise, then a protected sleep period. */
export const SCHEDULE: Task[] = [
  { id: 'check', time: '07:00', label: 'Morning health check', detail: 'Before breakfast, so blood sugar is a fasting reading.', auto: 'checkin' },
  { id: 'water1', time: '09:30', label: 'Drink 500 ml of water', detail: 'Thirst is weak in space. Drink by the clock.' },
  { id: 'cardio', time: '10:30', label: 'Cardio session', detail: 'Treadmill or cycle, 45 minutes.' },
  { id: 'water2', time: '13:30', label: 'Drink 500 ml of water', detail: 'With your midday meal.' },
  { id: 'resist', time: '16:00', label: 'Resistance session', detail: 'Squats, deadlifts and heel raises, 60 minutes.' },
  { id: 'home', time: '19:30', label: 'Free time and message home', detail: 'Contact with family protects your mood.' },
  { id: 'wind', time: '21:30', label: 'Wind down', detail: 'Dim the lights. No screens or work.' },
  { id: 'sleep', time: '22:30', label: 'Sleep period starts', detail: 'Aim for 8 hours.' },
]

export function clockNow(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export type TaskState = 'done' | 'due' | 'later'

export function taskState(task: Task, done: boolean, now = clockNow()): TaskState {
  if (done) return 'done'
  return task.time <= now ? 'due' : 'later'
}
