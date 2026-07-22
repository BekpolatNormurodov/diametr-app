import 'package:stroymarket/bloc/productAll/productAll_bloc.dart';
import 'package:stroymarket/bloc/productAll/productAll_state.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_bloc.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_state.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/5_product_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';
import 'package:stroymarket/services/storage/storage_service.dart';

import '../../export_files.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List _favProductIds = [];
  List _favShopIds = [];
  int _pVisible = 20;
  int _sVisible = 20;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _tabCtrl.addListener(() => setState(() {}));
    _loadFavs();
  }

  void _loadFavs() {
    final svc = StorageService();
    setState(() {
      _favProductIds =
          List.from(svc.read(StorageService.favProducts) ?? []);
      _favShopIds = List.from(svc.read(StorageService.favShops) ?? []);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Widget _buildPillTab(BuildContext context, int index, String label) {
    final sel = _tabCtrl.index == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => _tabCtrl.animateTo(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: sel ? AppConstant.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(10.r),
            boxShadow: sel
                ? [
                    BoxShadow(
                      color: AppConstant.primaryColor.withValues(alpha: 0.28),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    )
                  ]
                : [],
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: sel ? Colors.white : context.tSub,
              fontSize: 12.sp,
              fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.tBg,
      appBar: AppBar(
        backgroundColor: context.tBg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            margin: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: AppConstant.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10.r),
              border: Border.all(
                color: AppConstant.primaryColor.withValues(alpha: 0.20),
                width: 1,
              ),
            ),
            child: Center(
              child: Icon(
                Iconsax.arrow_left,
                color: AppConstant.primaryColor,
                size: 18.sp,
              ),
            ),
          ),
        ),
        title: Text(
          'favorites'.tr(),
          style: TextStyle(
              color: context.tText,
              fontSize: 18.sp,
              fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(56.h),
          child: Padding(
            padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 12.h),
            child: Container(
              height: 44.h,
              decoration: BoxDecoration(
                color: context.tInput,
                borderRadius: BorderRadius.circular(12.r),
              ),
              padding: EdgeInsets.all(3.w),
              child: Row(
                children: [
                  _buildPillTab(context, 0, 'search_products_tab'.tr()),
                  _buildPillTab(context, 1, 'search_shops_tab'.tr()),
                ],
              ),
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _buildProductsTab(context),
          _buildShopsTab(context),
        ],
      ),
    );
  }

  // ── Products tab ──────────────────────────────────────────────────────
  Widget _buildProductsTab(BuildContext context) {
    return BlocBuilder<ProductAllBloc, ProductAllState>(
      builder: (context, state) {
        if (state is ProductAllWaitingState) return _shimmerGrid(context);
        if (state is ProductAllSuccessState) {
          final all = (state.data ?? [])
              .where((e) => _favProductIds.contains(e["id"]))
              .toList();

          if (all.isEmpty) {
            return _emptyState(context, 'fav_products_empty'.tr());
          }

          final displayed = all.take(_pVisible).toList();
          final hasMore = displayed.length < all.length;

          return RefreshIndicator(
            color: AppConstant.primaryColor,
            backgroundColor: context.tCard,
            onRefresh: () async {
              await ProductManager.getAll(context);
              _loadFavs();
            },
            child: CustomScrollView(
              slivers: [
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                      12.w, 12.h, 12.w, hasMore ? 0 : 30.h),
                  sliver: SliverGrid(
                    gridDelegate:
                        SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.68,
                      mainAxisSpacing: 8.h,
                      crossAxisSpacing: 8.w,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => _FavProductCard(
                          item: displayed[i], onUnfavorited: _loadFavs),
                      childCount: displayed.length,
                    ),
                  ),
                ),
                if (hasMore)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 30.h),
                      child: GestureDetector(
                        onTap: () => setState(() => _pVisible += 20),
                        child: _loadMoreBtn(context),
                      ),
                    ),
                  ),
              ],
            ),
          );
        }
        return const SizedBox();
      },
    );
  }

  // ── Shops tab ─────────────────────────────────────────────────────────
  Widget _buildShopsTab(BuildContext context) {
    return BlocBuilder<ShopAllBloc, ShopAllState>(
      builder: (context, state) {
        if (state is ShopAllWaitingState) return _shimmerList(context);
        if (state is ShopAllSuccessState) {
          final all = (state.data ?? [])
              .where((e) => _favShopIds.contains(e["id"]))
              .toList();

          if (all.isEmpty) {
            return _emptyState(context, 'fav_shops_empty'.tr());
          }

          final displayed = all.take(_sVisible).toList();
          final hasMore = displayed.length < all.length;

          return RefreshIndicator(
            color: AppConstant.primaryColor,
            backgroundColor: context.tCard,
            onRefresh: () async {
              await ShopManager.getAll(context);
              _loadFavs();
            },
            child: ListView.builder(
              padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 30.h),
              itemCount: displayed.length + (hasMore ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (hasMore && i == displayed.length) {
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.h),
                    child: GestureDetector(
                      onTap: () => setState(() => _sVisible += 20),
                      child: _loadMoreBtn(context),
                    ),
                  );
                }
                return _FavShopCard(
                    item: displayed[i], onUnfavorited: _loadFavs);
              },
            ),
          );
        }
        return const SizedBox();
      },
    );
  }

  // ── Shared helpers ────────────────────────────────────────────────────
  Widget _loadMoreBtn(BuildContext context) => Container(
        height: 46.h,
        decoration: BoxDecoration(
          color: AppConstant.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(
              color: AppConstant.primaryColor.withValues(alpha: 0.3)),
        ),
        child: Center(
          child: Text('load_more'.tr(),
              style: TextStyle(
                  color: AppConstant.primaryColor,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600)),
        ),
      );

  Widget _emptyState(BuildContext context, String label) => EmptyState(
        icon: Iconsax.heart,
        title: label,
        subtitle: "Yoqtirgan narsalaringizni yurakcha tugmasi orqali saqlang.",
      );

  Widget _shimmerGrid(BuildContext context) => GridView.builder(
        padding: EdgeInsets.fromLTRB(8.w, 12.h, 8.w, 30.h),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.68,
            mainAxisSpacing: 8.h,
            crossAxisSpacing: 8.w),
        itemCount: 6,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            margin: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        ),
      );

  Widget _shimmerList(BuildContext context) => ListView.builder(
        padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 30.h),
        itemCount: 5,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            height: 90.h,
            margin: EdgeInsets.only(bottom: 12.h),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(14.r),
            ),
          ),
        ),
      );
}

