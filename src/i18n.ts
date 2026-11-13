import { useSyncExternalStore } from 'react'
import { AR } from './ar'

export type Lang = 'en' | 'ar'

const KEY = 'bovd-lang'
let lang: Lang = 'en'
try {
  if (localStorage.getItem(KEY) === 'ar') lang = 'ar'
} catch { /* no storage (tests, private mode): stay in English */ }

const listeners = new Set<() => void>()

function applyToPage() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}
applyToPage()

export const getLang = () => lang

export function setLang(next: Lang) {
  lang = next
  try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
  applyToPage()
  listeners.forEach((f) => f())
}

/** Re-renders the component when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore((cb) => {
    listeners.add(cb)
    return () => { listeners.delete(cb) }
  }, getLang)
}

/** English texts that had no Arabic entry when shown; used to find gaps. */
export const missing = new Set<string>()

/**
 * Translate. The English text is the key; `{name}` slots are filled from `vars`.
 * Falls back to English when there is no Arabic entry.
 */
export function tr(text: string, vars?: Record<string, string | number>): string {
  let out = text
  if (lang === 'ar') {
    const a = AR[text]
    if (a === undefined) missing.add(text)
    else out = a
  }
  if (vars) for (const k in vars) out = out.replaceAll(`{${k}}`, String(vars[k]))
  return out
}
