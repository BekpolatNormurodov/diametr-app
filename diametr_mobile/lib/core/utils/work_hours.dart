/// Weekly shop hours as the API stores them (shop.work_hours): 7 entries,
/// Monday first; null = day off. A close time earlier than the open time means
/// the shop works past midnight; "00:00"–"24:00" is open round the clock.
/// Mirrors utils/workHours.ts of the web apps.
class WorkRange {
  final String open;
  final String close;
  const WorkRange(this.open, this.close);

  bool get is24h => open == '00:00' && close == '24:00';
}

typedef WorkHours = List<WorkRange?>;

const List<String> dayNamesUz = [
  'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba',
];
const List<String> dayNamesRu = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
];
const List<String> _ruOnDay = [
  'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье',
];

final RegExp _time = RegExp(r'^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$');

/// The stored value, or null when missing/malformed/all days off ("not set").
WorkHours? parseWorkHours(dynamic v) {
  if (v is! List || v.length != 7) return null;
  final days = <WorkRange?>[
    for (final d in v)
      (d is Map && _time.hasMatch('${d['open']}') && _time.hasMatch('${d['close']}'))
          ? WorkRange('${d['open']}', '${d['close']}')
          : null,
  ];
  return days.any((d) => d != null) ? days : null;
}

int _min(String s) {
  final p = s.split(':');
  return int.parse(p[0]) * 60 + int.parse(p[1]);
}

/// Tashkent wall clock (UTC+5, no DST): weekday Monday = 0, minutes since midnight.
({int day, int min}) _tashkentNow(DateTime now) {
  final t = now.toUtc().add(const Duration(hours: 5));
  return (day: t.weekday - 1, min: t.hour * 60 + t.minute);
}

int todayIndex([DateTime? now]) => _tashkentNow(now ?? DateTime.now()).day;

class OpenStatus {
  final bool open;
  /// open: closing time (null = round the clock); closed: next opening (null = never).
  final String? at;
  /// closed only: 0 = today, 1 = tomorrow, ...
  final int inDays;
  const OpenStatus(this.open, this.at, [this.inDays = 0]);
}

OpenStatus openStatus(WorkHours hours, [DateTime? now]) {
  final n = _tashkentNow(now ?? DateTime.now());
  final prev = hours[(n.day + 6) % 7];
  if (prev != null && !prev.is24h && _min(prev.close) < _min(prev.open) && n.min < _min(prev.close)) {
    return OpenStatus(true, prev.close);
  }
  final today = hours[n.day];
  if (today != null) {
    if (today.is24h) return const OpenStatus(true, null);
    final o = _min(today.open), c = _min(today.close);
    final isOpen = c > o ? (n.min >= o && n.min < c) : n.min >= o;
    if (isOpen) return OpenStatus(true, today.close);
    if (n.min < o) return OpenStatus(false, today.open, 0);
  }
  for (var i = 1; i <= 7; i++) {
    final d = hours[(n.day + i) % 7];
    if (d != null) return OpenStatus(false, d.open, i);
  }
  return const OpenStatus(false, null);
}

/// "Open until 18:00" / "Closed · opens tomorrow at 09:00".
String statusText(OpenStatus s, String lang, [DateTime? now]) {
  final ru = lang == 'ru';
  if (s.open) {
    if (s.at == null) return ru ? 'Открыто круглосуточно' : 'Hozir ochiq · 24 soat';
    final at = s.at == '24:00' ? '00:00' : s.at;
    return ru ? 'Открыто до $at' : 'Hozir ochiq · $at gacha';
  }
  if (s.at == null) return ru ? 'Закрыто' : 'Yopiq';
  if (s.inDays == 0) return ru ? 'Закрыто · откроется в ${s.at}' : 'Yopiq · ${s.at} da ochiladi';
  if (s.inDays == 1) return ru ? 'Закрыто · откроется завтра в ${s.at}' : 'Yopiq · ertaga ${s.at} da ochiladi';
  final day = (todayIndex(now) + s.inDays) % 7;
  return ru
      ? 'Закрыто · откроется ${_ruOnDay[day]} в ${s.at}'
      : 'Yopiq · ${dayNamesUz[day].toLowerCase()} ${s.at} da ochiladi';
}

/// "09:00 – 18:00" / "24 soat" / "Dam olish" for one day.
String dayText(WorkRange? d, String lang) {
  if (d == null) return lang == 'ru' ? 'Выходной' : 'Dam olish';
  if (d.is24h) return lang == 'ru' ? 'Круглосуточно' : '24 soat';
  return '${d.open} – ${d.close == '24:00' ? '00:00' : d.close}';
}
