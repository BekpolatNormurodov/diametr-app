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
}