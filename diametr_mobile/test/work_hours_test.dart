import 'package:flutter_test/flutter_test.dart';
import 'package:stroymarket/core/utils/work_hours.dart';

/// Tashkent wall time (UTC+5) as a UTC instant. 2026-10-05 is a Monday.
DateTime tk(int day, int h, int m) => DateTime.utc(2026, 10, 5 + day, h, m).subtract(const Duration(hours: 5));

void main() {
  const std = WorkRange('09:00', '18:00');
  final WorkHours week = [std, std, std, std, std, const WorkRange('20:00', '02:00'), null];

  test('open inside the range, closed before/after', () {
    expect(openStatus(week, tk(0, 10, 0)).open, isTrue);
    expect(openStatus(week, tk(0, 10, 0)).at, '18:00');
    final before = openStatus(week, tk(0, 8, 30));
    expect(before.open, isFalse);
    expect(before.at, '09:00');
    expect(before.inDays, 0);
    final after = openStatus(week, tk(0, 18, 0));
    expect(after.open, isFalse);
    expect(after.inDays, 1);
  });

  test('works past midnight from the day before', () {
    expect(openStatus(week, tk(5, 23, 0)).open, isTrue); // Saturday 23:00
    final sunNight = openStatus(week, tk(6, 1, 30)); // Sunday 01:30, Saturday shift
    expect(sunNight.open, isTrue);
    expect(sunNight.at, '02:00');
    final sunDay = openStatus(week, tk(6, 12, 0)); // Sunday off → Monday 09:00
    expect(sunDay.open, isFalse);
    expect(sunDay.inDays, 1);
    expect(statusText(sunDay, 'uz', tk(6, 12, 0)), 'Yopiq · ertaga 09:00 da ochiladi');
  });

  test('round the clock and texts', () {
    final all = List<WorkRange?>.filled(7, const WorkRange('00:00', '24:00'));
    final s = openStatus(all, tk(2, 3, 0));
    expect(s.open, isTrue);
    expect(statusText(s, 'ru'), 'Открыто круглосуточно');
    expect(dayText(null, 'uz'), 'Dam olish');
    expect(dayText(const WorkRange('10:00', '24:00'), 'ru'), '10:00 – 00:00');
  });

  test('parse rejects malformed data', () {
    expect(parseWorkHours(null), isNull);
    expect(parseWorkHours([1, 2]), isNull);
    expect(parseWorkHours(List.filled(7, null)), isNull);
    final p = parseWorkHours([{'open': '09:00', 'close': '18:00'}, {'open': 'x', 'close': '1'}, null, null, null, null, null]);
    expect(p![0]!.close, '18:00');
    expect(p[1], isNull);
  });
}
