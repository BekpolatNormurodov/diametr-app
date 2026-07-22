import 'package:dio/dio.dart' as dio;
import 'package:stroymarket/core/endpoints/endpoints.dart';
import 'package:stroymarket/core/network/dio_Client.dart';

import '../../export_files.dart';

class PopularProductsScreen extends StatefulWidget {
  const PopularProductsScreen({super.key});

  @override
  State<PopularProductsScreen> createState() => _PopularProductsScreenState();
}

class _PopularProductsScreenState extends State<PopularProductsScreen> {
  final DioClient _dio = DioClient();
  bool _loading = true;
  List _items = const [];

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final dio.Response r = await _dio.get(
        Endpoints.ProductPopular,
        queryParameters: {'key': Endpoints.authKey, 'limit': 50},
      );
      if (!mounted) return;
      if (r.statusCode == 200 && r.data is List) {
        setState(() {
          _items = r.data as List;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scaffoldKey = GlobalKey<ScaffoldState>();
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        'bestsellers_header'.tr(),
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
        savatcha: true,
      ),
      body: RefreshIndicator(
        color: AppConstant.primaryColor,
        backgroundColor: context.tCard,
        onRefresh: _fetch,
        child: _loading
            ? _shimmer()
            : _items.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: 120.h),
                      EmptyState(
                        icon: Iconsax.star,
                        title: "Hozircha eng ko'p sotilgan mahsulot yo'q",
                        subtitle:
                            "Sotuvlar boshlanganidan so'ng shu yerda ko'rasiz.",
                      ),
                    ],
                  )
                : GridView.builder(
                    padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 30.h),
                    itemCount: _items.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.72,
                      mainAxisSpacing: 10.h,
                      crossAxisSpacing: 10.w,
                    ),
                    itemBuilder: (ctx, i) =>
                        _Card(item: _items[i], rank: i + 1),
                  ),
      ),
    );
  }

  Widget _shimmer() => GridView.builder(
        padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 30.h),
        itemCount: 8,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.72,
          mainAxisSpacing: 10.h,
          crossAxisSpacing: 10.w,
        ),
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: BorderRadius.circular(18.r),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18.r),
            child: Shimmer.fromColors(
              baseColor: context.tInput,
              highlightColor: context.tDivider,
              period: const Duration(milliseconds: 1100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    flex: 5,
                    child: Container(color: context.tInput),
                  ),
                  Container(
                    padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 14.h),
                    color: context.tCard,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          height: 10.h,
                          width: 130.w,
                          decoration: BoxDecoration(
                            color: context.tInput,
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                        ),
                        SizedBox(height: 6.h),
                        Container(
                          height: 10.h,
                          width: 90.w,
                          decoration: BoxDecoration(
                            color: context.tInput,
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                        ),
                        SizedBox(height: 10.h),
                        Container(
                          height: 18.h,
                          width: 80.w,
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

class _Card extends StatelessWidget {
  final dynamic item;
  final int rank;
  const _Card({required this.item, required this.rank});

  @override
  Widget build(BuildContext context) {
    final String? productImg = item["image"]?.toString();
    final List itemsList = (item["items"] is List) ? item["items"] as List : const [];
    String? itemImg;
    for (final it in itemsList) {
      final v = it is Map ? it["image"]?.toString() : null;
      if (v != null && v.isNotEmpty) {
        itemImg = v;
        break;
      }
    }
    final String? imageUrl = (productImg != null && productImg.isNotEmpty)
        ? Endpoints.img('products', productImg)
        : (itemImg != null ? Endpoints.img('product-items', itemImg) : null);
    final String locCode = context.locale.languageCode;
    final String localized = locCode == 'ru'
        ? (item['name_ru']?.toString() ?? '')
        : (item['name_uz']?.toString() ?? '');
    final String name = localized.isNotEmpty
        ? localized
        : (item['name']?.toString() ?? '');
    final int sold = int.tryParse(item["sold"]?.toString() ?? '0') ?? 0;
    final int variantCount = (item["_count"] is Map &&
            item["_count"]["items"] != null)
        ? int.tryParse(item["_count"]["items"].toString()) ?? itemsList.length
        : itemsList.length;

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed(
        '/productScreen',
        arguments: {"product_id": item["id"], "name": name},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(18.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(
                  alpha: context.isDark ? 0.18 : 0.10),
              blurRadius: 14,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18.r),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Image area ──────────────────────────────────────
              Expanded(
                flex: 5,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (imageUrl != null)
                      CachedNetworkImage(
                        fit: BoxFit.cover,
                        memCacheWidth: 600,
                        imageUrl: imageUrl,
                        placeholder: (_, __) => Container(color: context.tInput),
                        errorWidget: (_, __, ___) =>
                            const AppImagePlaceholder(),
                      )
                    else
                      const AppImagePlaceholder(),

                    // TOP badge — only #1
                    if (rank == 1 && sold > 0)
                      Positioned(
                        top: 8.h,
                        left: 8.w,
                        child: Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 8.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFFFFB300),
                                Color(0xFFFF8F00),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20.r),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF8F00)
                                    .withValues(alpha: 0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Iconsax.crown_1,
                                  color: Colors.white, size: 11.sp),
                              SizedBox(width: 3.w),
                              Text(
                                'TOP',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10.sp,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Sold count badge — clean number
                    if (sold > 0)
                      Positioned(
                        top: 8.h,
                        right: 8.w,
                        child: Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 9.w, vertical: 5.h),
                          decoration: BoxDecoration(
                            color: AppConstant.primaryColor
                                .withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(20.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Iconsax.flash_1,
                                  color: Colors.white, size: 11.sp),
                              SizedBox(width: 3.w),
                              Text(
                                '$sold',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.sp,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // ── Text area ───────────────────────────────────────
              Container(
                padding: EdgeInsets.fromLTRB(10.w, 8.h, 10.w, 10.h),
                color: context.tCard,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name.isEmpty ? '—' : name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: context.tText,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Row(
                      children: [
                        Icon(Iconsax.box,
                            size: 11.sp, color: context.tSub),
                        SizedBox(width: 4.w),
                        Expanded(
                          child: Text(
                            variantCount > 0
                                ? '$variantCount ${'variants'.tr()}'
                                : 'no_variants'.tr(),
                            style: TextStyle(
                              color: context.tSub,
                              fontSize: 10.sp,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    Row(
                      children: [
                        Icon(
                          Iconsax.shopping_cart,
                          size: 11.sp,
                          color: AppConstant.primaryColor,
                        ),
                        SizedBox(width: 4.w),
                        Expanded(
                          child: Text(
                            sold > 0
                                ? '$sold ${'sold'.tr()}'
                                : 'new'.tr(),
                            style: TextStyle(
                              color: AppConstant.primaryColor,
                              fontSize: 10.sp,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
