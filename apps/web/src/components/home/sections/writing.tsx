import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import logo from "../../../assets/logo.png"
import { useLang } from '../../../context/AppContext'
import { useScrollReveal } from '../../../hooks/useScrollReveal'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.diametr.diametr_mobile&hl=uz'
const APP_STORE_URL = 'https://apps.apple.com'

export default function Writing() {
  const { lang } = useLang()
  const ref = useScrollReveal()
  return (
    <section id="Writing" ref={ref} className="w-full bg-primary py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 reveal">
          
          {/* Text */}
          <div className="w-full lg:w-1/2 text-center lg:text-left text-white reveal reveal-left reveal-delay-1">
            <span className="inline-block bg-white/20 text-white/90 font-semibold text-xs px-4 py-1.5 rounded-full mb-5">
              {lang === "uz" ? "Mobil ilova" : "Мобильное приложение"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight">
              {lang === "uz"
                ? "Diametr ilovasini yuklab oling va qurishni boshlang!"
                : "Скачайте приложение Diametr и начинайте строительство!"}
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-8">
              {lang === "uz"
                ? "App Store va Google Play'da mavjud. Minglab qurilish materiallari, qulay narxlar va ishonchli do'konlar bitta ilovada."
                : "Доступно в App Store и Google Play. Тысячи стройматериалов, удобные цены и надёжные магазины в одном приложении."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 flex-shrink-0">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">{lang === "uz" ? "Yuklab olish" : "Скачать в"}</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>

              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 flex-shrink-0">
                  <path d="M3,20.5v-17c0-0.83,0.93-1.3,1.6-0.8l15,8.5c0.67,0.38,0.67,1.32,0,1.7l-15,8.5 C3.93,21.8,3,21.33,3,20.5z"/>
                  <path fill="#00C853" d="M3,20.5l13.5-8.5L3,3.5V20.5z"/>
                  <path fill="#FF6D00" d="M3,3.5l13.5,8.5L21,9.3L5.6,0.5C4.93,0,3.83,0.47,3,3.5z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">{lang === "uz" ? "Yuklab olish" : "Скачать в"}</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </a>
            </div>

            {/* QR code under the buttons */}
            <div className="mt-8 flex items-center gap-5 justify-center lg:justify-start">
              <div
                className="relative bg-white rounded-3xl flex-shrink-0"
                style={{
                  width: 224,
                  height: 224,
                  padding: 22,
                  boxShadow:
                    '0 20px 50px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,196,140,0.35), 0 0 40px rgba(0,196,140,0.25)',
                }}
              >
                {/* Decorative corner brackets */}
                <span className="absolute top-3 left-3 w-4 h-4 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
                <span className="absolute top-3 right-3 w-4 h-4 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
                <span className="absolute bottom-3 left-3 w-4 h-4 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
                <span className="absolute bottom-3 right-3 w-4 h-4 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />

                <QRCodeSVG
                  value={PLAY_URL}
                  size={180}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0b3d2e"
                  marginSize={1}
                  style={{ display: 'block', width: 180, height: 180, shapeRendering: 'crispEdges' }}
                />

                {/* Center logo badge */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center"
                  style={{
                    width: 54,
                    height: 54,
                    padding: 7,
                    boxShadow:
                      '0 4px 10px -3px rgba(0,0,0,0.3), 0 0 0 3px #ffffff, 0 0 0 4px rgba(0,196,140,0.45)',
                  }}
                >
                  <img
                    src={logo}
                    alt="Diametr"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
              <div className="text-white max-w-[220px]">
                <div className="text-base font-bold leading-tight mb-1">
                  {lang === 'uz' ? 'QR-kod orqali yuklab oling' : 'Скачайте через QR-код'}
                </div>
                <div className="text-xs text-white/85 leading-snug">
                  {lang === 'uz'
                    ? "Telefoningiz kamerasi bilan skanerlang va Google Play’ga o'ting"
                    : 'Отсканируйте камерой телефона и перейдите в Google Play'}
                </div>
              </div>
            </div>
          </div>

          {/* Visual card */}
          <div className="w-full lg:w-1/2 flex justify-center reveal reveal-right reveal-delay-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-bold text-lg">Diametr</div>
                  <div className="text-white/70 text-sm">{lang === "uz" ? "Qurilish materiallari" : "Стройматериалы"}</div>
                </div>
              </div>
              {[
                { uz: "Tez yetkazib berish",        ru: "Быстрая доставка" },
                { uz: "Kafolatlangan sifat",        ru: "Гарантированное качество" },
                { uz: "Eng arzon variantni tanlang", ru: "Самый выгодный вариант" },
                { uz: "Qulay mobil ilova",          ru: "Удобное мобильное приложение" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm">{lang === "uz" ? item.uz : item.ru}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
