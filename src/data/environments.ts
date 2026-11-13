export type EnvId = 'station' | 'moon' | 'transit' | 'rover'

export interface Environment {
  id: EnvId
  name: string
  gravity: string
  delay: string
  returnTime: string
  /** which signal path to Earth applies */
  link: 'leo' | 'moon' | 'mars'
  /** typical radiation dose in mSv per day */
  doseRate: number
  doseSource: string
  note: string
  /** what to do about a red finding */
  red: string
  /** what to do about an amber finding */
  amber: string
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: 'station',
    link: 'leo',
    doseRate: 0.6,
    doseSource: 'ISS average, NASA space radiation analysis',
    name: 'Space station',
    gravity: '0 g',
    delay: 'Under 1 second',
    returnTime: 'Hours',
    note: 'Low Earth orbit. Flight surgeons can talk to you in real time and you can return within hours.',
    red: 'Tell the crew medical officer and call the flight surgeon now. The link is live.',
    amber: 'Re-measure later today. If it is still out of range, raise it at your next private medical conference.',
  },
  {
    id: 'moon',
    link: 'moon',
    doseRate: 1.37,
    doseSource: 'Chang’E-4 lander measurement, Zhang et al. (2020)',
    name: 'Lunar base',
    gravity: '0.16 g',
    delay: 'About 1.3 seconds',
    returnTime: 'Days',
    note: 'Partial gravity helps a little, but dust and radiation exposure are higher and return takes days.',
    red: 'Tell the crew medical officer and call the flight surgeon now. Start the onboard procedure while you wait — return takes days.',
    amber: 'Re-measure later today. If it is still out of range, include it in today’s report to the flight surgeon.',
  },
  {
    id: 'transit',
    link: 'mars',
    doseRate: 1.84,
    doseSource: 'MSL RAD cruise measurement, Zeitlin et al. (2013)',
    name: 'Mars transit ship',
    gravity: '0 g',
    delay: '4 to 24 minutes each way',
    returnTime: 'Not possible',
    note: 'Deep space. Radiation is highest here, there is no return, and a question to Earth can take 48 minutes to answer.',
    red: 'Tell the crew medical officer now and start the onboard procedure. Send a report to Earth, but do not wait for the reply — it can take 48 minutes.',
    amber: 'Re-measure later today and log it. If it is still out of range, add it to the next data package to Earth.',
  },
  {
    id: 'rover',
    link: 'mars',
    doseRate: 0.67,
    doseSource: 'MSL RAD surface measurement, Hassler et al. (2014)',
    name: 'Mars surface rover',
    gravity: '0.38 g',
    delay: '4 to 24 minutes each way',
    returnTime: 'Hours to base, months to Earth',
    note: 'Away from base in a small pressurised cabin. Your crewmate in the rover is your only immediate help.',
    red: 'Tell your rover crewmate now, start the onboard procedure and plan the drive back to base. Report to base; Earth’s reply can take 48 minutes.',
    amber: 'Re-measure later today and log it. Tell base at the next check-in.',
  },
]

export const ENV: Record<EnvId, Environment> = Object.fromEntries(
  ENVIRONMENTS.map((e) => [e.id, e]),
) as Record<EnvId, Environment>

export const HAZARDS = [
  {
    name: 'Space radiation',
    effect: 'Raises lifetime cancer risk and can harm the heart, nervous system and immune cells.',
    watch: 'Temperature, skin changes, tiredness.',
  },
  {
    name: 'Isolation and confinement',
    effect: 'Disturbs sleep, lowers mood and strains teamwork.',
    watch: 'Sleep hours, mood.',
  },
  {
    name: 'Distance from Earth',
    effect: 'Slow or no contact with doctors, no resupply and no quick return. You make the first call yourself.',
    watch: 'Every indicator — early action matters more the farther you are.',
  },
  {
    name: 'Gravity fields',
    effect: 'Bones and muscles weaken, fluid shifts to the head, the heart deconditions and vision can change.',
    watch: 'Exercise minutes, heart rate, blood pressure, vision.',
  },
  {
    name: 'Hostile closed environments',
    effect: 'Shared air, water and surfaces spread germs; cabin air faults affect breathing; food is limited.',
    watch: 'Blood oxygen, temperature, water intake, blood sugar.',
  },
]
