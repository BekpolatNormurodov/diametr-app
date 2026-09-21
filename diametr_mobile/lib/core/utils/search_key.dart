/// One search normalization ("searchKey") shared by every Diametr app — the
/// website, the shop admin, the dashboard and the backend implement the exact
/// same steps, so a query finds the same records everywhere. On the customer
/// apps (this one and the website) the final match is also fuzzy — a query that
/// is ~80%+ similar still matches (see [keyMatches]), so a typo like "rakovena"
/// still finds "rakovina".
///
/// Uzbek shoppers type in both alphabets and drop or vary the oʻ/gʻ
/// apostrophe, so a plain lowercase `contains` never found the variant
/// "раковина" from "rakovina" (or "Бўёқ" from "boyoq"). Both the stored text
/// and the typed query go through [searchKey]; a record matches when the key of
/// ANY of its searchable fields contains the query's key. An empty query key
/// matches everything.
///
/// Pure Dart (no Flutter imports) so it can be checked with a plain `dart run`.
library;

/// Cyrillic (Uzbek + Russian) → Latin, applied after lowercasing. Characters
/// that are not in the table are kept as they are.
const Map<String, String> _cyrToLat = {
  'а': 'a',
  'б': 'b',
  'в': 'v',
  'г': 'g',
  'ғ': 'g',
  'д': 'd',
  'е': 'e',
  'ё': 'yo',
  'ж': 'j',
  'з': 'z',
  'и': 'i',
  'й': 'y',
  'к': 'k',
  'қ': 'q',
  'л': 'l',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'ў': 'o',
  'п': 'p',
  'р': 'r',
  'с': 's',
  'т': 't',
  'у': 'u',
  'ф': 'f',
  'х': 'x',
  'ҳ': 'h',
  'ц': 'ts',
  'ч': 'ch',
  'ш': 'sh',
  'щ': 'sh',
  'ъ': '',
  'ы': 'i',
  'ь': '',
  'э': 'e',
  'ю': 'yu',
  'я': 'ya',
};

/// Same table keyed by UTF-16 code unit (every entry is a single BMP letter),
/// so the per-character loop does an int lookup instead of building a String.
final Map<int, String> _cyrToLatByCode = {
  for (final e in _cyrToLat.entries) e.key.codeUnitAt(0): e.value,
};

/// ' ‘ ’ ʻ ʼ ` ´ — every glyph used for the Uzbek oʻ/gʻ apostrophe.
final RegExp _apostrophes =
    RegExp('[\u0027\u2018\u2019\u02BB\u02BC\u0060\u00B4]');
final RegExp _whitespace = RegExp(r'\s+');

/// Normalizes [value] for searching:
/// 1. null → ''; anything else → its `toString()`.
/// 2. Lowercase (Cyrillic too).
/// 3. Transliterate Cyrillic with [_cyrToLat].
/// 4. Remove apostrophe-like glyphs (bo'yoq / bo‘yoq / boyoq are all "boyoq").
/// 5. 'ts' → 's' (цемент / tsement / sement).
/// 6. 'h' → 'x' (ҳаммом / hammom / xammom).
/// 7. Collapse whitespace runs to one space and trim.
/// Digits are left untouched, so ids and phone numbers still match.
String searchKey(Object? value) {
  if (value == null) return '';
  final String lower = value.toString().toLowerCase();
  final StringBuffer out = StringBuffer();
  for (int i = 0; i < lower.length; i++) {
    final int cu = lower.codeUnitAt(i);
    // All table letters live in the Cyrillic block U+0400..U+04FF.
    final String? lat =
        (cu >= 0x0400 && cu <= 0x04FF) ? _cyrToLatByCode[cu] : null;
    if (lat != null) {
      out.write(lat);
    } else {
      out.writeCharCode(cu);
    }
  }
  return out
      .toString()
      .replaceAll(_apostrophes, '')
      .replaceAll('ts', 's')
      .replaceAll('h', 'x')
      .replaceAll(_whitespace, ' ')
      .trim();
}

