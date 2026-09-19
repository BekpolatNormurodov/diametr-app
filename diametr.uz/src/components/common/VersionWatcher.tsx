import React, { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLang } from '../../context/AppContext'

/**
 * Picks up a new deploy in a long-open tab without a hard refresh.
 *
 * The running version is the hashed entry bundle referenced by the live document
 * (CRA: /static/js/main.<hash>.js, Vite: /assets/index-<hash>.js). A fresh
 * index.html is fetched now and then and compared. When it differs:
 *  - the next in-app page change reloads (a natural boundary: the route remounts anyway),
 *  - a small "Yangi versiya mavjud" toast offers an immediate "Yangilash".
 * Never reloads on focus / visibility — a half-filled form or open modal would be lost.
 */

const BUNDLE_RE = /\/static\/js\/main\.[\w-]+\.js|\/assets\/index-[\w-]+\.js/
const CHECK_THROTTLE_MS = 60 * 1000
const CHECK_INTERVAL_MS = 5 * 60 * 1000
const RELOAD_ATTEMPT_KEY = 'diametr_reload_for'
const TOAST_ID = 'diametr-new-version'

function detectRunningVersion(): string | null {
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  for (const script of scripts) {
    const match = (script.getAttribute('src') || '').match(BUNDLE_RE)
    if (match) return match[0]
  }
  return null
}

function readAttempt(): string | null {
  try {
    return sessionStorage.getItem(RELOAD_ATTEMPT_KEY)
  } catch {
    return null
  }
}

function writeAttempt(version: string): boolean {
  try {
    sessionStorage.setItem(RELOAD_ATTEMPT_KEY, version)
    return sessionStorage.getItem(RELOAD_ATTEMPT_KEY) === version
  } catch {
    return false
  }
}

export default function VersionWatcher() {
  const location = useLocation()
  const { lang } = useLang()
  const langRef = useRef(lang)
  langRef.current = lang

  const runningRef = useRef<string | null>(null)
  const latestRef = useRef<string | null>(null)
  const bannerForRef = useRef<string | null>(null)
  const lastCheckRef = useRef(Date.now())
  const checkingRef = useRef(false)
  const reloadingRef = useRef(false)
  const pathRef = useRef(location.pathname)

  const showBanner = useCallback((version: string) => {
    if (bannerForRef.current === version) return
    bannerForRef.current = version
    const uz = langRef.current !== 'ru'
    toast(
      <div className="flex items-center gap-3 pl-4 pr-7 py-3 w-full">
        <p className="flex-1 min-w-0 text-[13px] font-bold text-slate-800">
          {uz ? 'Yangi versiya mavjud' : 'Доступна новая версия'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
        >
          {uz ? 'Yangilash' : 'Обновить'}
        </button>
      </div>,
      { toastId: TOAST_ID, icon: false, autoClose: false, closeOnClick: false }
    )
  }, [])

  const check = useCallback(() => {
    const running = runningRef.current
    if (!running || checkingRef.current) return
    const now = Date.now()
    if (now - lastCheckRef.current < CHECK_THROTTLE_MS) return
    lastCheckRef.current = now
    checkingRef.current = true
    fetch('/index.html?_v=' + now, { cache: 'no-store' })
      .then(res => (res.ok ? res.text() : ''))
      .then(html => {
        const match = html.match(BUNDLE_RE)
        if (!match) return
        if (match[0] === running) {
          latestRef.current = null
          return
        }
        latestRef.current = match[0]
        showBanner(match[0])
      })
      .catch(() => { /* offline or mid-deploy — try again later */ })
      .finally(() => { checkingRef.current = false })
  }, [showBanner])

  // Determine the running version once; undetectable (e.g. dev server) → stay inert
  useEffect(() => {
    runningRef.current = detectRunningVersion()
    if (runningRef.current && readAttempt() === runningRef.current) {
      // The previous auto-reload landed on the new version — clear the loop guard
      try { sessionStorage.removeItem(RELOAD_ATTEMPT_KEY) } catch { /* ignore */ }
    }
  }, [])

  // Every in-app navigation: reload into the new version if one is waiting, else check
  useEffect(() => {
    const pathChanged = pathRef.current !== location.pathname
    pathRef.current = location.pathname
    const target = latestRef.current
    if (pathChanged && target && !reloadingRef.current && readAttempt() !== target) {
      // Loop guard: if this reload still serves the old bundle, the next load
      // sees the same target already attempted and only shows the banner.
      if (writeAttempt(target)) {
        reloadingRef.current = true
        window.location.reload()
        return
      }
    }
    check()
  }, [location.key, location.pathname]) // eslint-disable-line

  // Focus, tab becoming visible, and every 5 minutes while visible
  useEffect(() => {
    const onFocus = () => check()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') check()
    }, CHECK_INTERVAL_MS)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [check])

  return null
}
