import { useEffect, useRef, useState } from 'react'
import { Download, SendHorizontal } from 'lucide-react'
import {
  HelperError, MODELS, ONLINE_MODEL, ask, askOnline, chooseModel, chosenModel, gpuAvailable, isDownloaded,
  loadHelper, loadedModel, onlineKey, setOnlineKey, systemPrompt, type OnlineProblem, type Turn,
} from '../engine/helper'
import { buildReport } from '../engine/report'
import { useDoneToday } from '../store'
import { useHealth } from '../hooks'
import { getLang, tr } from '../i18n'
import { BTN_PRIMARY, BTN_QUIET, Card, PageTitle } from '../components/ui'

const STARTERS = ['Explain my health status in simple words.', 'What should I do first?', 'Why do these readings matter in space?']

const PROBLEM: Record<OnlineProblem, string> = {
  key: 'The key was not accepted. Check it and paste it again.',
  limit: 'Too many requests for this key right now. Wait a minute and try again.',
  link: 'No link to the online helper. Use the on-device helper instead.',
  refused: 'The online helper declined to answer this question.',
  other: 'The online helper had a problem. Try again.',
}

type Mode = 'local' | 'online'
type Phase = 'setup' | 'loading' | 'ready' | 'failed'
const MODE_SLOT = 'bovd-helper-mode'

function savedMode(): Mode {
  try {
    const m = localStorage.getItem(MODE_SLOT)
    if (m === 'local' || m === 'online') return m
  } catch { /* fall through */ }
  // without a graphics chip the on-device helper cannot run, so start on the other one
  return gpuAvailable() ? 'local' : 'online'
}

