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
 * Fuzzy (typo-tolerant) budget for a query of `len` characters: ~20% of it may
 * differ, so a word ~80%+ similar still matches. Queries under 4 chars stay
 * exact — one edit on a 2–3 letter word would match almost anything. Kept in
 * sync with the mobile app and the website (their customer search is fuzzy too).
 */
export function fuzzyBudget(len: number): number {
  return len < 4 ? 0 : Math.round(len * 0.2);
}

/**
 * Best edit distance of `pattern` aligned to ANY substring of `text`
 * (approximate substring match / "fuzzy contains"): insert, delete and
 * substitute each cost 1, and the match may begin and end anywhere in `text`.
 * Row 0 is all zeros, which lets an alignment start at any position for free.
 */
export function fuzzyContainsDistance(pattern: string, text: string): number {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return 0;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1).fill(0);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i; // pattern[0..i) vs an empty text prefix = i deletions
    const pc = pattern.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = pc === text.charCodeAt(j - 1) ? 0 : 1;
      let v = prev[j - 1] + cost; // substitute / match
      const del = prev[j] + 1; // drop a pattern char
      const ins = curr[j - 1] + 1; // drop a text char
      if (del < v) v = del;
      if (ins < v) v = ins;
      curr[j] = v;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  let best = prev[0];
  for (let j = 1; j <= n; j++) if (prev[j] < best) best = prev[j];
  return best;
}

/**
 * True when any field matches the query — exactly (substring) or within the
 * fuzzy budget for the query's length. `queryKey` must already be
 * searchKey(query) (compute it once per search, not per record). An empty key
 * matches everything, like an empty search box. Each field is checked
 * separately, so a fuzzy match never spans two fields.
 */
export function matchesSearchKey(
  queryKey: string,
  fields: ReadonlyArray<unknown>,
): boolean {
  if (!queryKey) return true;
  const budget = fuzzyBudget(queryKey.length);
  return fields.some((f) => {
    const key = searchKey(f);
    if (key.includes(queryKey)) return true;
    if (budget === 0) return false;
    if (queryKey.length - key.length > budget) return false;
    return fuzzyContainsDistance(queryKey, key) <= budget;
  });
}
