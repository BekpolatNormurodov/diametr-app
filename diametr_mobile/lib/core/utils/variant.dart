import 'package:stroymarket/core/utils/price.dart';

const Map<String, String> _named = {
  'quot': '"', 'apos': "'", 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&',
};

/// Plain text from catalogue text that may carry HTML entities: the
/// dashboard's auto-translate used to save them ("jo&#39;mrakli").
String decodeEntities(Object? value) {
  final String s = value?.toString() ?? '';
  if (!s.contains('&')) return s;
  return s
      .replaceAllMapped(RegExp(r'&#(\d+);'),
          (m) => String.fromCharCode(int.parse(m[1]!)))
      .replaceAllMapped(RegExp(r'&#x([0-9a-fA-F]+);'),
          (m) => String.fromCharCode(int.parse(m[1]!, radix: 16)))
      .replaceAllMapped(RegExp(r'&(quot|apos|lt|gt|nbsp|amp);'),
          (m) => _named[m[1]]!);
}

String? _text(Object? x) {
  if (x == null) return null;
  final String t = decodeEntities(x).trim();
  return (t.isEmpty || t == 'null') ? null : t;
}

/// Display label of a variant (product item): its own name in [lang], else
/// "value unit · size · color" — same rule as the website's variantLabelOf.
String? variantLabel(dynamic v, [String lang = 'uz']) {
  if (v is! Map) return null;
  final String? named = lang == 'ru'
      ? _text(v['name_ru']) ?? _text(v['name_uz']) ?? _text(v['name'])
      : _text(v['name_uz']) ?? _text(v['name_ru']) ?? _text(v['name']);
  if (named != null) return named;
  final List<String> parts = [];
  final String? value = _text(v['value']);
  if (value != null) {
    final unit = v['unit_type'];
    final String? sym = unit is Map ? _text(unit['symbol']) : null;
    parts.add(sym != null ? '$value $sym' : value);
  }
  final String? size = _text(v['size']);
  if (size != null) parts.add(size);
  final String? color = _text(v['color']);
  if (color != null && !color.startsWith('#')) parts.add(color);
  return parts.isEmpty ? null : parts.join(' · ');
}

/// Shop id -> that shop's cheapest in-stock stock row of [variant] (a product
/// item from GET /product/:id, which carries its live shop_products).
Map<int, Map> variantShopOffers(dynamic variant) {
  final Map<int, Map> out = {};
  final sps = variant is Map ? variant['shop_products'] : null;
  if (sps is! List) return out;
  for (final sp in sps) {
    if (sp is! Map) continue;
    final shop = sp['shop'];
    final int? shopId = int.tryParse(
        '${sp['shop_id'] ?? (shop is Map ? shop['id'] : '')}');
    final num count = (sp['count'] as num?) ?? 0;
    final num? price = effectivePrice(sp['price'], sp['bonus_price']);
    if (shopId == null || count <= 0 || price == null) continue;
    final Map? cur = out[shopId];
    if (cur == null || price < effectivePrice(cur['price'], cur['bonus_price'])!) {
      out[shopId] = sp;
    }
  }
  return out;
}
