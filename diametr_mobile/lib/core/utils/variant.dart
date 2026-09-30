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

/// A display colour: swatch value + its name in both languages.
class NamedColor {
  final int argb;
  final String uz;
  final String ru;
  const NamedColor(this.argb, this.uz, this.ru);
}

// Same palette/words as the website's utils/colors.ts — keep in sync.
const List<(NamedColor, List<String>)> _palette = [
  (NamedColor(0xFFFFFFFF, 'Oq', 'Белый'), ['oq', 'oppoq', 'белый', 'белая', 'белое', 'белые', 'белого', 'белой', 'white']),
  (NamedColor(0xFF111827, 'Qora', 'Чёрный'), ['qora', 'чёрный', 'черный', 'чёрная', 'черная', 'чёрное', 'черное', 'чёрные', 'черные', 'black']),
  (NamedColor(0xFF9CA3AF, 'Kulrang', 'Серый'), ['kulrang', 'серый', 'серая', 'серое', 'серые', 'grey', 'gray']),
  (NamedColor(0xFFDC2626, 'Qizil', 'Красный'), ['qizil', 'красный', 'красная', 'красное', 'красные', 'red']),
  (NamedColor(0xFF2563EB, "Ko'k", 'Синий'), ["ko'k", 'kok', 'moviy', 'синий', 'синяя', 'синее', 'синие', 'blue']),
  (NamedColor(0xFF60A5FA, 'Havorang', 'Голубой'), ['havorang', 'голубой', 'голубая', 'голубое', 'голубые']),
  (NamedColor(0xFF16A34A, 'Yashil', 'Зелёный'), ['yashil', 'зелёный', 'зеленый', 'зелёная', 'зеленая', 'зелёное', 'зеленое', 'green']),
  (NamedColor(0xFFFACC15, 'Sariq', 'Жёлтый'), ['sariq', 'жёлтый', 'желтый', 'жёлтая', 'желтая', 'yellow']),
  (NamedColor(0xFFF97316, "To'q sariq", 'Оранжевый'), ['apelsinrang', 'оранжевый', 'оранжевая', 'orange']),
  (NamedColor(0xFF92400E, 'Jigarrang', 'Коричневый'), ['jigarrang', "qo'ng'ir", 'коричневый', 'коричневая', 'brown']),
  (NamedColor(0xFFD6C7A1, 'Bej', 'Бежевый'), ['bej', 'бежевый', 'бежевая', 'beige']),
  (NamedColor(0xFFC0C0C0, 'Kumushrang', 'Серебристый'), ['kumush', 'kumushrang', 'серебристый', 'серебристая', 'silver']),
  (NamedColor(0xFFD4AF37, 'Oltinrang', 'Золотой'), ['oltin', 'oltinrang', 'золотой', 'золотая', 'золотистый', 'gold']),
  (NamedColor(0xFFEC4899, 'Pushti', 'Розовый'), ['pushti', 'розовый', 'розовая', 'pink']),
  (NamedColor(0xFF7C3AED, 'Binafsha', 'Фиолетовый'), ['binafsha', 'binafsharang', 'фиолетовый', 'фиолетовая', 'purple']),
];

final Map<String, NamedColor> _colorByWord = {
  for (final e in _palette)
    for (final w in e.$2) w: e.$1,
};

/// Colours named in the given texts, in order of appearance (at most 4).
List<NamedColor> colorsInText(Iterable<Object?> texts) {
  final List<NamedColor> out = [];
  for (final t in texts) {
    if (t == null) continue;
    final words = decodeEntities(t)
        .toLowerCase()
        .replaceAll(RegExp(r"[ʻʼ’‘`´]"), "'")
        .split(RegExp(r"[^a-zа-яёўқғҳ']+"));
    for (final raw in words) {
      final c = _colorByWord[raw.replaceAll(RegExp(r"^'+|'+$"), '')];
      if (c != null && !out.contains(c)) out.add(c);
    }
  }
  return out.length > 4 ? out.sublist(0, 4) : out;
}

/// Closest palette colour to a picked hex colour ("redmean" distance).
NamedColor? nearestNamedColor(int argb) {
  final int r0 = (argb >> 16) & 255, g0 = (argb >> 8) & 255, b0 = argb & 255;
  NamedColor? best;
  double bestD = double.infinity;
  for (final e in _palette) {
    final int k = e.$1.argb;
    final int r = (k >> 16) & 255, g = (k >> 8) & 255, b = k & 255;
    final double rm = (r + r0) / 2;
    final double d = (2 + rm / 256) * (r - r0) * (r - r0) +
        4.0 * (g - g0) * (g - g0) +
        (2 + (255 - rm) / 256) * (b - b0) * (b - b0);
    if (d < bestD) {
      bestD = d;
      best = e.$1;
    }
  }
  return best;
}
