// Shared search normalization ("searchKey").
//
// Uzbek shoppers type in both alphabets (Latin and Cyrillic) and often skip the
// o'/g' apostrophes, so a plain lowercase `includes` missed e.g. "rakovina" vs
// "раковина" or "boyoq" vs "bo'yoq". Every search compares searchKey(field)
// with searchKey(query) instead. The algorithm is identical in the mobile app,
// the admin panels and the backend — keep them in sync:
//   1. null/undefined -> '', otherwise String(value)
//   2. lowercase (full Unicode, so Cyrillic uppercase too)
//   3. transliterate Cyrillic with CYR_TO_LAT (other chars kept as-is)
//   4. drop apostrophe-like glyphs  ' ‘ ’ ʻ ʼ ` ´
//   5. 'ts' -> 's'
//   6. 'h'  -> 'x'
//   7. collapse whitespace runs to one space, trim
// Digits are left untouched, so phones / ids are still found.

const CYR_TO_LAT: { [ch: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ғ': 'g', 'д': 'd', 'е': 'e',
  'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'қ': 'q',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'ў': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ҳ': 'h', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'i', 'ь': '', 'э': 'e',
  'ю': 'yu', 'я': 'ya',
}

// U+0027 U+2018 U+2019 U+02BB U+02BC U+0060 U+00B4
const APOSTROPHES = /['‘’ʻʼ`´]/g

const hasOwn = Object.prototype.hasOwnProperty

/** Normalized form of `value` for Latin/Cyrillic-insensitive search. */
export function searchKey(value: unknown): string {
  if (value === null || value === undefined) return ''
  const lower = String(value).toLowerCase()
  let out = ''
  for (let i = 0; i < lower.length; i++) {
    const ch = lower.charAt(i)
    out += hasOwn.call(CYR_TO_LAT, ch) ? CYR_TO_LAT[ch] : ch
  }
  return out
    .replace(APOSTROPHES, '')
    .replace(/ts/g, 's')
    .replace(/h/g, 'x')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * One precomputable key for a record's searchable fields. Field keys are
 * joined with '\n', which never occurs in a query key (whitespace collapses to
 * a single space), so a query can only match inside ONE field.
 */
export function searchKeyOfFields(fields: ReadonlyArray<unknown>): string {
  const keys: string[] = []
  for (let i = 0; i < fields.length; i++) {
    const k = searchKey(fields[i])
    if (k) keys.push(k)
  }
  return keys.join('\n')
}

/** Precomputes each item's key once (use inside useMemo on the list). */
export function buildSearchKeys<T>(
  items: ReadonlyArray<T>,
  fieldsOf: (item: T) => ReadonlyArray<unknown>,
): Map<T, string> {
  const keys = new Map<T, string>()
  for (let i = 0; i < items.length; i++) {
    keys.set(items[i], searchKeyOfFields(fieldsOf(items[i])))
  }
  return keys
}

/**
 * Fuzzy (typo-tolerant) budget for a query of `len` characters: ~20% of it may
 * differ, so a word that is ~80%+ similar still matches. Queries shorter than 6
 * chars stay exact — one edit on a 4-char query ("seyf") let it match unrelated
 * words like "basseyni" through the "seyn" substring, which is not the intent.
 */
export function fuzzyBudget(len: number): number {
  return len < 6 ? 0 : Math.round(len * 0.2)
}

/**
 * Best edit distance of `pattern` aligned to ANY substring of `text`
 * (approximate substring match / "fuzzy contains"): insert, delete and
 * substitute each cost 1, and the match may begin and end anywhere in `text`.
 * Row 0 is all zeros, which lets an alignment start at any position for free.
 */
export function fuzzyContainsDistance(pattern: string, text: string): number {
  const m = pattern.length
  const n = text.length
  if (m === 0) return 0
  if (n === 0) return m
  let prev = new Array<number>(n + 1).fill(0)
  let curr = new Array<number>(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    curr[0] = i // pattern[0..i) vs an empty text prefix = i deletions
    const pc = pattern.charCodeAt(i - 1)
    for (let j = 1; j <= n; j++) {
      const cost = pc === text.charCodeAt(j - 1) ? 0 : 1
      let v = prev[j - 1] + cost // substitute / match
      const del = prev[j] + 1 // drop a pattern char
      const ins = curr[j - 1] + 1 // drop a text char
      if (del < v) v = del
      if (ins < v) v = ins
      curr[j] = v
    }
    const tmp = prev
    prev = curr
    curr = tmp
  }
  let best = prev[0]
  for (let j = 1; j <= n; j++) if (prev[j] < best) best = prev[j]
  return best
}

/**
 * True when the record key matches the query key exactly (substring) or within
 * the fuzzy budget.
 */
export function matchesSearch(recordKey: string | undefined, queryKey: string): boolean {
  return scoreSearch(recordKey, queryKey) >= 0
}

/**
 * Best (lowest) match score of a record key against a query key: 0 = exact
 * substring hit, positive = smallest fuzzy edit distance across all fields
 * (lower = closer), -1 = no match. Empty query scores 0 for everyone (stable
 * order). Fields are joined with '\n' in the record key, so each is scored
 * separately — a fuzzy match can never span the '\n' the way an inserted edit
 * otherwise could. Use this to sort results so exact matches sit above fuzzy.
 */
export function scoreSearch(recordKey: string | undefined, queryKey: string): number {
  if (queryKey === '') return 0
  const rk = recordKey || ''
  if (rk.indexOf(queryKey) !== -1) return 0
  const budget = fuzzyBudget(queryKey.length)
  if (budget === 0) return -1
  let best = -1
  const fields = rk.split('\n')
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    if (queryKey.length - f.length > budget) continue
    const d = fuzzyContainsDistance(queryKey, f)
    if (d <= budget && (best === -1 || d < best)) {
      best = d
      if (best === 1) break // 1 is the smallest possible non-zero distance
    }
  }
  return best
}

/**
 * Sort `items` by best match score (0 first = exact substring, then fuzzy
 * matches ordered by edit distance). Unmatched items are dropped. Stable
 * within a tie (original order preserved). `keyOf` returns the item's cached
 * searchKey (usually looked up in a Map from buildSearchKeys).
 */
export function rankByMatch<T>(
  items: ReadonlyArray<T>,
  keyOf: (item: T) => string | undefined,
  queryKey: string,
): T[] {
  if (queryKey === '') return items.slice()
  const scored: Array<[number, number, T]> = []
  for (let i = 0; i < items.length; i++) {
    const s = scoreSearch(keyOf(items[i]), queryKey)
    if (s >= 0) scored.push([s, i, items[i]])
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return scored.map((r) => r[2])
}
