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

  @override
  void initState() {
    _variantId = widget.itemId;
    _load();
    super.initState();
  }

  Map? _selectedVariant(ProductState s) {
    if (_variantId == null || s is! ProductSuccessState || s.data is! Map) {
      return null;
    }
    final items = (s.data as Map)["items"];
    if (items is! List) return null;
    for (final it in items) {
      if (it is Map && '${it["id"]}' == '$_variantId') return it;
    }
    return null;
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

  ProductScreenBody<Widget>() {
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
            final String? desc = state.data["desc"]?.toString();
            final bool hasDesc =
                desc != null && desc.isNotEmpty && desc != 'null';
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
                      GestureDetector(
                        child: Row(
                          children: [
                            Image.asset(
                              'assets/icons/home.png',
                              scale: 3.sp,
                              color: context.tIconTint,
                            ),
                            SizedBox(width: 10.w),
                            Text(
                              'Stroymarket',
                              style: TextStyle(
                                color: context.tText,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (hasDesc) ...[
                        SizedBox(height: 16.h),
                        Text(
                          desc,
                          style: TextStyle(
                            color: context.tSub,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
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
                                  onTap: () =>
                                      setState(() => _variantId = null)),
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
                                  }),
                                ),
                          ],
                        ),
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
            final Map? selVar =
                _selectedVariant(context.watch<ProductBloc>().state);
            final Map<int, Map> offers =
                selVar != null ? variantShopOffers(selVar) : const {};
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
                          "Tovar mavjud do'konlar",
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
                ShopByProductScreenBody(list, offers),
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

  /// [offers]: shop id -> the chosen variant's stock row there (empty = none chosen).
  Widget ShopByProductScreenBody(List data, Map<int, Map> offers) {
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
                if (offer != null) "shop_product_id": offer["id"],
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
                        child: CachedNetworkImage(
                          fit: BoxFit.cover,
                          memCacheWidth: 600,
                          imageUrl: Endpoints.img('shops', data[index]["image"]),
                          placeholder: (ctx, url) => Shimmer.fromColors(
                            baseColor: ctx.tInput,
                            highlightColor: ctx.tDivider,
                            child: Container(color: ctx.tInput),
                          ),
                          errorWidget: (context, url, error) =>
                              const AppImagePlaceholder(),
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
                                '${offerPrice.toString().toMoney()} so\'m',
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
