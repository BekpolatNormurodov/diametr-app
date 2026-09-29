const NAMED: Record<string, string> = { quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', amp: '&' }

/**
 * Plain text from a string that may carry HTML entities. The dashboard's
 * auto-translate used to save them ("jo&#39;mrakli"), so catalogue text is
 * decoded before display and before building search keys.
 */
export function decodeEntities(s: string | null | undefined): string {
  if (!s) return ''
  if (s.indexOf('&') === -1) return s
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&(quot|apos|lt|gt|nbsp|amp);/g, (_, e) => NAMED[e])
}
