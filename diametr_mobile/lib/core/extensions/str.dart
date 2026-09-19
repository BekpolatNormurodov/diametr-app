import 'package:stroymarket/core/utils/search_key.dart';

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

  /// The shared search key (see [searchKey]): lowercased, Cyrillic
  /// transliterated to Latin, apostrophes dropped, ts→s, h→x, whitespace
  /// collapsed — so "rakovina" finds "раковина" and "boyoq" finds "bo‘yoq".
  String normalizeSearch() => searchKey(this);

  /// Renders a phone as exactly one leading '+' — the backend stores some
  /// numbers already prefixed with '+', so blindly doing '+' + phone produced
  /// "++998...". Returns '' for an empty value (so callers can hide the row).
  String toPhone() {
    final s = (this ?? '').replaceAll(_leadingPlus, '').trim();
    return s.isEmpty ? '' : '+$s';
  }
}