import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { Page } from '../App'
import { tr } from '../i18n'
import { PageTitle } from '../components/ui'

const ABOUT: Partial<Record<Page, string>> = {
  trends: 'Charts of each reading over time.',
  report: 'A summary to send to the flight surgeon.',
  ask: 'An AI model on this device that explains your report.',
  mission: 'Where you are, the five hazards, and demo controls.',
}

/** Phone only: the destinations that do not fit in the bottom bar. */
export default function More({ go, items }: { go: (p: Page) => void; items: { id: Page; label: string; icon: LucideIcon }[] }) {
  return (
    <>
      <PageTitle title={tr('More')} />
      <ul className="rounded-lg border border-line bg-panel">
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id} className="border-b border-line last:border-b-0">
            <button onClick={() => go(id)} className="flex min-h-16 w-full items-center gap-3 px-4 text-start">
              <Icon size={20} className="shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{tr(label)}</span>
                <span className="block text-sm text-muted">{tr(ABOUT[id] ?? '')}</span>
              </span>
              <ChevronRight size={18} className="text-muted rtl:rotate-180" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
