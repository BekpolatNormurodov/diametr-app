import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/core/utils/price.dart';
import 'package:stroymarket/core/utils/variant.dart';
import 'package:stroymarket/manager/5_product_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';

import 'package:stroymarket/bloc/regionSelected/regionSelected_bloc.dart';

import '../../bloc/product/product_bloc.dart';
import '../../bloc/product/product_state.dart';
import '../../bloc/shopbyProduct/shopbyProduct_bloc.dart';
import '../../bloc/shopbyProduct/shopbyProduct_state.dart';
import '../../export_files.dart';

// ignore: must_be_immutable
class ProductScreen extends StatefulWidget {
  String? name;
  String? product_id;
  /// Variant to preselect, e.g. the size tapped in search results.
  int? itemId;
  ProductScreen(
      {super.key, required this.name, required this.product_id, this.itemId});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();
  final GlobalKey<FormState> formKey1 = GlobalKey();
  TextEditingController controller = TextEditingController();
  TextEditingController controller1 = TextEditingController();

  List<String> images = [
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/white-disposable-lighter-rXgg90zA820',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/white-disposable-lighter-rXgg90zA820',
    'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
    'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
  ];

  List<String> titles = [
    'Kalit',
    "Bolg'a",
    'Zajigalka',
    "Bolg'a",
    'Kalit',
    'Kalit',
    "Bolg'a",
    'Zajigalka',
    "Bolg'a",
    'Kalit',
  ];

  List<Map> products = [
    {"name": '4 ta tishlik Kalit', "price": "400 000 so'm"},
    {"name": 'Qulf uchun kalit', "price": "90 000 so'm"},
    {"name": 'Darvoza kaliti', "price": "250 000 so'm"},
    {"name": '4 ta tishlik Kalit', "price": "400 000 so'm"},
  ];

  String dropdownValue = 'Turlari';
  List<String> items = [
    'Turlari',
    'Oq - 3kg - metal idishli',
    'Qizil - 4kg - yog\'och idishli',
    'Yashil - 3kg - plastik idishli',
    'Sariq - 7kg - shisha idishli',
  ];
  int itemCount = 1;

  /// Chosen variant (null = all). Filters the shop list to shops that have it
  /// in stock and shows its price there.
  int? _variantId;

  /// Long descriptions start collapsed.
  bool _descOpen = false;

  @override
  void initState() {
    _variantId = widget.itemId;
    _load();
    super.initState();
  }

  Map? _selectedVariant(ProductState s) {
    if (s is! ProductSuccessState || s.data is! Map) return null;
    final items = (s.data as Map)["items"];
    if (items is! List) return null;
    // A one-type product: that type is the selection
    if (items.length == 1 && items.first is Map) return items.first as Map;
    if (_variantId == null) return null;
    for (final it in items) {
      if (it is Map && '${it["id"]}' == '$_variantId') return it;
    }
    return null;
  }

  /// Shop id -> that shop's cheapest in-stock row over ALL variants.
  Map<int, Map> _allOffers(List items) {
    final Map<int, Map> out = {};
    for (final it in items) {
      variantShopOffers(it).forEach((shopId, row) {
        final Map? cur = out[shopId];
        if (cur == null ||
            effectivePrice(row['price'], row['bonus_price'])! <
                effectivePrice(cur['price'], cur['bonus_price'])!) {
          out[shopId] = row;
        }
      });
    }
    return out;
  }

  num? _minPrice(Map<int, Map> offers) {
    num? min;
    for (final r in offers.values) {
      final num? p = effectivePrice(r['price'], r['bonus_price']);
      if (p != null && (min == null || p < min)) min = p;
    }
    return min;
  }

  /// The dashboard's colour picker stores hex ("#F97316").
  Color? _hexColor(Object? v) {
    final m = RegExp(r'^#([0-9a-fA-F]{6})$').firstMatch('${v ?? ''}'.trim());
    return m == null ? null : Color(int.parse('FF${m[1]}', radix: 16));
  }

