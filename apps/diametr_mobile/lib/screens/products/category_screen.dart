import 'package:stroymarket/bloc/categoryAll/categoryAll_bloc.dart';
import 'package:stroymarket/bloc/categoryAll/categoryAll_state.dart';


import '../../export_files.dart';
import '../../manager/4_category_manager.dart';

// ignore: must_be_immutable
class CategoryScreen extends StatefulWidget {
  CategoryScreen({super.key});
 

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    CategoryManager.getAll(context,);
    _searchCtrl.addListener(
      () => setState(() => _query = _searchCtrl.text.trim().toLowerCase()),
    );
    super.initState();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _localizedName(Map item) {
    final lang = context.locale.languageCode;
    final v = lang == 'ru' ? item['name_ru'] : item['name_uz'];
    final s = (v ?? item['name'])?.toString().trim() ?? '';
    return s.isEmpty ? '—' : s;
  }

  List _filtered(List data) {
    if (_query.isEmpty) return data;
    bool matches(dynamic v) =>
        v != null && v.toString().toLowerCase().contains(_query);
    return data.where((c) {
      final m = c as Map;
      // Match the product's own names AND its variant names — a shopper can
      // search by a variant (e.g. "seyf") that is not the product's own name.
      if (matches(m['name']) ||
          matches(m['name_uz']) ||
          matches(m['name_ru']) ||
          matches(m['desc'])) {
        return true;
      }
      final items = m['items'];
      if (items is List) {
        for (final it in items) {
          if (matches(it['name']) ||
              matches(it['name_uz']) ||
              matches(it['name_ru']) ||
              matches(it['desc'])) {
            return true;
          }
        }
      }
      return false;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        'products'.tr(),
        () {
          Navigator.of(context).pop();
        },
        'assets/icons/chevron-left.png',
        savatcha: true,
      ),
      body: Column(
        children: [
          // ── Search bar ──
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 8.h),
            child: Container(
              height: 48.h,
              padding: EdgeInsets.symmetric(horizontal: 14.w),
              decoration: BoxDecoration(
                color: context.tInput,
                borderRadius: BorderRadius.circular(14.r),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.search_normal,
                      color: context.tSub, size: 18.sp),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      style: TextStyle(color: context.tText, fontSize: 14.sp),
                      decoration: InputDecoration(
                        hintText: 'category_search_hint'.tr(),
                        hintStyle:
                            TextStyle(color: context.tSub, fontSize: 14.sp),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  if (_query.isNotEmpty)
                    GestureDetector(
                      onTap: () => _searchCtrl.clear(),
                      child: Icon(Icons.close_rounded,
                          color: context.tSub, size: 18.sp),
                    ),
                ],
              ),
            ),
          ),
          // ── Body ──
          Expanded(
            child: BlocBuilder<CategoryAllBloc, CategoryAllState>(
              builder: (context, state) {
                if (state is CategoryAllSuccessState) {
                  // Backend already returns newest first (orderBy id desc).
                  final all = (state.data ?? []).toList();
                  final items = _filtered(all);
                  if (items.isEmpty) {
                    return EmptyState(
                      icon: _query.isEmpty
                          ? Iconsax.category
                          : Iconsax.search_normal_1,
                      title: _query.isEmpty
                          ? 'category_empty'.tr()
                          : 'search_empty'.tr(),
                      subtitle: _query.isEmpty
                          ? "Kategoriyalar tez orada qo'shiladi."
                          : null,
                    );
                  }
                  return categoryGrid(items);
                } else if (state is CategoryAllWaitingState) {
                  return _buildShimmer();
                }
                return EmptyState(
                  icon: Iconsax.category,
                  title: 'category_empty'.tr(),
                  subtitle: "Kategoriyalar tez orada qo'shiladi.",
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(16.w, 4.h, 16.w, 20.h),
      itemCount: 6,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12.h,
        crossAxisSpacing: 12.w,
        childAspectRatio: 0.82,
      ),
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: context.tInput,
        highlightColor: context.tDivider,
        child: Container(
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: BorderRadius.circular(16.r),
          ),
        ),
      ),
    );
  }

  Widget categoryGrid(List data) {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(16.w, 4.h, 16.w, 20.h),
      itemCount: data.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14.h,
        crossAxisSpacing: 14.w,
        childAspectRatio: 0.78,
      ),
      itemBuilder: (context, index) {
        final item = data[index] as Map;
        final name = _localizedName(item);
        final hasImage = item['image'] != null &&
            item['image'].toString().trim().isNotEmpty;
        // Product count comes from backend `_count.products`. Fallback to
        // legacy `product_count` if a future endpoint exposes it.
        final counts = item['_count'];
        final productCount = (counts is Map ? counts['products'] : null) ??
            item['product_count'] ??
            0;
        return _CategoryCard(
          name: name,
          imageUrl: hasImage
              ? Endpoints.img('categories', item['image'])
              : null,
          productCount: (productCount as num).toInt(),
          onTap: () {
            Navigator.of(context).pushNamed(
              '/productsScreen',
              arguments: {"data": item},
            );
          },
        );
      },
    );
  }
}

/// Premium category tile: edge-to-edge image, frosted bottom panel with name +
/// primary chevron, floating top-right icon chip, soft layered shadow.
class _CategoryCard extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final int productCount;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.name,
    required this.imageUrl,
    required this.productCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primary = AppConstant.primaryColor;
    final dark = context.isDark;
    final radius = BorderRadius.circular(20.r);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        splashColor: primary.withValues(alpha: 0.12),
        highlightColor: primary.withValues(alpha: 0.06),
        child: Ink(
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: radius,
            boxShadow: [
              BoxShadow(
                color: primary.withValues(alpha: dark ? 0.22 : 0.14),
                blurRadius: 18,
                spreadRadius: -2,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: dark ? 0.30 : 0.04),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: radius,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // ── Image ──
                if (imageUrl != null)
                  CachedNetworkImage(
                    fit: BoxFit.cover,
                    memCacheWidth: 600,
                    imageUrl: imageUrl!,
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

                // ── Top + bottom darkening for readability ──
                IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.20),
                          Colors.transparent,
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.55),
                        ],
                        stops: const [0.0, 0.25, 0.55, 1.0],
                      ),
                    ),
                  ),
                ),

                // ── Top-right floating count pill ──
                Positioned(
                  top: 10.h,
                  right: 10.w,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                        horizontal: 9.w, vertical: 5.h),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
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
                        Icon(
                          Iconsax.box,
                          size: 12.sp,
                          color: primary,
                        ),
                        SizedBox(width: 4.w),
                        Text(
                          productCount > 999
                              ? '999+'
                              : productCount.toString(),
                          style: TextStyle(
                            color: primary,
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            height: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Bottom frosted panel ──
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: EdgeInsets.fromLTRB(12.w, 10.h, 10.w, 12.h),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          context.tCard.withValues(alpha: 0.0),
                          context.tCard.withValues(alpha: 0.92),
                          context.tCard,
                        ],
                        stops: const [0.0, 0.55, 1.0],
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: context.tText,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                              letterSpacing: 0.1,
                            ),
                          ),
                        ),
                        SizedBox(width: 6.w),
                        Container(
                          width: 26.w,
                          height: 26.w,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: primary,
                            boxShadow: [
                              BoxShadow(
                                color: primary.withValues(alpha: 0.40),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: Icon(
                            Iconsax.arrow_right_3,
                            size: 14.sp,
                            color: Colors.white,
                          ),
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
  }
}
