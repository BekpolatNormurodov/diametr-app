
import '../../bloc/productbyCategory/productbyCategory_bloc.dart';
import '../../bloc/productbyCategory/productbyCategory_state.dart';
import '../../export_files.dart';
import '../../manager/5_product_manager.dart';

// ignore: must_be_immutable
class ProductsScreen extends StatefulWidget {
  final data;
  ProductsScreen({super.key, required this.data});

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

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();

  String _loc(Map item, {String fallback = '—'}) {
    final lang = context.locale.languageCode;
    final v = lang == 'ru' ? item['name_ru'] : item['name_uz'];
    final s = (v ?? item['name'])?.toString().trim() ?? '';
    return s.isEmpty ? fallback : s;
  }

  @override
  void initState() {
    ProductManager.getbyCategoryId(context,
        categoryId: "${widget.data["id"]}");
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final categoryName = widget.data is Map
        ? _loc(widget.data as Map, fallback: 'products'.tr())
        : 'products'.tr();
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey, categoryName, () {
        Navigator.of(context).pop();
      }, 'assets/icons/chevron-left.png',  savatcha: true),
      body: BlocBuilder<ProductByCategoryBloc, ProductByCategoryState>(
          builder: (context, state) {
        if (state is ProductByCategorySuccessState) {
          if (state.data.length == 0) {
            return EmptyState(
              icon: Iconsax.box,
              title: 'products_empty'.tr(),
              subtitle: "Bu bo'limda hozircha mahsulotlar yo'q.",
            );
          }
          // Backend orders by id desc → keep that order (newest first).
          return productsScreenBody((state.data ?? []).toList());
        } else if (state is ProductByCategoryWaitingState) {
          return _buildShimmer();
        } else {
          return EmptyState(
            icon: Iconsax.box,
            title: 'products_empty'.tr(),
            subtitle: "Bu bo'limda hozircha mahsulotlar yo'q.",
          );
        }
      }),
    );
  }

  Widget _buildShimmer() {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 12.h),
      itemCount: 6,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14.h,
        crossAxisSpacing: 14.w,
        childAspectRatio: 0.70,
      ),
      itemBuilder: (_, __) => ClipRRect(
        borderRadius: BorderRadius.circular(18.r),
        child: Container(
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: BorderRadius.circular(18.r),
            boxShadow: [
              BoxShadow(
                color: Colors.black
                    .withValues(alpha: context.isDark ? 0.20 : 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Shimmer.fromColors(
            baseColor: context.tInput,
            highlightColor: context.tDivider,
            period: const Duration(milliseconds: 1100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 6,
                  child: Container(color: context.tInput),
                ),
                Padding(
                  padding: EdgeInsets.fromLTRB(10.w, 10.h, 10.w, 12.h),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 11.h,
                        width: 120.w,
                        decoration: BoxDecoration(
                          color: context.tInput,
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                      ),
                      SizedBox(height: 6.h),
                      Container(
                        height: 10.h,
                        width: 80.w,
                        decoration: BoxDecoration(
                          color: context.tInput,
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                      ),
                      SizedBox(height: 10.h),
                      Container(
                        height: 18.h,
                        width: 70.w,
                        decoration: BoxDecoration(
                          color: context.tInput,
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  productsScreenBody<Widget>(List data) {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 20.h),
      itemCount: data.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14.h,
        crossAxisSpacing: 14.w,
        childAspectRatio: 0.70,
      ),
      itemBuilder: (context, index) {
        final item = data[index] as Map;
        final name = _loc(item);
        final sold = int.tryParse(item['count']?.toString() ?? '') ?? 0;
        final primary = AppConstant.primaryColor;
        final dark = context.isDark;
        final hasImage = item["image"] != null &&
            item["image"].toString().trim().isNotEmpty;
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(18.r),
            splashColor: primary.withValues(alpha: 0.12),
            highlightColor: primary.withValues(alpha: 0.06),
            onTap: () {
              Navigator.of(context).pushNamed('/productScreen', arguments: {
                "product_id": item["id"],
                "name": name,
              });
            },
            child: Ink(
              decoration: BoxDecoration(
                color: context.tCard,
                borderRadius: BorderRadius.circular(18.r),
                boxShadow: [
                  // Soft primary glow underneath
                  BoxShadow(
                    color: (sold > 0 ? primary : const Color(0xFF42A5F5))
                        .withValues(alpha: dark ? 0.22 : 0.14),
                    blurRadius: 18,
                    spreadRadius: -3,
                    offset: const Offset(0, 10),
                  ),
                  // Crisp drop shadow for definition
                  BoxShadow(
                    color: Colors.black.withValues(alpha: dark ? 0.28 : 0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18.r),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Image area with badges ──
                    Expanded(
                      flex: 6,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // Image
                          if (hasImage)
                            CachedNetworkImage(
                              fit: BoxFit.cover,
                              memCacheWidth: 600,
                              imageUrl:
                                  Endpoints.img('products', item["image"]),
                              placeholder: (ctx, _) => Shimmer.fromColors(
                                baseColor: ctx.tInput,
                                highlightColor: ctx.tDivider,
                                child: Container(color: ctx.tInput),
                              ),
                              errorWidget: (_, __, ___) =>
                                  const AppImagePlaceholder(),
                            )
                          else
                            const AppImagePlaceholder(),

                          // Soft white-to-card gradient so image blends into the info panel below.
                          IgnorePointer(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.transparent,
                                    Colors.transparent,
                                    context.tCard.withValues(alpha: 0.55),
                                    context.tCard,
                                  ],
                                  stops: const [0.0, 0.55, 0.85, 1.0],
                                ),
                              ),
                            ),
                          ),

                          // TOP-RIGHT badge
                          Positioned(
                            top: 8.h,
                            right: 8.w,
                            child: sold > 0
                                ? _SoldBadge(sold: sold, primary: primary)
                                : const _NewBadge(),
                          ),
                        ],
                      ),
                    ),

                    // ── Bottom info panel (fixed flex so all image areas
                    // have identical heights regardless of 1- vs 2-line titles)──
                    Expanded(
                      flex: 3,
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(11.w, 8.h, 10.w, 10.h),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: context.tText,
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w700,
                                height: 1.2,
                                letterSpacing: 0.1,
                              ),
                            ),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Icon(Iconsax.shop,
                                    size: 12.sp, color: context.tSub),
                                SizedBox(width: 4.w),
                                Expanded(
                                  child: Text(
                                    'tap_to_view'.tr(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: context.tSub,
                                      fontSize: 10.5.sp,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                Container(
                                  width: 24.w,
                                  height: 24.w,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: primary.withValues(alpha: 0.12),
                                  ),
                                  alignment: Alignment.center,
                                  child: Icon(
                                    Iconsax.arrow_right_3,
                                    size: 13.sp,
                                    color: primary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Top-right popular badge — primary gradient + glow.
class _SoldBadge extends StatelessWidget {
  final int sold;
  final Color primary;
  const _SoldBadge({required this.sold, required this.primary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 9.w, vertical: 5.h),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primary,
            Color.lerp(primary, Colors.black, 0.18) ?? primary,
          ],
        ),
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: 0.50),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('⚡', style: TextStyle(fontSize: 11.sp)),
          SizedBox(width: 3.w),
          Text(
            '$sold+',
            style: TextStyle(
              color: Colors.white,
              fontSize: 10.5.sp,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Top-right "NEW" badge — blue gradient + star.
class _NewBadge extends StatelessWidget {
  const _NewBadge();

  @override
  Widget build(BuildContext context) {
    const c1 = Color(0xFF42A5F5);
    const c2 = Color(0xFF1E88E5);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 9.w, vertical: 5.h),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [c1, c2],
        ),
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: c2.withValues(alpha: 0.45),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Iconsax.star1, size: 10.sp, color: Colors.white),
          SizedBox(width: 3.w),
          Text(
            'new'.tr().toUpperCase(),
            style: TextStyle(
              color: Colors.white,
              fontSize: 10.sp,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}