  Widget _descriptionCard(String text) {
    final bool long = text.length > 280 || '\n'.allMatches(text).length > 5;
    final bool clipped = long && !_descOpen;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: context.tDivider.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('description_title'.tr(),
              style: TextStyle(
                  color: context.tText,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 6.h),
          Text(
            text,
            maxLines: clipped ? 5 : null,
            overflow: clipped ? TextOverflow.ellipsis : null,
            style: TextStyle(color: context.tSub, fontSize: 13.sp, height: 1.45),
          ),
          if (long)
            GestureDetector(
              onTap: () => setState(() => _descOpen = !_descOpen),
              child: Padding(
                padding: EdgeInsets.only(top: 6.h),
                child: Text(
                  _descOpen ? 'read_less'.tr() : 'read_more'.tr(),
                  style: TextStyle(
                      color: AppConstant.primaryColor,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _specsTable(List<MapEntry<String, Widget>> rows) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: context.tDivider.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 9.h),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.vertical(top: Radius.circular(14.r)),
            ),
            child: Text('characteristics'.tr().toUpperCase(),
                style: TextStyle(
                    color: context.tSub,
                    fontSize: 11.sp,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4)),
          ),
          for (int i = 0; i < rows.length; i++) ...[
            if (i > 0)
              Divider(height: 1, thickness: 0.5, color: context.tDivider),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
              child: Row(
                children: [
                  Text(rows[i].key,
                      style: TextStyle(color: context.tSub, fontSize: 13.sp)),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Align(
                        alignment: Alignment.centerRight, child: rows[i].value),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _variantChip(String label,
      {required bool selected, bool dimmed = false, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 7.h),
        decoration: BoxDecoration(
          color: selected ? AppConstant.primaryColor : context.tInput,
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? Colors.white
                : dimmed
                    ? context.tSub.withValues(alpha: 0.55)
                    : context.tText,
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
            decoration: dimmed && !selected ? TextDecoration.lineThrough : null,
          ),
        ),
      ),
    );
  }

  /// Loads the product and the shops selling it (on open and on pull-to-refresh).
  Future<void> _load() => Future.wait([
        ProductManager.getById(context, ProductId: widget.product_id ?? ""),
        ShopManager.getByProductId(context,
            productId: widget.product_id ?? ""),
      ]);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        widget.name ?? "",
        () {
          Navigator.of(context).pop();
        },
        'assets/icons/chevron-left.png',
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppConstant.primaryColor,
          backgroundColor: context.tCard,
          onRefresh: _load,
          child: ProductScreenBody(),
        ),
      ),
    );
  }

  Widget ProductScreenBody() {
    return ListView(
      shrinkWrap: true,
      scrollDirection: Axis.vertical,
      children: [
        BlocBuilder<ProductBloc, ProductState>(builder: (context, state) {
          if (state is ProductSuccessState) {
            if (state.data == null) {
              return EmptyState(
                height: 480.h,
                icon: Iconsax.box_remove,
                title: "Mahsulot mavjud emas",
                subtitle:
                    "Bu mahsulot olib tashlangan yoki vaqtincha sotuvda yo'q.",
              );
            }
            // Image priority (ideal): variant with own image → product image →
            // category image → nothing (placeholder). A variant image is more
            // specific than a generic product photo (e.g. "Xavfsizlik tizimlari"
            // has a store-interior shot while "Seyf" would want a safe).
            String? _pick(String kind, dynamic v) {
              if (v == null) return null;
              final s = v.toString();
              if (s.isEmpty || s == 'null') return null;
              return Endpoints.img(kind, s);
            }
            final List itemsList = (state.data["items"] is List)
                ? state.data["items"] as List
                : const [];
            // 0. the chosen variant's own image
            final Map? selVar = _selectedVariant(state);
            String? resolvedImageUrl = _pick('product-items', selVar?["image"]);
            // 1. any variant that has an image
            if (resolvedImageUrl == null) {
              for (final it in itemsList) {
                final u = _pick('product-items', it is Map ? it["image"] : null);
                if (u != null) { resolvedImageUrl = u; break; }
              }
            }
            final String lang = context.locale.languageCode;
            // 2. product's own image
            resolvedImageUrl ??= _pick('products', state.data["image"]);
            // 3. category image
            final catImg = (state.data["category"] is Map)
                ? (state.data["category"] as Map)["image"]
                : null;
            resolvedImageUrl ??= _pick('categories', catImg);
            String textIn(Map m, String key) => decodeEntities(
                    (lang == 'ru' ? m['${key}_ru'] ?? m[key] : m[key] ?? m['${key}_ru']) ??
                        '')
                .trim();
            final String desc = textIn(state.data as Map, 'desc');
            final bool hasDesc = desc.isNotEmpty && desc != 'null';
            final String? selTitle = selVar != null ? variantLabel(selVar, lang) : null;
            final String selDesc = selVar != null ? textIn(selVar, 'desc') : '';
            final Map? cat = state.data["category"] is Map
                ? state.data["category"] as Map
                : null;
            final String catName = cat == null
                ? ''
                : (variantLabel({'name_uz': cat['name_uz'], 'name_ru': cat['name_ru'], 'name': cat['name']}, lang) ?? '');
            final Map<int, Map> summaryOffers = selVar != null
                ? variantShopOffers(selVar)
                : _allOffers(itemsList);
            final num? minP = _minPrice(summaryOffers);
            final int shopCount = summaryOffers.length;
            final List<MapEntry<String, Widget>> specRows = [];
            if (selVar != null) {
              Widget val(String t) => Text(t,
                  textAlign: TextAlign.right,
                  style: TextStyle(
                      color: context.tText,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600));
              // Colour: the one picked in the dashboard (hex, named by the
              // closest palette colour), else the ones its name/description
              // mention ("oq", "белая") — most variants only say it in text.
              final String color = '${selVar['color'] ?? ''}'.trim();
              final Color? picked = _hexColor(color);
              String nameOf(NamedColor? c) =>
                  c == null ? '' : (lang == 'ru' ? c.ru : c.uz);
              final List<(Color?, String)> colors = picked != null
                  ? [(picked, nameOf(nearestNamedColor(picked.toARGB32())))]
                  : (color.isNotEmpty && color != 'null')
                      ? [(null, color)]
                      : [
                          for (final c in colorsInText([
                            selVar['name_uz'],
                            selVar['name_ru'],
                            selVar['name'],
                            selVar['desc'],
                            selVar['desc_ru'],
                          ]))
                            (Color(c.argb), nameOf(c))
                        ];
              if (colors.isNotEmpty) {
                specRows.add(MapEntry(
                    'spec_color'.tr(),
                    Wrap(
                      alignment: WrapAlignment.end,
                      spacing: 10.w,
                      runSpacing: 4.h,
                      children: [
                        for (final c in colors)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (c.$1 != null) ...[
                                Container(
                                  width: 18.w,
                                  height: 18.w,
                                  decoration: BoxDecoration(
                                    color: c.$1,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                        color: Colors.black
                                            .withValues(alpha: 0.15)),
                                  ),
                                ),
                                SizedBox(width: 6.w),
                              ],
                              if (c.$2.isNotEmpty) val(c.$2),
                            ],
                          ),
                      ],
                    )));
              }
              final String size = '${selVar['size'] ?? ''}'.trim();
              if (size.isNotEmpty && size != 'null') {
                specRows.add(MapEntry('spec_size'.tr(), val(size)));
              }
              final Map? unit =
                  selVar['unit_type'] is Map ? selVar['unit_type'] as Map : null;
              final String value = '${selVar['value'] ?? ''}'.trim();
              if (value.isNotEmpty && value != 'null') {
                specRows.add(MapEntry('spec_amount'.tr(),
                    val('$value ${unit?['symbol'] ?? ''}'.trim())));
              } else if (unit != null) {
                final String unitName = variantLabel(
                        {'name_uz': unit['name_uz'], 'name_ru': unit['name_ru'], 'name': unit['name'] ?? unit['symbol']},
                        lang) ??
                    '';
                if (unitName.isNotEmpty) {
                  specRows.add(MapEntry('spec_unit'.tr(), val(unitName)));
                }
              }
              if (catName.isNotEmpty) {
                specRows.add(MapEntry('spec_section'.tr(), val(catName)));
              }
            }
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 220.h,
                  width: 1.sw,
                  child: resolvedImageUrl != null
                      ? CachedNetworkImage(
                          fit: BoxFit.cover,
                          imageUrl: resolvedImageUrl,
                          placeholder: (ctx, url) => Shimmer.fromColors(
                            baseColor: ctx.tInput,
                            highlightColor: ctx.tDivider,
                            child: Container(color: ctx.tInput),
                          ),
                          errorWidget: (ctx, url, error) =>
                              const AppImagePlaceholder(),
                        )
                      : const AppImagePlaceholder(),
                ),
                Padding(
                  padding: EdgeInsets.all(16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (catName.isNotEmpty)
                        Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 10.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: AppConstant.primaryColor
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                          child: Text(catName,
                              style: TextStyle(
                                  color: AppConstant.primaryColor,
                                  fontSize: 12.sp,
                                  fontWeight: FontWeight.w600)),
                        ),
                      // Price summary: the chosen type, else the whole product
                      if (minP != null) ...[
                        SizedBox(height: 10.h),
                        Text(
                          'price_from'.tr(args: [minP.toString().toMoney()]),
                          style: TextStyle(
                            color: AppConstant.primaryColor,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                      if (itemsList.isNotEmpty) ...[
                        SizedBox(height: 4.h),
                        Text(
                          shopCount > 0
                              ? 'in_n_shops'.tr(args: ['$shopCount'])
                              : 'no_shops'.tr(),
                          style: TextStyle(color: context.tSub, fontSize: 12.sp),
                        ),
                      ],
                      if (hasDesc) ...[
                        SizedBox(height: 14.h),
                        _descriptionCard(desc),
                      ],
                      // Every size/type of the product; picking one narrows
                      // the shops below to those that stock it.
                      if (itemsList.isNotEmpty) ...[
                        SizedBox(height: 16.h),
                        Text(
                          'variants_title'.tr(),
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(height: 8.h),
                        Wrap(
                          spacing: 8.w,
                          runSpacing: 8.h,
                          children: [
                            if (itemsList.length > 1)
                              _variantChip('variant_all'.tr(),
                                  selected: selVar == null,
                                  onTap: () => setState(() {
                                        _variantId = null;
                                        _descOpen = false;
                                      })),
                            for (final it in itemsList)
                              if (it is Map)
                                _variantChip(
                                  variantLabel(it, lang) ?? '—',
                                  selected: selVar != null &&
                                      '${selVar["id"]}' == '${it["id"]}',
                                  dimmed: variantShopOffers(it).isEmpty,
                                  onTap: () => setState(() {
                                    final int? id =
                                        int.tryParse('${it["id"]}');
                                    // Tapping the chosen one again = all
                                    _variantId = (_variantId == id &&
                                            itemsList.length > 1)
                                        ? null
                                        : id;
                                    _descOpen = false;
                                  }),
                                ),
                          ],
                        ),
                        // The chosen type on its own: name, characteristics,
                        // description
                        if (selTitle != null) ...[
                          SizedBox(height: 14.h),
                          Text(
                            selTitle,
                            style: TextStyle(
                              color: context.tText,
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (specRows.isNotEmpty) ...[
                            SizedBox(height: 10.h),
                            _specsTable(specRows),
                          ],
                          if (selDesc.isNotEmpty) ...[
                            SizedBox(height: 10.h),
                            _descriptionCard(selDesc),
                          ],
                        ],
                      ],
                    ],
                  ),
                ),
              ],
            );
          } else if (state is ProductWaitingState) {
            return const ProductDetailSkeleton();
          } else if (state is ProductErrorState) {
            // GET /product/:id is 404 for an archived product (e.g. opened from
            // favorites) — say so instead of leaving the top of the page blank.
            return EmptyState(
              height: 480.h,
              icon: Iconsax.box_remove,
              title: "Mahsulot topilmadi",
              subtitle:
                  "Mahsulot olib tashlangan bo'lishi mumkin. Qayta yuklash uchun pastga torting.",
            );
          } else {
            return SizedBox();
          }
        }),

        Divider(thickness: 0.2, color: context.tDivider),
        SizedBox(height: 8.h),
        BlocBuilder<ShopByProductBloc, ShopByProductState>(
            builder: (context, state) {
          if (state is ShopByProductSuccessState) {
            // A chosen variant narrows the list to shops that have it in stock.
            final ProductState pSt = context.watch<ProductBloc>().state;
            final Map? selVar = _selectedVariant(pSt);
            final List allItems = pSt is ProductSuccessState &&
                    pSt.data is Map &&
                    (pSt.data as Map)['items'] is List
                ? (pSt.data as Map)['items'] as List
                : const [];
            // Chosen type: its row per shop. No type chosen: each shop's
            // cheapest row over all types (shown as "... dan").
            final Map<int, Map> offers = selVar != null
                ? variantShopOffers(selVar)
                : _allOffers(allItems);
            final List list = selVar == null
                ? (state.data ?? [])
                : (state.data ?? [])
                    .where((s) =>
                        s is Map &&
                        offers.containsKey(int.tryParse('${s["id"]}')))
                    .toList();
            if (list.isEmpty && selVar != null) {
              return Padding(
                padding: EdgeInsets.symmetric(vertical: 24.h),
                child: EmptyState(
                  height: 280.h,
                  icon: Iconsax.shop_remove,
                  title: 'no_shops'.tr(),
                  subtitle: 'variant_no_shops_sub'.tr(),
                ),
              );
            }
            if (list.isEmpty) {
              // Three different reasons a product has no shops — say which one:
              //  1) no variant yet  -> its types are still being added
              //  2) has variants, a region filter is on -> not sold in that region
              //  3) has variants, no filter -> no shop stocks it yet
              return BlocBuilder<ProductBloc, ProductState>(
                builder: (context, pState) {
                  // Which message is right depends on the product; don't
                  // flash a wrong one while it is still loading.
                  if (pState is ProductWaitingState) return const SizedBox();
                  // The product itself is gone/unreachable: the message above
                  // already says so, don't add a contradictory "no shops" one.
                  if (pState is ProductErrorState) return const SizedBox();
                  final bool? hasVariants = pState is ProductSuccessState &&
                          pState.data != null
                      ? ((pState.data["items"] as List?)?.isNotEmpty ?? false)
                      : null;
                  final bool regionFiltered =
                      context.read<RegionSelectedBloc>().state.isNotEmpty;
                  final String title;
                  final String subtitle;
                  final IconData icon;
                  if (hasVariants == false) {
                    icon = Iconsax.clock;
                    title = 'coming_soon'.tr();
                    subtitle = 'coming_soon_sub'.tr();
                  } else if (regionFiltered) {
                    icon = Iconsax.location;
                    title = 'no_shops_region'.tr();
                    subtitle = 'no_shops_region_sub'.tr();
                  } else {
                    icon = Iconsax.shop_remove;
                    title = 'no_shops'.tr();
                    subtitle = 'no_shops_sub'.tr();
                  }
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.h),
                    child: EmptyState(
                      height: 280.h,
                      icon: icon,
                      title: title,
                      subtitle: subtitle,
                    ),
                  );
                },
              );
            }
            // Cheapest first; the first gets "Eng arzon" when there is a choice
            num priceAt(dynamic shop) {
              final Map? o = offers[int.tryParse('${shop is Map ? shop["id"] : ''}')];
              return o == null
                  ? double.infinity
                  : (effectivePrice(o['price'], o['bonus_price']) ?? double.infinity);
            }
            final List sorted = [
              for (final e in (List.of(list).asMap().entries.toList()
                ..sort((a, b) {
                  final c = priceAt(a.value).compareTo(priceAt(b.value));
                  return c != 0 ? c : a.key - b.key;
                })))
                e.value
            ];
            final int? cheapestShopId =
                sorted.length > 1 && priceAt(sorted.first).isFinite
                    ? int.tryParse('${sorted.first["id"]}')
                    : null;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Row(
                    children: [
                      Container(
                        width: 32.w,
                        height: 32.w,
                        decoration: BoxDecoration(
                          color: AppConstant.primaryColor
                              .withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Icon(
                          Iconsax.shop,
                          color: AppConstant.primaryColor,
                          size: 16.sp,
                        ),
                      ),
                      SizedBox(width: 10.w),
                      Expanded(
                        child: Text(
                          'shops_with_product'.tr(),
                          style: TextStyle(
                            color: context.tText,
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 8.w, vertical: 2.h),
                        decoration: BoxDecoration(
                          color: AppConstant.primaryColor
                              .withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Text(
                          '${list.length}',
                          style: TextStyle(
                            color: AppConstant.primaryColor,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 14.h),
                ShopByProductScreenBody(sorted, offers,
                    fromPrice: selVar == null, cheapestShopId: cheapestShopId),
              ],
            );
          } else if (state is ShopByProductWaitingState) {
            return const ShopListSkeleton();
          } else {
            return SizedBox();
          }
        }),

        SizedBox(height: 16.h),
      ],
    );
  }

  customContainer(double width, Widget child, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        width: width.w,
        height: width.h,
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(10.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(
                  alpha: context.isDark ? 0.18 : 0.06),
              blurRadius: 5,
              spreadRadius: 1,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: child,
      ),
    );
  }

  /// [offers]: shop id -> that shop's row for the chosen variant, or its
  /// cheapest row over all variants when [fromPrice] (shown as "... dan").
  Widget ShopByProductScreenBody(List data, Map<int, Map> offers,
      {bool fromPrice = false, int? cheapestShopId}) {
    return SizedBox(
      width: 1.sw,
      height: 200.h,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: 10.w),
        itemCount: data.length,
        scrollDirection: Axis.horizontal,
        shrinkWrap: true,
        itemBuilder: (context, index) {
          final Map? offer = offers[int.tryParse('${data[index]["id"]}')];
          final num? offerPrice = offer != null
              ? effectivePrice(offer["price"], offer["bonus_price"])
              : null;
          return GestureDetector(
            onTap: () {
              // Open THIS product's variants in that shop. Opening the whole
              // shop page made the customer look for the product again.
              final pState = context.read<ProductBloc>().state;
              final Map? product =
                  pState is ProductSuccessState && pState.data is Map
                      ? pState.data as Map
                      : null;
              Navigator.of(context)
                  .pushNamed(RouteNames.shopProductScreen, arguments: {
                "name": widget.name,
                "product_id": widget.product_id,
                "shop_id": data[index]["id"],
                "image": product?["image"],
                "desc": product?["desc"],
                // Preselect the variant in that shop only when one is chosen
                if (offer != null && !fromPrice) "shop_product_id": offer["id"],
              });
            },
            child: Container(
              margin: EdgeInsets.all(10.w),
              width: 150.w,
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(10.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(
                        alpha: context.isDark ? 0.20 : 0.08),
                    blurRadius: 6,
                    spreadRadius: 1,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Expanded(
                    flex: 6,
                    child: SizedBox(
                      width: MediaQuery.of(context).size.width,
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(10.r),
                          topRight: Radius.circular(10.r),
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CachedNetworkImage(
                              fit: BoxFit.cover,
                              memCacheWidth: 600,
                              imageUrl:
                                  Endpoints.img('shops', data[index]["image"]),
                              placeholder: (ctx, url) => Shimmer.fromColors(
                                baseColor: ctx.tInput,
                                highlightColor: ctx.tDivider,
                                child: Container(color: ctx.tInput),
                              ),
                              errorWidget: (context, url, error) =>
                                  const AppImagePlaceholder(),
                            ),
                            if (cheapestShopId != null &&
                                '${data[index]["id"]}' == '$cheapestShopId')
                              Positioned(
                                top: 6.h,
                                left: 6.w,
                                child: Container(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 7.w, vertical: 3.h),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF059669),
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                  child: Text(
                                    'cheapest'.tr(),
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      width: double.infinity,
                      child: Padding(
                        padding: EdgeInsets.only(left: 10.w),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "${data[index]["name"]}",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: context.tText,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            SizedBox(height: 3.h),
                            Text(
                              data[index]["address"].toString(),
                              maxLines: offerPrice != null ? 1 : 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: context.tSub,
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w300,
                              ),
                            ),
                            if (offerPrice != null)
                              Text(
                                fromPrice
                                    ? 'price_from'.tr(args: [offerPrice.toString().toMoney()])
                                    : '${offerPrice.toString().toMoney()} ${context.locale.languageCode == 'ru' ? 'сум' : "so'm"}',
                                maxLines: 1,
                                style: TextStyle(
                                  color: AppConstant.primaryColor,
                                  fontSize: 12.sp,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
