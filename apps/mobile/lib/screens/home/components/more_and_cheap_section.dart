import 'package:dio/dio.dart' as dio;
import 'package:stroymarket/core/endpoints/endpoints.dart';
import 'package:stroymarket/core/network/dio_Client.dart';

import '../../../export_files.dart';
import '../../../widgets/common/fade_up_widget.dart';

class MoreAndCheapSection extends StatefulWidget {
  const MoreAndCheapSection({Key? key, required this.header}) : super(key: key);
  final Widget header;

  @override
  State<MoreAndCheapSection> createState() => _MoreAndCheapSectionState();
}

class _MoreAndCheapSectionState extends State<MoreAndCheapSection> {
  final DioClient _dioClient = DioClient();
  bool _loading = true;
  List<dynamic> _items = const [];

  @override
  void initState() {
    super.initState();
    _fetchPopular();
  }

  Future<void> _fetchPopular() async {
    try {
      final dio.Response response = await _dioClient.get(
        Endpoints.ProductPopular,
        queryParameters: {'key': Endpoints.authKey, 'limit': 30},
      );
      if (!mounted) return;
      if (response.statusCode == 200 && response.data is List) {
        setState(() {
          _items = response.data as List;
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
    // Hide whole section (including header) when not loading and list is empty
    if (!_loading && _items.isEmpty) {
      return const SizedBox.shrink();
    }

    final List items = _loading ? List.filled(6, null) : _items;

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          child: widget.header,
        ),
        SizedBox(height: 14.h),
        SizedBox(
          height: 290.h,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.04),
                  end: Offset.zero,
                ).animate(anim),
                child: child,
              ),
            ),
            child: ListView.builder(
              key: ValueKey<bool>(_loading),
              padding: EdgeInsets.only(bottom: 14.h),
              itemCount: _loading ? 6 : items.length.clamp(0, 30),
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final total = _loading ? 6 : items.length.clamp(0, 30);
                if (_loading) {
                  return _ShimmerCard(index: index, total: total);
                }
                return FadeUpWidget(
                  delay: Duration(milliseconds: 60 * index),
                  child: _ProductCard(
                    item: items[index],
                    index: index,
                    total: total,
                    rank: index + 1,
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Shimmer skeleton card ─────────────────────────────────────────────────────
class _ShimmerCard extends StatelessWidget {
  final int index;
  final int total;
  const _ShimmerCard({required this.index, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        left: index == 0 ? 16.w : 14.w,
        right: index == total - 1 ? 16.w : 0,
        top: 4.h,
        bottom: 8.h,
      ),
      width: 160.w,
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
              // Image area skeleton
              Expanded(
                flex: 5,
                child: Container(color: context.tInput),
              ),
              // Text area skeleton
              Container(
                padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 14.h),
                color: context.tCard,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Title line 1
                    Container(
                      height: 10.h,
                      width: 130.w,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    SizedBox(height: 6.h),
                    // Title line 2 (shorter)
                    Container(
                      height: 10.h,
                      width: 90.w,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                    SizedBox(height: 10.h),
                    // Sold pill
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
    );
  }
}

// ─── Real product card ─────────────────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  final dynamic item;
  final int index;
  final int total;
  final int rank;
  const _ProductCard(
      {required this.item, required this.index, required this.total, required this.rank});

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

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed(
        '/productScreen',
        arguments: {"product_id": item["id"], "name": name},
      ),
      child: Container(
        margin: EdgeInsets.only(
          left: index == 0 ? 16.w : 14.w,
          right: index == total - 1 ? 16.w : 0,
          top: 4.h,
          bottom: 8.h,
        ),
        width: 160.w,
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(18.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
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
                        imageUrl: imageUrl,
                        placeholder: (_, __) => Shimmer.fromColors(
                          baseColor: context.tInput,
                          highlightColor: context.tDivider,
                          child: Container(color: context.tInput),
                        ),
                        errorWidget: (_, __, ___) =>
                            const AppImagePlaceholder(),
                      )
                    else
                      const AppImagePlaceholder(),

                    // ── Top badges row ─────────────────────────────
                    // #1 (eng ko'p sotilgan) crown badge — only first card
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
                                color:
                                    const Color(0xFFFF8F00).withValues(alpha: 0.35),
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

                    // Top-right badge: sold count OR "NEW"
                    Positioned(
                      top: 8.h,
                      right: 8.w,
                      child: Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 9.w, vertical: 5.h),
                        decoration: BoxDecoration(
                          gradient: sold > 0
                              ? null
                              : const LinearGradient(
                                  colors: [
                                    Color(0xFF42A5F5),
                                    Color(0xFF1E88E5),
                                  ],
                                ),
                          color: sold > 0
                              ? AppConstant.primaryColor
                                  .withValues(alpha: 0.95)
                              : null,
                          borderRadius: BorderRadius.circular(20.r),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              sold > 0 ? Iconsax.flash_1 : Iconsax.star_1,
                              color: Colors.white,
                              size: 11.sp,
                            ),
                            SizedBox(width: 3.w),
                            Text(
                              sold > 0 ? '$sold+' : 'new'.tr().toUpperCase(),
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
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
                padding: EdgeInsets.fromLTRB(12.w, 10.h, 12.w, 12.h),
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
                        fontSize: 12.5.sp,
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    // ── Bottom pill: only sold count (NEW shown on top badge) ──
                    Row(
                      children: [
                        if (sold > 0)
                          Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 7.w, vertical: 3.h),
                            decoration: BoxDecoration(
                              color: AppConstant.primaryColor
                                  .withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8.r),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Iconsax.shopping_cart5,
                                  size: 11.sp,
                                  color: AppConstant.primaryColor,
                                ),
                                SizedBox(width: 4.w),
                                Text(
                                  '$sold ${'sold'.tr()}',
                                  style: TextStyle(
                                    color: AppConstant.primaryColor,
                                    fontSize: 10.5.sp,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const Spacer(),
                        Icon(
                          Iconsax.arrow_right_3,
                          size: 13.sp,
                          color: context.tSub,
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
