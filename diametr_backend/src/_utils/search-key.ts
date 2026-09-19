/**
 * searchKey — the one text normalization every Diametr search uses (mobile,
 * web, dashboards, shop admin and this backend implement it identically), so
 * Latin and Cyrillic Uzbek/Russian spellings of the same word find each
 * other: "rakovina" ⇄ "раковина", "bo'yoq" ⇄ "boyoq" ⇄ "Бўёқ".
 *
 * Algorithm, in order:
 *   1. null/undefined → ''; anything else → string
 *   2. lowercase (full Unicode, so Cyrillic too)
 *   3. transliterate Cyrillic with CYR_TO_LAT (other chars kept as-is)
 *   4. drop apostrophe-like glyphs: ' ‘ ’ ʻ ʼ ` ´
 *   5. 'ts' → 's'
 *   6. 'h' → 'x'
 *   7. collapse whitespace runs to one space, trim
 *
 * Digits are left untouched, so ids and phone numbers still match.
 */

const CYR_TO_LAT: ReadonlyMap<string, string> = new Map([
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['ғ', 'g'],
  ['д', 'd'],
  ['е', 'e'],
  ['ё', 'yo'],
  ['ж', 'j'],
  ['з', 'z'],
  ['и', 'i'],
  ['й', 'y'],
  ['к', 'k'],
  ['қ', 'q'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['ў', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['ф', 'f'],
  ['х', 'x'],
  ['ҳ', 'h'],
  ['ц', 'ts'],
  ['ч', 'ch'],
  ['ш', 'sh'],
  ['щ', 'sh'],
  ['ъ', ''],
  ['ы', 'i'],
  ['ь', ''],
  ['э', 'e'],
  ['ю', 'yu'],
  ['я', 'ya'],
]);

/** U+0027 U+2018 U+2019 U+02BB U+02BC U+0060 U+00B4 */
const APOSTROPHES = /['‘’ʻʼ`´]/g;

export function searchKey(value: unknown): string {
  if (value === null || value === undefined) return '';
  const lower = String(value).toLowerCase();
  let out = '';
  for (const ch of lower) {
    const lat = CYR_TO_LAT.get(ch);
    out += lat !== undefined ? lat : ch;
  }
  return out
    .replace(APOSTROPHES, '')
    .replace(/ts/g, 's')
    .replace(/h/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when any field contains the query. `queryKey` must already be
 * searchKey(query) (compute it once per search, not per record). An empty
 * key matches everything, like an empty search box.
 */
export function matchesSearchKey(
  queryKey: string,
  fields: ReadonlyArray<unknown>,
): boolean {
  if (!queryKey) return true;
  return fields.some((f) => searchKey(f).includes(queryKey));
}