export default function Helper() {
  const { entries, today, env, member, alerts } = useHealth()
  const done = useDoneToday()
  const [mode, setModeState] = useState<Mode>(savedMode)
  const [modelId, setModelId] = useState(loadedModel() ?? chosenModel().id)
  const [key, setKey] = useState(onlineKey)
  const [keyDraft, setKeyDraft] = useState('')
  const [phase, setPhase] = useState<Phase>(() => ((savedMode() === 'local' ? loadedModel() : onlineKey()) ? 'ready' : 'setup'))
  const [progress, setProgress] = useState(0)
  /** which models are already saved on this device */
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0]
  const onDevice = !!saved[modelId]

  useEffect(() => {
    if (!gpuAvailable()) return
    Promise.all(MODELS.map(async (m) => [m.id, await isDownloaded(m.id)] as const)).then((rows) => setSaved(Object.fromEntries(rows)))
  }, [phase])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [turns])

  const setMode = (m: Mode) => {
    setModeState(m)
    try { localStorage.setItem(MODE_SLOT, m) } catch { /* choice lasts for this visit */ }
  }

  const startLocal = async () => {
    chooseModel(modelId)
    setProgress(0)
    setPhase('loading')
    try {
      await loadHelper(modelId, setProgress)
      setPhase('ready')
    } catch {
      setPhase('failed')
    }
  }

  const startOnline = () => {
    const k = keyDraft.trim()
    if (!k) return
    setOnlineKey(k)
    setKey(k)
    setKeyDraft('')
    setPhase('ready')
  }

  const removeKey = () => {
    setOnlineKey('')
    setKey('')
    setTurns([])
    setPhase('setup')
  }

  const send = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    setDraft('')
    setBusy(true)
    const history = turns
    const show = (answer: string) => setTurns([...history, { role: 'user', text: q }, { role: 'assistant', text: answer }])
    show('')
    const report = buildReport({ name: tr(member.name), entries, today, env, alerts, done })
    const system = systemPrompt(report, alerts, getLang())
    let answer = ''
    try {
      const pieces = mode === 'online' ? askOnline(key, system, history, q) : ask(system, history, q)
      for await (const piece of pieces) {
        answer += piece
        show(answer)
      }
    } catch (e) {
      const why = e instanceof HelperError ? tr(PROBLEM[e.problem]) : tr('The helper stopped. Try asking again.')
      // keep whatever was already written, and say plainly that it was cut short
      show(answer ? `${answer}\n\n${why}` : why)
    }
    setBusy(false)
  }

  const header = (
    <PageTitle title={tr('Helper')} sub={tr('An AI model that explains your health report in simple words.')} />
  )

  if (phase === 'loading') {
    return (
      <>
        {header}
        <Card>
          <p className="font-semibold">{onDevice ? tr('Starting the helper…') : tr('Downloading the helper…')}</p>
          <div className="mt-3 h-1.5 bg-panel2" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={tr('Helper loading progress')}>
            <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2 font-mono text-sm text-muted" dir="ltr">{Math.round(progress * 100)}%</p>
          <p className="mt-1 text-sm text-muted">{tr('Keep this screen open. The first start takes the longest.')}</p>
        </Card>
      </>
    )
  }

  if (phase !== 'ready') {
    return (
      <>
        {header}
        <fieldset className="mb-3 rounded-lg border border-line bg-panel">
          <legend className="sr-only">{tr('Where the helper runs')}</legend>
          {(['local', 'online'] as const).map((m) => (
            <label key={m} className="flex min-h-16 cursor-pointer items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <input type="radio" name="mode" className="size-5 shrink-0" checked={mode === m} onChange={() => setMode(m)} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{tr(m === 'local' ? 'On this device' : 'Online (Claude)')}</span>
                <span className="block text-sm text-muted">
                  {tr(
                    m === 'local'
                      ? 'Works with no link to Earth. Nothing leaves the device.'
                      : 'Best answers, but needs a link to Earth and your own API key. Your health report is sent to Anthropic.',
                  )}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {mode === 'online' ? (
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                startOnline()
              }}
            >
              <label htmlFor="key" className="font-medium">{tr('Claude API key')}</label>
              <p className="mt-1 text-sm text-muted">
                {tr('Paste your own key. It is kept in this tab only and is forgotten when you close it. It is never saved in the app’s code.')}
              </p>
              <input
                id="key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                className="mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 font-mono text-sm"
              />
              <button type="submit" disabled={!keyDraft.trim()} className={`mt-3 ${BTN_PRIMARY} disabled:opacity-50`}>
                {tr('Use this key')}
              </button>
            </form>
          </Card>
        ) : !gpuAvailable() ? (
          <Card>
            <p className="font-semibold">{tr('The on-device helper cannot run in this browser.')}</p>
            <p className="mt-1 text-sm text-muted">
              {tr('It needs WebGPU. Use a recent Chrome or Edge on a computer. Everything else in the app works without it.')}
            </p>
          </Card>
        ) : (
          <>
            <fieldset className="rounded-lg border border-line bg-panel">
              <legend className="sr-only">{tr('Choose a model')}</legend>
              {MODELS.map((m) => (
                <label key={m.id} className="flex min-h-16 cursor-pointer items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <input type="radio" name="model" className="size-5 shrink-0" checked={m.id === modelId} onChange={() => setModelId(m.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{tr(m.name)}</span>
                    <span className="block text-sm text-muted">{tr(m.note)}</span>
                    <span className="block font-mono text-xs text-muted">
                      {tr('About {d} GB to download · needs {v} GB of graphics memory', { d: m.downloadGB, v: m.vramGB })}
                    </span>
                  </span>
                  {saved[m.id] && <span className="shrink-0 text-xs font-semibold text-ok">{tr('Saved')}</span>}
                </label>
              ))}
            </fieldset>

            <Card className="mt-3">
              <p className="text-sm text-muted">
                {onDevice
                  ? tr('This model is saved on this device. It starts with no link to Earth.')
                  : tr('This is a one-time download. Do it while you have a good link. After that it works with no link at all.')}
              </p>
              {phase === 'failed' && (
                <p className="mt-2 text-sm text-bad" role="alert">
                  {tr('The helper could not start. Check your link and free storage, or pick a smaller model, then try again.')}
                </p>
              )}
              <button onClick={startLocal} className={`mt-3 ${BTN_PRIMARY}`}>
                {!onDevice && <Download size={16} aria-hidden />}
                {onDevice ? tr('Start the helper') : tr('Download and start')}
              </button>
            </Card>
          </>
        )}
      </>
    )
  }

  return (
    <>
      {header}
      <p className="mb-3 border-s-2 border-warn bg-panel px-3 py-2 text-sm">
        {tr('The helper explains; it does not diagnose and it can be wrong. The steps under “What to do” on the Today screen come from fixed rules and are the ones to follow.')}
        {mode === 'online' && <> <strong>{tr('Online mode: your health report is sent to Anthropic.')}</strong></>}
      </p>

      <div className="rounded-lg border border-line bg-panel" aria-live="polite">
        {turns.length === 0 ? (
          <div className="p-4">
            <p className="text-sm text-muted">{tr('Ask about your readings, or start with one of these:')}</p>
            <div className="mt-3 flex flex-col items-start gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(tr(s))} className={`${BTN_QUIET} text-start`}>{tr(s)}</button>
              ))}
            </div>
          </div>
        ) : (
          <ul>
            {turns.map((t, i) => (
              <li key={i} className="border-b border-line px-4 py-3 last:border-b-0">
                <div className="font-mono text-xs uppercase tracking-widest text-muted">{t.role === 'user' ? tr('You') : tr('Helper')}</div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{t.text || '…'}</p>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <label className="sr-only" htmlFor="question">{tr('Your question')}</label>
        <input
          id="question"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={tr('Ask about your health report')}
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-panel px-3 text-sm"
        />
        <button type="submit" disabled={busy || !draft.trim()} className={`${BTN_PRIMARY} disabled:opacity-50`}>
          <SendHorizontal size={16} className="rtl:rotate-180" aria-hidden />
          {busy ? tr('Answering…') : tr('Ask')}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          {tr('Model:')} <span dir="ltr">{mode === 'online' ? ONLINE_MODEL : model.id}</span>
        </span>
        <span className="flex gap-4">
          {mode === 'online' && (
            <button onClick={removeKey} disabled={busy} className="min-h-11 underline underline-offset-4 disabled:opacity-50">
              {tr('Remove key')}
            </button>
          )}
          <button onClick={() => setPhase('setup')} disabled={busy} className="min-h-11 underline underline-offset-4 disabled:opacity-50">
            {tr('Change helper')}
          </button>
        </span>
      </div>
    </>
  )
}
