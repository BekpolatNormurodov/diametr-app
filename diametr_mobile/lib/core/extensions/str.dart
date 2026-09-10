// Compiled once and reused — `normalizeSearch` runs per query AND per candidate
// field inside the search filter loops, so a per-call RegExp would allocate
// hundreds of identical objects per keystroke.
final RegExp _aposGlyphs = RegExp("[‘’ʻʼ`´]");
final RegExp _leadingPlus = RegExp(r'^\++');

// ignore: camel_case_extensions
extension myextension on String? {
  String toMoney() {
    if (this == null || this!.isEmpty) return '0';
    final s = this!;
    String result = '';
    for (int i = 0; i < s.length; i++) {
      result += s[i];
      if (i < s.length - 1 && (s.length - i - 1) % 3 == 0) {
        result += ' ';
      }
    }
    return result;
  }

  /// Lowercases and folds the various Unicode apostrophe glyphs used for the
  /// Uzbek oʻ/gʻ sounds (curly quotes, modifier letters, backtick) onto a
  /// single ASCII `'` — otherwise "bo'yoq" typed with a straight apostrophe
  /// never matches "bo‘yoq" stored with a curly one (or vice versa).
  String normalizeSearch() {
    if (this == null) return '';
    return this!
        .toLowerCase()
        .replaceAll(_aposGlyphs, "'");
  }

  /// Renders a phone as exactly one leading '+' — the backend stores some
  /// numbers already prefixed with '+', so blindly doing '+' + phone produced
  /// "++998...". Returns '' for an empty value (so callers can hide the row).
  String toPhone() {
    final s = (this ?? '').replaceAll(_leadingPlus, '').trim();
    return s.isEmpty ? '' : '+$s';
  }
}