// ─── Fav Product Card ────────────────────────────────────────────────────────
class _FavProductCard extends StatelessWidget {
  final dynamic item;
  final VoidCallback onUnfavorited;
  const _FavProductCard({required this.item, required this.onUnfavorited});

  void _removeFav() async {
    final svc = StorageService();
    final favs = List.from(svc.read(StorageService.favProducts) ?? []);
    favs.remove(item["id"]);
    await svc.write(StorageService.favProducts, favs);
    onUnfavorited();
  }

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('products', img) : null;
    final String name = item["name"]?.toString() ?? '';
    final dynamic price = item["price"];

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/productScreen',
          arguments: {
            "product_id": item["id"],
            "name": item["name"]
          }),
      child: Container(
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(14.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withValues(alpha: context.isDark ? 0.18 : 0.07),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(14.r)),
                    child: SizedBox(
                      width: double.infinity,
                      height: double.infinity,
                      child: imageUrl != null
                          ? CachedNetworkImage(
                              fit: BoxFit.cover,
                              imageUrl: imageUrl,
                              placeholder: (_, __) => Shimmer.fromColors(
                                baseColor: context.tInput,
                                highlightColor: context.tDivider,
                                child: Container(color: context.tInput),
                              ),
                              errorWidget: (_, __, ___) => const AppImagePlaceholder(),
                            )
                          : const AppImagePlaceholder(),
                    ),
                  ),
                  // Heart remove button
                  Positioned(
                    top: 6.h,
                    right: 6.w,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _removeFav,
                      child: Container(
                        width: 30.w,
                        height: 30.w,
                        decoration: BoxDecoration(
                          color: context.isDark
                              ? Colors.black.withValues(alpha: 0.50)
                              : Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Iconsax.heart5,
                          color: Colors.redAccent,
                          size: 15.sp,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                        color: context.tText,
                        fontSize: 13.sp,
                        fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (price != null) ...[
                    SizedBox(height: 4.h),
                    Text(
                      '${price.toString().toMoney()} so\'m',
                      style: TextStyle(
                          color: AppConstant.primaryColor,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w700),
                      maxLines: 1,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Fav Shop Card ───────────────────────────────────────────────────────────
class _FavShopCard extends StatelessWidget {
  final dynamic item;
  final VoidCallback onUnfavorited;
  const _FavShopCard({required this.item, required this.onUnfavorited});

  void _removeFav() async {
    final svc = StorageService();
    final favs = List.from(svc.read(StorageService.favShops) ?? []);
    favs.remove(item["id"]);
    await svc.write(StorageService.favShops, favs);
    onUnfavorited();
  }

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('shops', img) : null;

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed(
        '/marketScreen',
        arguments: {
          "id": item["id"].toString(),
          "name": item["name"]
        },
      ),
      child: Container(
        height: 90.h,
        margin: EdgeInsets.only(bottom: 12.h),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.10),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16.r),
          child: Stack(fit: StackFit.expand, children: [
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
            if (imageUrl != null)
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      Colors.black.withValues(alpha: 0.70),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            Padding(
              padding:
                  EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(children: [
                          Icon(Iconsax.shop,
                              color: imageUrl != null
                                  ? Colors.white70
                                  : context.tSub,
                              size: 14.sp),
                          SizedBox(width: 5.w),
                          Expanded(
                            child: Text(
                              item["name"] ?? '',
                              style: TextStyle(
                                  color: imageUrl != null
                                      ? Colors.white
                                      : context.tText,
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.w700),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ]),
                        if ((item["address"] ?? '').toString().isNotEmpty) ...[
                          SizedBox(height: 4.h),
                          Text(
                            item["address"].toString(),
                            style: TextStyle(
                                color: imageUrl != null
                                    ? Colors.white.withValues(alpha: 0.75)
                                    : context.tSub,
                                fontSize: 12.sp),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: _removeFav,
                    child: Container(
                      width: 34.w,
                      height: 34.w,
                      decoration: BoxDecoration(
                        color: imageUrl != null
                            ? Colors.black.withValues(alpha: 0.35)
                            : context.tIconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Iconsax.heart5,
                        color: Colors.redAccent,
                        size: 16.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
