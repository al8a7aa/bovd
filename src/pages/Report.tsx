import { useState } from 'react'
import { Copy, Printer } from 'lucide-react'
import { buildReport } from '../engine/report'
import { delayText } from '../engine/physics'
import { useDoneToday } from '../store'
import { useHealth } from '../hooks'
import { tr } from '../i18n'
import { BTN_PRIMARY, BTN_QUIET, PageTitle } from '../components/ui'

export default function Report() {
  const { entries, today, env, member, alerts } = useHealth()
  const done = useDoneToday()
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no')
  const text = buildReport({ name: tr(member.name), entries, today, env, alerts, done })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('yes')
    } catch {
      setCopied('failed')
    }
  }

  return (
    <>
      <div className="print:hidden">
        <PageTitle
          title={tr('Report for the flight surgeon')}
          sub={tr('A summary you can send to the ground. One-way signal time right now: {delay}.', { delay: delayText(env) })}
        />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button onClick={copy} className={BTN_PRIMARY}><Copy size={16} aria-hidden />{tr('Copy report')}</button>
          <button onClick={() => window.print()} className={BTN_QUIET}><Printer size={16} aria-hidden />{tr('Print')}</button>
          <span className="text-sm text-muted" role="status">
            {copied === 'yes' && tr('Copied. Paste it into your message to the ground.')}
            {copied === 'failed' && tr('Could not copy. Select the text below and copy it by hand.')}
          </span>
        </div>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap print:border-0 print:bg-white print:p-0 print:text-black">
        {text}
      </pre>
    </>
  )
}
