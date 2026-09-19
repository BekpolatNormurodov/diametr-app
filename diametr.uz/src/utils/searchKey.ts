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
 * True when the record key contains the query key. `queryKey` must already be
 * a searchKey(...) result; an empty one matches everything.
 */
export function matchesSearch(recordKey: string | undefined, queryKey: string): boolean {
  return queryKey === '' || (recordKey || '').indexOf(queryKey) !== -1
}
