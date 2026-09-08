import React, { useEffect, useState } from 'react'

interface GeoCoords {
  latitude: number
  longitude: number
  accuracy: number
}

interface Props {
  lang?: 'uz' | 'ru'
  onClose: () => void
  onAllow: (coords: GeoCoords) => void
}

export default function GeoPermissionModal({ lang = 'uz', onClose, onAllow }: Props) {
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)

  const handleAllow = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false)
        onAllow({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy })
        onClose()
      },
      () => {
        setLoading(false)
        setDenied(true)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-8 h-8 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>

        {denied ? (
          <>
            <h3 className="font-bold text-slate-800 text-lg mb-2">
              {lang === 'uz' ? 'Joylashuv rad etildi' : 'Геолокация отклонена'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {lang === 'uz'
                ? "Brauzer sozlamalaridan joylashuv ruxsatini bering va qayta urinib ko'ring."
                : 'Разрешите доступ к геолокации в настройках браузера и попробуйте снова.'}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              {lang === 'uz' ? 'Yopish' : 'Закрыть'}
            </button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-800 text-lg mb-2">
              {lang === 'uz' ? 'Joylashuvingizni ulashing' : 'Поделитесь местоположением'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {lang === 'uz'
                ? "Yaqin atrofdagi do'konlar va mahsulotlarni tezroq topish uchun joylashuvingizdan foydalanishga ruxsat bering."
                : 'Разрешите использование геолокации, чтобы быстрее находить ближайшие магазины и товары.'}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleAllow}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )}
                {lang === 'uz' ? 'Ruxsat berish' : 'Разрешить'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                {lang === 'uz' ? "Keyinroq" : 'Позже'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function useGeoPermission() {
  const [asked, setAsked] = useState(() => {
    return localStorage.getItem('diametr_geo_asked') === '1'
  })
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState<GeoCoords | null>(null)

  useEffect(() => {
    if (!asked) {
      // Ask after 2 seconds when page loads
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [asked])

  const close = () => {
    setShow(false)
    setAsked(true)
    localStorage.setItem('diametr_geo_asked', '1')
  }

  const allow = (c: GeoCoords) => {
    setCoords(c)
    localStorage.setItem('diametr_geo_asked', '1')
    localStorage.setItem('diametr_geo_lat', String(c.latitude))
    localStorage.setItem('diametr_geo_lon', String(c.longitude))
  }

  return { show, close, allow, coords }
}
