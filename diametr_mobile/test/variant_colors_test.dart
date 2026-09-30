import 'package:flutter_test/flutter_test.dart';
import 'package:stroymarket/core/utils/variant.dart';

void main() {
  List<String> uz(List<Object?> t) => colorsInText(t).map((c) => c.uz).toList();

  test('colours are read from variant text (same results as the website)', () {
    expect(uz(['CERUTTIspa CR7003 stol usti lavabosi, oq, oval, jo&#39;mrakli',
        'Раковина накладная CERUTTIspa CR7003, белая, овальная']), ['Oq']);
    expect(uz(['Kulrang']), ['Kulrang']);
    expect(uz(["Ko'k"]), ["Ko'k"]);
    expect(uz(['Qora-oq kabel']), ['Qora', 'Oq']);
    expect(uz(['Oqtepa krug', 'Roca Dama Senso Compact lavabosi', 'Eman toq']), isEmpty);
  });

  test('a picked hex colour gets the closest name', () {
    expect(nearestNamedColor(0xFFF97316)!.uz, "To'q sariq");
    expect(nearestNamedColor(0xFFFB923C)!.uz, "To'q sariq");
    expect(nearestNamedColor(0xFFFDE047)!.uz, 'Sariq');
    expect(nearestNamedColor(0xFFF5F5F5)!.uz, 'Oq');
  });
}