/// Fuzzy (typo-tolerant) matching budget for a query of [len] characters: about
/// 20% of its length may differ, so a word that is ~80%+ similar still matches
/// (e.g. "rakovena" finds "rakovina"). Queries shorter than 6 chars stay exact —
/// one edit on a 4-char word like "seyf" matched "basseyni" (through the
/// "seyn" substring), which is not what shoppers meant.
int fuzzyBudget(int len) => len < 6 ? 0 : (len * 0.2).round();

/// Best edit distance of [pattern] aligned to ANY substring of [text]
/// (approximate substring match / "fuzzy contains"): insert, delete and
/// substitute each cost 1, and the match may begin and end anywhere in [text].
/// Row 0 is all zeros, which lets an alignment start at any position for free.
int fuzzyContainsDistance(String pattern, String text) {
  final int m = pattern.length;
  final int n = text.length;
  if (m == 0) return 0;
  if (n == 0) return m;
  List<int> prev = List<int>.filled(n + 1, 0);
  List<int> curr = List<int>.filled(n + 1, 0);
  for (int i = 1; i <= m; i++) {
    curr[0] = i; // pattern[0..i) vs an empty text prefix = i deletions
    final int pc = pattern.codeUnitAt(i - 1);
    for (int j = 1; j <= n; j++) {
      final int cost = pc == text.codeUnitAt(j - 1) ? 0 : 1;
      int v = prev[j - 1] + cost; // substitute / match
      final int del = prev[j] + 1; // drop a pattern char
      final int ins = curr[j - 1] + 1; // drop a text char
      if (del < v) v = del;
      if (ins < v) v = ins;
      curr[j] = v;
    }
    final List<int> tmp = prev;
    prev = curr;
    curr = tmp;
  }
  int best = prev[0];
  for (int j = 1; j <= n; j++) {
    if (prev[j] < best) best = prev[j];
  }
  return best;
}

/// True when [queryKey] is an exact substring of [fieldKey] (fast path) or a
/// fuzzy match within [fuzzyBudget].
bool keyMatches(String fieldKey, String queryKey) {
  if (fieldKey.contains(queryKey)) return true;
  final int budget = fuzzyBudget(queryKey.length);
  if (budget == 0) return false;
  // A query far longer than the field can never fit within budget.
  if (queryKey.length - fieldKey.length > budget) return false;
  return fuzzyContainsDistance(queryKey, fieldKey) <= budget;
}

/// The matching rule: true when [queryKey] (already a [searchKey]) is empty, or
/// matches (exactly or fuzzily) any of [fieldKeys].
bool searchKeysContain(Iterable<String> fieldKeys, String queryKey) {
  if (queryKey.isEmpty) return true;
  for (final String k in fieldKeys) {
    if (keyMatches(k, queryKey)) return true;
  }
  return false;
}

/// Caches the [searchKey]s of each record's searchable fields, so a list that
/// is re-filtered on every keystroke only runs `contains` instead of
/// re-normalizing every field of every record. The keys hang off the record
/// object itself (an [Expando]), so they are released together with the old
/// data when a bloc emits a fresh list.
class SearchKeyIndex {
  SearchKeyIndex(this._fieldsOf);

  /// The record's searchable field values (nulls are fine).
  final Iterable<Object?> Function(dynamic record) _fieldsOf;
  final Expando<List<String>> _cache = Expando<List<String>>('searchKeys');

  List<String> keysOf(dynamic record) {
    // An Expando cannot be attached to these; just compute them.
    if (record == null ||
        record is num ||
        record is String ||
        record is bool ||
        record is Record) {
      return _compute(record);
    }
    return _cache[record as Object] ??= _compute(record);
  }

  List<String> _compute(dynamic record) => [
        for (final Object? f in _fieldsOf(record))
          if (f != null) searchKey(f),
      ];

  /// True when [queryKey] (already a [searchKey]) is empty or is contained in
  /// the key of any of [record]'s fields.
  bool matches(dynamic record, String queryKey) =>
      queryKey.isEmpty || searchKeysContain(keysOf(record), queryKey);
}
