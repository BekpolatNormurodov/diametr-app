// Colour of a variant for display. Most variants have no colour field set,
// but their name/description says it ("oq", "белая"), so colours are also
// read from that text. Keep in sync with diametr_mobile/lib/core/utils/variant.dart.

export interface NamedColor { hex: string; uz: string; ru: string }

const PALETTE: Array<[NamedColor, string[]]> = [
  [{ hex: '#FFFFFF', uz: 'Oq', ru: 'Белый' }, ['oq', 'oppoq', 'белый', 'белая', 'белое', 'белые', 'белого', 'белой', 'white']],
  [{ hex: '#111827', uz: 'Qora', ru: 'Чёрный' }, ['qora', 'чёрный', 'черный', 'чёрная', 'черная', 'чёрное', 'черное', 'чёрные', 'черные', 'black']],
  [{ hex: '#9CA3AF', uz: 'Kulrang', ru: 'Серый' }, ['kulrang', 'серый', 'серая', 'серое', 'серые', 'grey', 'gray']],
  [{ hex: '#DC2626', uz: 'Qizil', ru: 'Красный' }, ['qizil', 'красный', 'красная', 'красное', 'красные', 'red']],
  [{ hex: '#2563EB', uz: "Ko'k", ru: 'Синий' }, ["ko'k", 'kok', 'moviy', 'синий', 'синяя', 'синее', 'синие', 'blue']],
  [{ hex: '#60A5FA', uz: 'Havorang', ru: 'Голубой' }, ['havorang', 'голубой', 'голубая', 'голубое', 'голубые']],
  [{ hex: '#16A34A', uz: 'Yashil', ru: 'Зелёный' }, ['yashil', 'зелёный', 'зеленый', 'зелёная', 'зеленая', 'зелёное', 'зеленое', 'green']],
  [{ hex: '#FACC15', uz: 'Sariq', ru: 'Жёлтый' }, ['sariq', 'жёлтый', 'желтый', 'жёлтая', 'желтая', 'yellow']],
  [{ hex: '#F97316', uz: "To'q sariq", ru: 'Оранжевый' }, ['apelsinrang', 'оранжевый', 'оранжевая', 'orange']],
  [{ hex: '#92400E', uz: 'Jigarrang', ru: 'Коричневый' }, ['jigarrang', "qo'ng'ir", 'коричневый', 'коричневая', 'brown']],
  [{ hex: '#D6C7A1', uz: 'Bej', ru: 'Бежевый' }, ['bej', 'бежевый', 'бежевая', 'beige']],
  [{ hex: '#C0C0C0', uz: 'Kumushrang', ru: 'Серебристый' }, ['kumush', 'kumushrang', 'серебристый', 'серебристая', 'silver']],
  [{ hex: '#D4AF37', uz: 'Oltinrang', ru: 'Золотой' }, ['oltin', 'oltinrang', 'золотой', 'золотая', 'золотистый', 'gold']],
  [{ hex: '#EC4899', uz: 'Pushti', ru: 'Розовый' }, ['pushti', 'розовый', 'розовая', 'pink']],
  [{ hex: '#7C3AED', uz: 'Binafsha', ru: 'Фиолетовый' }, ['binafsha', 'binafsharang', 'фиолетовый', 'фиолетовая', 'purple']],
]

const BY_WORD = new Map<string, NamedColor>()
PALETTE.forEach(([c, words]) => words.forEach(w => BY_WORD.set(w, c)))

/** Colours named in the given texts, in order of appearance (at most 4). */
export function colorsInText(...texts: Array<string | null | undefined>): NamedColor[] {
  const out: NamedColor[] = []
  for (const t of texts) {
    if (!t) continue
    const words = t.toLowerCase().replace(/[ʻʼ’‘`´]/g, "'").split(/[^a-zа-яёўқғҳ']+/)
    for (const raw of words) {
      const c = BY_WORD.get(raw.replace(/^'+|'+$/g, ''))
      if (c && !out.includes(c)) out.push(c)
    }
  }
  return out.slice(0, 4)
}

/** Closest palette colour to a hex value, for naming a picked colour. */
export function nearestNamedColor(hex: string): NamedColor | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  let best: NamedColor | null = null
  let bestD = Infinity
  for (const [c] of PALETTE) {
    const k = parseInt(c.hex.slice(1), 16)
    // "redmean" distance: closer to how the eye compares colours than plain RGB
    const r = (((k >> 16) & 255) + rgb[0]) / 2
    const dr = ((k >> 16) & 255) - rgb[0], dg = ((k >> 8) & 255) - rgb[1], db = (k & 255) - rgb[2]
    const d = (2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db
    if (d < bestD) { bestD = d; best = c }
  }
  return best
}
