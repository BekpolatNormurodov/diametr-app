import React, { useState, useEffect, useRef } from 'react'
import { authService } from '../../service/authService'

interface Props {
  open: boolean
  onClose: () => void
  onAuth: () => void
  lang?: 'uz' | 'ru'
}

const L = {
  title:      { uz: "Kirish",                   ru: "Войти" },
  subtitle:   { uz: "Telefon raqamingizni kiriting", ru: "Введите ваш номер телефона" },
  phonePh:    { uz: "99 123 45 67",              ru: "99 123 45 67" },
  send:       { uz: "Kod olish",                 ru: "Получить код" },
  smsTitle:   { uz: "SMS kodni tasdiqlang",      ru: "Подтвердите SMS код" },
  smsDesc:    { uz: "ga yuborilgan 6 xonali kodni kiriting", ru: "Введите 6-значный код, отправленный на" },
  verify:     { uz: "Tasdiqlash",                ru: "Подтвердить" },
  back:       { uz: "Orqaga",                    ru: "Назад" },
  resend:     { uz: "Qayta yuborish",            ru: "Отправить снова" },
  sending:    { uz: "Yuborilmoqda...",           ru: "Отправка..." },
  verifying:  { uz: "Tekshirilmoqda...",         ru: "Проверка..." },
  err_phone:  { uz: "Telefon raqam noto'g'ri formatda", ru: "Неверный формат телефона" },
  cancel:     { uz: "Bekor qilish",             ru: "Отмена" },
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

export default function AuthModal({ open, onClose, onAuth, lang = 'uz' }: Props) {
  const [step, setStep] = useState<'phone' | 'sms'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [verifyId, setVerifyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', ''])
  // Guard against double-submit (React 18 batching can call handleVerify twice)
  const verifyingRef = React.useRef(false)

  // Focus phone input on open
  useEffect(() => {
    if (open) {
      setStep('phone')
      setPhone('')
      setCode('')
      setError('')
      setCodeDigits(['', '', '', '', '', ''])
      verifyingRef.current = false
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Format phone display: 99 123 45 67
  const formatDisplay = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 9)
    let out = ''
    if (d.length > 0) out += d.slice(0, 2)
    if (d.length > 2) out += ' ' + d.slice(2, 5)
    if (d.length > 5) out += ' ' + d.slice(5, 7)
    if (d.length > 7) out += ' ' + d.slice(7, 9)
    return out
  }

  const rawDigits = phone.replace(/\D/g, '')
  const fullPhone = '+998' + rawDigits

  const handleSend = async () => {
    setError('')
    if (rawDigits.length !== 9) {
      setError(L.err_phone[lang])
      return
    }
    setLoading(true)
    try {
      const res = await authService.sendSms(fullPhone)
      setVerifyId(res.id)
      setStep('sms')
      setCountdown(60)
      setTimeout(() => codeRefs[0].current?.focus(), 150)
    } catch (e) {
      setError((e as any).message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...codeDigits]
    next[i] = d
    setCodeDigits(next)
    if (d && i < 5) codeRefs[i + 1].current?.focus()
    if (next.every(x => x) && next.join('').length === 6) {
      handleVerify(next.join(''))
    }
  }

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[i] && i > 0) {
      codeRefs[i - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const arr = pasted.split('')
      setCodeDigits(arr)
      setTimeout(() => codeRefs[5].current?.focus(), 50)
      handleVerify(pasted)
    }
  }

  const handleVerify = async (fullCode?: string) => {
    const c = fullCode ?? codeDigits.join('')
    setError('')
    if (c.length !== 6) return
    // Prevent double-call (auto-fill + button click race)
    if (verifyingRef.current) return
    verifyingRef.current = true
    setLoading(true)
    try {
      const res = await authService.verifySms(verifyId, c)
      authService.saveAuth(res.access_token, res.user)
      onAuth()
      onClose()
    } catch (e) {
      verifyingRef.current = false
      setError((e as any).message || "Kod noto'g'ri")
      setCodeDigits(['', '', '', '', '', ''])
      setTimeout(() => codeRefs[0].current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slideUp mx-2 sm:mx-0">
        {/* Green top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-400 to-teal-500" />

        <div className="p-4 sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <PhoneIcon />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900">
                  {step === 'phone' ? L.title[lang] : L.smsTitle[lang]}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {step === 'phone'
                    ? L.subtitle[lang]
                    : `${fullPhone} ${L.smsDesc[lang]}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 ml-2 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <div>
              <div className="relative">
                <div className="flex items-center gap-1.5 px-3 py-3 rounded-2xl border-2 border-slate-200 focus-within:border-primary transition-colors bg-slate-50">
                  {/* UZ prefix */}
                  <div className="flex items-center gap-1.5 shrink-0 border-r border-slate-200 pr-3 mr-1">
                    <svg width="22" height="15" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2 }}>
                      <rect width="30" height="6.67" fill="#1EB2FF"/>
                      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF"/>
                      <rect y="13.33" width="30" height="6.67" fill="#32CD32"/>
                    </svg>
                    <span className="text-sm font-bold text-slate-700">+998</span>
                  </div>
                  <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder={L.phonePh[lang]}
                    value={formatDisplay(phone)}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                    className="flex-1 bg-transparent text-slate-900 font-semibold text-base outline-none placeholder:text-slate-400 placeholder:font-normal tracking-wide"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleSend}
                disabled={loading || rawDigits.length !== 9}
                className="mt-4 w-full py-3.5 rounded-2xl bg-primary hover:bg-accent text-white font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {L.sending[lang]}
                  </>
                ) : L.send[lang]}
              </button>
            </div>
          )}

          {/* Step 2: SMS Code */}
          {step === 'sms' && (
            <div>
              {/* 6-digit code boxes */}
              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {codeRefs.map((ref, i) => (
                  <input
                    key={i}
                    ref={ref}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={codeDigits[i]}
                    onChange={e => handleCodeDigit(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-200
                      ${codeDigits[i] ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-slate-50 text-slate-900'}
                      focus:border-primary focus:bg-primary/5`}
                  />
                ))}
              </div>

              {error && (
                <p className="mb-3 text-xs text-red-500 text-center flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={() => handleVerify()}
                disabled={loading || codeDigits.join('').length !== 6}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-accent text-white font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {L.verifying[lang]}
                  </>
                ) : L.verify[lang]}
              </button>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => { setStep('phone'); setError('') }}
                  className="text-xs text-slate-500 hover:text-primary transition-colors"
                >
                  ← {L.back[lang]}
                </button>
                {countdown > 0 ? (
                  <span className="text-xs text-slate-400">{L.resend[lang]} {countdown}s</span>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="text-xs text-primary font-semibold hover:text-accent transition-colors disabled:opacity-50"
                  >
                    {L.resend[lang]}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
