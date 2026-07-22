import 'package:stroymarket/bloc/categoryAll/categoryAll_bloc.dart';
import 'package:stroymarket/bloc/categoryAll/categoryAll_state.dart';
import 'package:stroymarket/bloc/productAll/productAll_bloc.dart';
import 'package:stroymarket/bloc/productAll/productAll_state.dart';
import 'package:stroymarket/bloc/regionSelected/regionSelected_bloc.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_bloc.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_state.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/4_category_manager.dart';
import 'package:stroymarket/manager/5_product_manager.dart';
import 'package:stroymarket/manager/6_region_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';
import 'package:stroymarket/screens/home/components/region_filter.dart';
import 'package:stroymarket/services/storage/storage_service.dart';

import '../../export_files.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchCtrl = TextEditingController();
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _tabCtrl.addListener(() => setState(() {}));
    CategoryManager.getAll(context);
    ProductManager.getAll(context);
    ShopManager.getAll(context);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
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
    final q = _searchCtrl.text.trim().toLowerCase();
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
          'search_title'.tr(),
          style: TextStyle(
              color: context.tText,
              fontSize: 18.sp,
              fontWeight: FontWeight.w600),
        ),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(112.h),
          child: Column(
            children: [
              // в”Ђв”Ђ Search bar в”Ђв”Ђ
              Padding(
                padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 10.h),
                child: Container(
                  height: 46.h,
                  decoration: BoxDecoration(
                    color: context.tInput,
                    borderRadius: BorderRadius.circular(14.r),
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    autofocus: true,
                    style: TextStyle(color: context.tText, fontSize: 14.sp),
                    decoration: InputDecoration(
                      hintText: 'search_hint'.tr(),
                      hintStyle: TextStyle(
                          color: context.tText.withValues(alpha: 0.45),
                          fontSize: 14.sp),
                      prefixIcon: Icon(Iconsax.search_normal,
                          color: context.tText.withValues(alpha: 0.45),
                          size: 18.sp),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? GestureDetector(
                              onTap: () {
                                _searchCtrl.clear();
                                setState(() {});
                              },
                              child: Icon(Iconsax.close_circle,
                                  color: context.tSub, size: 18.sp),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12.h),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ),
              // ── Custom pill tabs ──
              Padding(
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
                      _buildPillTab(context, 1, 'search_categories_tab'.tr()),
                      _buildPillTab(context, 2, 'search_shops_tab'.tr()),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _ProductsTab(query: q, key: ValueKey('products_$q')),
          _CategoriesTab(query: q),
          _ShopsTab(query: q, key: ValueKey('shops_$q')),
        ],
      ),
    );
  }
}

// в”Ђв”Ђв”Ђ Products Tab в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
class _ProductsTab extends StatefulWidget {
  final String query;
  const _ProductsTab({required this.query, super.key});

  @override
  State<_ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<_ProductsTab> {
  int? _catId;
  int _visibleCount = 20;
  bool? _sortAsc;
  int? _priceMin;
  int? _priceMax;

  bool get _hasFilter =>
      _priceMin != null || _priceMax != null || _sortAsc != null;

  @override
  void didUpdateWidget(covariant _ProductsTab old) {
    super.didUpdateWidget(old);
    if (old.query != widget.query) {
      _catId = null;
      _visibleCount = 20;
      _sortAsc = null;
      _priceMin = null;
      _priceMax = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProductAllBloc, ProductAllState>(
      builder: (context, state) {
        if (state is ProductAllWaitingState) return _shimmerGrid(context);
        if (state is ProductAllSuccessState) {
          var all = (state.data ?? [])
              .where((e) =>
                  e["name"]?.toString().toLowerCase().contains(widget.query) ??
                  false)
              .toList();

          if (all.isEmpty) return _empty(context);

          // collect unique categories
          final categories = <Map<String, dynamic>>[];
          final seen = <dynamic>{};
          for (final p in all) {
            final cat = p["category"];
            if (cat != null && seen.add(cat["id"])) {
              categories.add(Map<String, dynamic>.from(cat as Map));
            }
          }

          // filter by selected category
          var filtered = _catId == null
              ? all
              : all.where((e) => e["category"]?["id"] == _catId).toList();

          // sort by price
          if (_sortAsc != null) {
            filtered = List.from(filtered)
              ..sort((a, b) {
                final pa = (a["price"] as num?)?.toDouble() ?? 0;
                final pb = (b["price"] as num?)?.toDouble() ?? 0;
                return _sortAsc! ? pa.compareTo(pb) : pb.compareTo(pa);
              });
          }

          // filter by price range
          if (_priceMin != null || _priceMax != null) {
            filtered = filtered.where((e) {
              final p = (e["price"] as num?)?.toInt() ?? 0;
              if (_priceMin != null && p < _priceMin!) return false;
              if (_priceMax != null && p > _priceMax!) return false;
              return true;
            }).toList();
          }

          final displayed = filtered.take(_visibleCount).toList();
          final hasMore = displayed.length < filtered.length;

          return RefreshIndicator(
            color: AppConstant.primaryColor,
            backgroundColor: context.tCard,
            onRefresh: () async => ProductManager.getAll(context),
            child: CustomScrollView(
              slivers: [
                // ── Category chips + Sort chips ──
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (categories.length > 1) ...[
                        SizedBox(
                          height: 44.h,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 6.h),
                            children: [
                              GestureDetector(
                                onTap: () => setState(() {
                                  _catId = null;
                                  _visibleCount = 20;
                                }),
                                child: Container(
                                  margin: EdgeInsets.only(right: 8.w),
                                  padding:
                                      EdgeInsets.symmetric(horizontal: 14.w),
                                  decoration: BoxDecoration(
                                    color: _catId == null
                                        ? AppConstant.primaryColor
                                        : context.tInput,
                                    borderRadius: BorderRadius.circular(20.r),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text('filter_all'.tr(),
                                      style: TextStyle(
                                          color: _catId == null
                                              ? Colors.white
                                              : context.tSub,
                                          fontSize: 12.sp,
                                          fontWeight: FontWeight.w600)),
                                ),
                              ),
                              ...categories.map((cat) {
                                final id = cat["id"];
                                final name =
                                    cat["name_uz"] ?? cat["name"] ?? '';
                                final sel = _catId == id;
                                return GestureDetector(
                                  onTap: () => setState(() {
                                    _catId = id;
                                    _visibleCount = 20;
                                  }),
                                  child: Container(
                                    margin: EdgeInsets.only(right: 8.w),
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 14.w),
                                    decoration: BoxDecoration(
                                      color: sel
                                          ? AppConstant.primaryColor
                                          : context.tInput,
                                      borderRadius:
                                          BorderRadius.circular(20.r),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(name,
                                        style: TextStyle(
                                            color: sel
                                                ? Colors.white
                                                : context.tSub,
                                            fontSize: 12.sp,
                                            fontWeight: FontWeight.w600)),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                      // ── Filter header ──
                      Padding(
                        padding:
                            EdgeInsets.fromLTRB(12.w, 6.h, 12.w, 4.h),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'search_products_tab'.tr(),
                              style: TextStyle(
                                  color: context.tText,
                                  fontSize: 15.sp,
                                  fontWeight: FontWeight.w600),
                            ),
                            GestureDetector(
                              onTap: () async {
                                final result = await showModalBottomSheet<
                                    Map<String, dynamic>?>(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => _PriceFilterSheet(
                                    initialMin: _priceMin,
                                    initialMax: _priceMax,
                                    initialSortAsc: _sortAsc,
                                  ),
                                );
                                if (result != null && mounted) {
                                  setState(() {
                                    _priceMin = result['min'];
                                    _priceMax = result['max'];
                                    _sortAsc = result['sortAsc'];
                                    _visibleCount = 20;
                                  });
                                }
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 12.w, vertical: 6.h),
                                decoration: BoxDecoration(
                                  color: _hasFilter
                                      ? AppConstant.primaryColor
                                          .withValues(alpha: 0.15)
                                      : context.tInput,
                                  borderRadius: BorderRadius.circular(10.r),
                                  border: _hasFilter
                                      ? Border.all(
                                          color: AppConstant.primaryColor
                                              .withValues(alpha: 0.4))
                                      : null,
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Iconsax.filter,
                                      color: _hasFilter
                                          ? AppConstant.primaryColor
                                          : context.tSub,
                                      size: 14.sp,
                                    ),
                                    SizedBox(width: 4.w),
                                    Text(
                                      _hasFilter
                                          ? 'filter_on'.tr()
                                          : 'filter_all'.tr(),
                                      style: TextStyle(
                                          color: _hasFilter
                                              ? AppConstant.primaryColor
                                              : context.tSub,
                                          fontSize: 12.sp,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // ── Products grid / empty state ──
                if (filtered.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _empty(context),
                  )
                else
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(
                        12.w, 0, 12.w, hasMore ? 0 : 30.h),
                    sliver: SliverGrid(
                      gridDelegate:
                          SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.68,
                        mainAxisSpacing: 8.h,
                        crossAxisSpacing: 8.w,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => _ProductCard(item: displayed[i]),
                        childCount: displayed.length,
                      ),
                    ),
                  ),
                // ── Load more button (full-width, below grid) ──
                if (hasMore)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding:
                          EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 30.h),
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _visibleCount += 20),
                        child: Container(
                          height: 46.h,
                          decoration: BoxDecoration(
                            color: AppConstant.primaryColor
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14.r),
                            border: Border.all(
                                color: AppConstant.primaryColor
                                    .withValues(alpha: 0.3)),
                          ),
                          child: Center(
                            child: Text('load_more'.tr(),
                                style: TextStyle(
                                    color: AppConstant.primaryColor,
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
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

  Widget _empty(BuildContext context) => EmptyState(
        icon: Iconsax.search_normal_1,
        title: 'search_empty'.tr(),
        subtitle: "Boshqa kalit so'z bilan qidirib ko'ring.",
      );
}

// ─── Price Filter Sheet ──────────────────────────────────────────────────────
class _PriceFilterSheet extends StatefulWidget {
  final int? initialMin;
  final int? initialMax;
  final bool? initialSortAsc;
  const _PriceFilterSheet({
    this.initialMin,
    this.initialMax,
    this.initialSortAsc,
  });

  @override
  State<_PriceFilterSheet> createState() => _PriceFilterSheetState();
}

class _PriceFilterSheetState extends State<_PriceFilterSheet> {
  late TextEditingController _minCtrl;
  late TextEditingController _maxCtrl;
  bool? _sortAsc;

  @override
  void initState() {
    super.initState();
    _minCtrl =
        TextEditingController(text: widget.initialMin?.toString() ?? '');
    _maxCtrl =
        TextEditingController(text: widget.initialMax?.toString() ?? '');
    _sortAsc = widget.initialSortAsc;
  }

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color bg =
        context.isDark ? const Color(0xFF1A1A2E) : Colors.white;
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24.r),
            topRight: Radius.circular(24.r),
          ),
        ),
        padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 24.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Drag handle ──
            Center(
              child: Container(
                margin: EdgeInsets.only(top: 12.h, bottom: 20.h),
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: context.tDivider,
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
            ),
            // ── Header ──
            Row(
              children: [
                Container(
                  width: 40.w,
                  height: 40.w,
                  decoration: BoxDecoration(
                    color:
                        AppConstant.primaryColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(Iconsax.dollar_circle,
                      color: AppConstant.primaryColor, size: 20.sp),
                ),
                SizedBox(width: 12.w),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('price_filter'.tr(),
                        style: TextStyle(
                            color: context.tText,
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w700)),
                    SizedBox(height: 2.h),
                    Text('price_filter_sub'.tr(),
                        style:
                            TextStyle(color: context.tSub, fontSize: 12.sp)),
                  ],
                ),
              ],
            ),
            SizedBox(height: 20.h),
            // ── Min / Max fields ──
            Row(
              children: [
                Expanded(
                  child: _priceField(
                      context: context,
                      ctrl: _minCtrl,
                      hint: 'price_min'.tr()),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _priceField(
                      context: context,
                      ctrl: _maxCtrl,
                      hint: 'price_max'.tr()),
                ),
              ],
            ),
            SizedBox(height: 20.h),
            // ── Sort ──
            Text('sort'.tr(),
                style: TextStyle(
                    color: context.tSub,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600)),
            SizedBox(height: 10.h),
            Row(
              children: [
                _sortChip(context,
                    label: 'price_asc'.tr(),
                    active: _sortAsc == true,
                    onTap: () => setState(() =>
                        _sortAsc = (_sortAsc == true) ? null : true)),
                SizedBox(width: 8.w),
                _sortChip(context,
                    label: 'price_desc'.tr(),
                    active: _sortAsc == false,
                    onTap: () => setState(() =>
                        _sortAsc = (_sortAsc == false) ? null : false)),
              ],
            ),
            SizedBox(height: 24.h),
            Divider(color: context.tDivider, height: 1),
            SizedBox(height: 16.h),
            // ── Clear + Apply buttons ──
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(
                        context,
                        <String, dynamic>{
                          'min': null,
                          'max': null,
                          'sortAsc': null
                        }),
                    child: Container(
                      height: 46.h,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Center(
                        child: Text('region_clear'.tr(),
                            style: TextStyle(
                                color: context.tSub,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  flex: 2,
                  child: GestureDetector(
                    onTap: () {
                      final minText = _minCtrl.text.trim();
                      final maxText = _maxCtrl.text.trim();
                      Navigator.pop(context, <String, dynamic>{
                        'min':
                            minText.isEmpty ? null : int.tryParse(minText),
                        'max':
                            maxText.isEmpty ? null : int.tryParse(maxText),
                        'sortAsc': _sortAsc,
                      });
                    },
                    child: Container(
                      height: 46.h,
                      decoration: BoxDecoration(
                        color: AppConstant.primaryColor,
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Center(
                        child: Text('region_apply'.tr(),
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _priceField({
    required BuildContext context,
    required TextEditingController ctrl,
    required String hint,
  }) {
    return Container(
      height: 48.h,
      decoration: BoxDecoration(
        color: context.tInput,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        style: TextStyle(color: context.tText, fontSize: 14.sp),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: context.tSub, fontSize: 13.sp),
          border: InputBorder.none,
          contentPadding:
              EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
        ),
      ),
    );
  }

  Widget _sortChip(
    BuildContext ctx, {
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: active ? AppConstant.primaryColor : ctx.tInput,
          borderRadius: BorderRadius.circular(20.r),
          border: active ? null : Border.all(color: ctx.tDivider),
        ),
        child: Text(label,
            style: TextStyle(
                color: active ? Colors.white : ctx.tSub,
                fontSize: 13.sp,
                fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _ProductCard extends StatefulWidget {
  final dynamic item;
  const _ProductCard({required this.item});

  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard> {
  bool _isFav = false;

  @override
  void initState() {
    super.initState();
    final favs = StorageService().read(StorageService.favProducts);
    _isFav = (favs as List? ?? []).contains(widget.item["id"]);
  }

  void _toggleFav() async {
    final svc = StorageService();
    final favs = List.from(svc.read(StorageService.favProducts) ?? []);
    final id = widget.item["id"];
    if (_isFav) {
      favs.remove(id);
    } else {
      favs.add(id);
    }
    await svc.write(StorageService.favProducts, favs);
    if (mounted) setState(() => _isFav = !_isFav);
  }

  @override
  Widget build(BuildContext context) {
    final String? img = widget.item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('products', img) : null;
    final String name = widget.item["name"]?.toString() ?? '';
    final dynamic price = widget.item["price"];

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/productScreen',
          arguments: {
            "product_id": widget.item["id"],
            "name": widget.item["name"]
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
            // ── Image with heart overlay ──
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
                  // ── Heart icon ──
                  Positioned(
                    top: 6.h,
                    right: 6.w,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _toggleFav,
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
                          _isFav ? Iconsax.heart5 : Iconsax.heart,
                          color: _isFav ? Colors.redAccent : context.tSub,
                          size: 15.sp,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // ── Text ──
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

// в”Ђв”Ђв”Ђ Categories Tab в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
class _CategoriesTab extends StatelessWidget {
  final String query;
  const _CategoriesTab({required this.query});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CategoryAllBloc, CategoryAllState>(
      builder: (context, state) {
        if (state is CategoryAllWaitingState) return _shimmerList(context);
        if (state is CategoryAllSuccessState) {
          final data = (state.data ?? [])
              .where((e) =>
                  e["name"]?.toString().toLowerCase().contains(query) ?? false)
              .toList();
          if (data.isEmpty) return _empty(context);
          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 30.h),
            itemCount: data.length,
            itemBuilder: (ctx, i) => _CategoryCard(item: data[i]),
          );
        }
        return const SizedBox();
      },
    );
  }

  Widget _shimmerList(BuildContext context) => ListView.builder(
        padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 30.h),
        itemCount: 5,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            height: 100.h,
            margin: EdgeInsets.only(bottom: 12.h),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(14.r),
            ),
          ),
        ),
      );

  Widget _empty(BuildContext context) => EmptyState(
        icon: Iconsax.category,
        title: 'search_empty'.tr(),
        subtitle: "Boshqa kategoriya bilan urinib ko'ring.",
      );
}

class _CategoryCard extends StatelessWidget {
  final dynamic item;
  const _CategoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('categories', img) : null;
    return GestureDetector(
      onTap: () => Navigator.of(context)
          .pushNamed('/productsScreen', arguments: {"data": item}),
      child: Container(
        height: 100.h,
        margin: EdgeInsets.only(bottom: 12.h),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16.r),
          child: Stack(fit: StackFit.expand, children: [
            // background
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
            // gradient overlay only when image present
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
            // text
            Padding(
              padding:
                  EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item["name"] ?? '',
                    style: TextStyle(
                        color: imageUrl != null ? Colors.white : context.tText,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w700),
                  ),
                  if ((item["desc"] ?? '').toString().isNotEmpty) ...[
                    SizedBox(height: 4.h),
                    Text(
                      item["desc"].toString(),
                      style: TextStyle(
                          color: imageUrl != null
                              ? Colors.white.withValues(alpha: 0.75)
                              : context.tSub,
                          fontSize: 12.sp),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ─── Shops Tab ───────────────────────────────────────────────────────────────
class _ShopsTab extends StatefulWidget {
  final String query;
  const _ShopsTab({required this.query, super.key});

  @override
  State<_ShopsTab> createState() => _ShopsTabState();
}

class _ShopsTabState extends State<_ShopsTab> {
  int _visibleCount = 20;

  @override
  void didUpdateWidget(covariant _ShopsTab old) {
    super.didUpdateWidget(old);
    if (old.query != widget.query) _visibleCount = 20;
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RegionSelectedBloc, List>(
      builder: (context, selectedRegions) {
        return BlocBuilder<ShopAllBloc, ShopAllState>(
          builder: (context, state) {
            if (state is ShopAllWaitingState) return _shimmerList(context);
            if (state is ShopAllSuccessState) {
              var data = (state.data ?? [])
                  .where((e) =>
                      e["name"]
                              ?.toString()
                              .toLowerCase()
                              .contains(widget.query) ??
                          false)
                  .toList();

              // filter by selected regions
              if (selectedRegions.isNotEmpty) {
                data = data
                    .where((e) => selectedRegions
                        .any((r) => r["id"] == e["regionId"]))
                    .toList();
              }

              if (data.isEmpty) {
                return Column(children: [
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    child: _header(context, selectedRegions),
                  ),
                  Expanded(child: _empty(context)),
                ]);
              }

              final displayed = data.take(_visibleCount).toList();
              final hasMore = displayed.length < data.length;

              return RefreshIndicator(
                color: AppConstant.primaryColor,
                backgroundColor: context.tCard,
                onRefresh: () async => ShopManager.getAll(context),
                child: ListView.builder(
                  padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 30.h),
                  itemCount: displayed.length + 1 + (hasMore ? 1 : 0),
                  itemBuilder: (ctx, i) {
                    if (i == 0) return _header(context, selectedRegions);
                    final idx = i - 1;
                    if (hasMore && idx == displayed.length) {
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _visibleCount += 20),
                        child: Container(
                          margin: EdgeInsets.symmetric(vertical: 8.h),
                          height: 46.h,
                          decoration: BoxDecoration(
                            color: AppConstant.primaryColor
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14.r),
                            border: Border.all(
                                color: AppConstant.primaryColor
                                    .withValues(alpha: 0.3)),
                          ),
                          child: Center(
                            child: Text('load_more'.tr(),
                                style: TextStyle(
                                    color: AppConstant.primaryColor,
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
                      );
                    }
                    return _ShopCard(item: displayed[idx]);
                  },
                ),
              );
            }
            return const SizedBox();
          },
        );
      },
    );
  }

  Widget _header(BuildContext context, List selectedRegions) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 10.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'search_shops_tab'.tr(),
            style: TextStyle(
                color: context.tText,
                fontSize: 15.sp,
                fontWeight: FontWeight.w600),
          ),
          GestureDetector(
            onTap: () {
              RegionManager.getAll(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => regionFilter(),
              );
            },
            child: Container(
              padding:
                  EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
              decoration: BoxDecoration(
                color: selectedRegions.isNotEmpty
                    ? AppConstant.primaryColor.withValues(alpha: 0.15)
                    : context.tInput,
                borderRadius: BorderRadius.circular(10.r),
                border: selectedRegions.isNotEmpty
                    ? Border.all(
                        color:
                            AppConstant.primaryColor.withValues(alpha: 0.4))
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Iconsax.filter,
                    color: selectedRegions.isNotEmpty
                        ? AppConstant.primaryColor
                        : context.tSub,
                    size: 14.sp,
                  ),
                  SizedBox(width: 4.w),
                  Text(
                    selectedRegions.isNotEmpty
                        ? '${selectedRegions.length}'
                        : 'filter_all'.tr(),
                    style: TextStyle(
                        color: selectedRegions.isNotEmpty
                            ? AppConstant.primaryColor
                            : context.tSub,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

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

  Widget _empty(BuildContext context) => EmptyState(
        icon: Iconsax.shop,
        title: 'search_empty'.tr(),
        subtitle: "Bu nom bilan do'kon topilmadi.",
      );
}

class _ShopCard extends StatefulWidget {
  final dynamic item;
  const _ShopCard({required this.item});

  @override
  State<_ShopCard> createState() => _ShopCardState();
}

class _ShopCardState extends State<_ShopCard> {
  bool _isFav = false;

  @override
  void initState() {
    super.initState();
    final favs = StorageService().read(StorageService.favShops);
    _isFav = (favs as List? ?? []).contains(widget.item["id"]);
  }

  void _toggleFav() async {
    final svc = StorageService();
    final favs = List.from(svc.read(StorageService.favShops) ?? []);
    final id = widget.item["id"];
    if (_isFav) {
      favs.remove(id);
    } else {
      favs.add(id);
    }
    await svc.write(StorageService.favShops, favs);
    if (mounted) setState(() => _isFav = !_isFav);
  }

  @override
  Widget build(BuildContext context) {
    final String? img = widget.item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('shops', img) : null;
    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed(
        '/marketScreen',
        arguments: {
          "id": widget.item["id"].toString(),
          "name": widget.item["name"]
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
            // background
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
            // gradient overlay only when image present
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
            // content
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
                              widget.item["name"] ?? '',
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
                        if ((widget.item["address"] ?? '')
                            .toString()
                            .isNotEmpty) ...[
                          SizedBox(height: 4.h),
                          Text(
                            widget.item["address"].toString(),
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
                  // ── Heart ──
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: _toggleFav,
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
                        _isFav ? Iconsax.heart5 : Iconsax.heart,
                        color: _isFav ? Colors.redAccent : context.tSub,
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
