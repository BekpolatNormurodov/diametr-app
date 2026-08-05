// ignore_for_file: file_names

import 'package:flutter_phone_direct_caller/flutter_phone_direct_caller.dart';
import 'package:map_launcher/map_launcher.dart';
import 'package:stroymarket/bloc/shop/shop_bloc.dart';
import 'package:stroymarket/bloc/shop/shop_state.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';

import '../../export_files.dart';
import '../../widgets/common/fade_up_widget.dart';

class MarketScreen extends StatefulWidget {
  final String? id;
  final String? name;
  const MarketScreen({super.key, required this.id, required this.name});

  @override
  State<MarketScreen> createState() => _MarketScreenState();
}

class _MarketScreenState extends State<MarketScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';
  int _visibleCount = 14;
  int? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    ShopManager.getById(context, ShopId: widget.id ?? '');
    _searchCtrl.addListener(() {
      setState(() {
        _query = _searchCtrl.text.toLowerCase().trim();
        _visibleCount = 14;
        _selectedCategoryId = null;
      });
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.tBg,
      body: BlocBuilder<ShopBloc, ShopState>(
        builder: (context, state) {
          if (state is ShopSuccessState) {
            if (state.data == null) return _buildNotFound(context);
            return _buildContent(context, state.data, state.admin, state.products);
          }
          return _buildLoading(context);
        },
      ),
    );
  }

  // ── Shimmer skeleton ──────────────────────────────────────────────────────────
  Widget _buildLoading(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 260.h,
          pinned: true,
          backgroundColor: context.tBg,
          leading: _backButton(context),
          flexibleSpace: FlexibleSpaceBar(
            background: Shimmer.fromColors(
              baseColor: context.tInput,
              highlightColor: context.tDivider,
              child: Container(color: context.tInput),
            ),
          ),
        ),
        SliverPadding(
          padding: EdgeInsets.all(16.w),
          sliver: SliverToBoxAdapter(
            child: Column(
              children: List.generate(
                4,
                (i) => Shimmer.fromColors(
                  baseColor: context.tInput,
                  highlightColor: context.tDivider,
                  child: Container(
                    height: 54.h,
                    margin: EdgeInsets.only(bottom: 10.h),
                    decoration: BoxDecoration(
                      color: context.tInput,
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────────
  Widget _buildNotFound(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: context.tBg,
          leading: _backButton(context),
          elevation: 0,
        ),
        SliverFillRemaining(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Iconsax.shop_remove, color: context.tSub, size: 64.sp),
                SizedBox(height: 16.h),
                Text(
                  'shop_not_found'.tr(),
                  style: TextStyle(color: context.tSub, fontSize: 16.sp, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────────
  Widget _buildContent(BuildContext context, data, admin, products) {
    final String? imgPath = data['image']?.toString();
    final String imageUrl = imgPath != null
        ? Endpoints.img('shops', imgPath)
        : AppConstant.defaultImage;
    final String name = data['name']?.toString() ?? '';
    final String address = data['address']?.toString() ?? '';
    final String? phone = admin?['phone']?.toString();
    final double lat = (data['lat'] as num?)?.toDouble() ?? 0.0;
    final double lon = (data['lon'] as num?)?.toDouble() ?? 0.0;
    final bool yandex = data['yandex_delivery'] == true;
    final bool fixed = data['fixed_delivery'] == true;
    final bool market = data['market_delivery'] == true;
    final String? deliveryAmount = data['delivery_amount']?.toString();
    final List allList = (products as List);
    final List catFiltered = _selectedCategoryId == null
        ? allList
        : allList
            .where((p) => p['category_id'] == _selectedCategoryId)
            .toList();
    bool matches(dynamic v) =>
        v != null && v.toString().toLowerCase().contains(_query);
    final List filtered = _query.isEmpty
        ? catFiltered
        : catFiltered.where((p) {
            // Match names in either language AND variant names (e.g. "seyf").
            if (matches(p['name']) ||
                matches(p['name_uz']) ||
                matches(p['name_ru']) ||
                matches(p['desc'])) {
              return true;
            }
            final items = p['items'];
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
    final List displayed = filtered.take(_visibleCount).toList();

    // collect unique categories from all products
    final List cats = [];
    final Set seenCats = {};
    for (final p in allList) {
      final cat = p['category'];
      if (cat != null && seenCats.add(cat['id'])) cats.add(cat);
    }
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        // ── Hero SliverAppBar ────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 280.h,
          pinned: true,
          backgroundColor: context.tBg,
          elevation: 0,
          leading: _backButton(context),
          title: Text(
            name,
            style: TextStyle(color: context.tText, fontSize: 16.sp, fontWeight: FontWeight.w700),
          ),
          flexibleSpace: FlexibleSpaceBar(
            collapseMode: CollapseMode.parallax,
            background: _HeroBanner(
              imageUrl: imageUrl,
              name: name,
              address: address,
              lat: lat,
              lon: lon,
            ),
          ),
        ),

        // ── Info cards ───────────────────────────────────────────────────────────
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 8.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (phone != null && phone.isNotEmpty) ...[
                  FadeUpWidget(
                    delay: const Duration(milliseconds: 60),
                    child: _InfoCard(
                      icon: Iconsax.call,
                      iconColor: AppConstant.primaryColor,
                      label: '+' + phone,
                      onTap: () => FlutterPhoneDirectCaller.callNumber('+' + phone),
                      trailing: Icon(Iconsax.arrow_right_3, size: 14.sp, color: context.tSub),
                    ),
                  ),
                  SizedBox(height: 8.h),
                ],
                if (address.isNotEmpty) ...[
                  FadeUpWidget(
                    delay: const Duration(milliseconds: 100),
                    child: _InfoCard(
                      icon: Iconsax.location5,
                      iconColor: const Color(0xFFFF647C),
                      label: address,
                      onTap: () async {
                        try {
                          final coords = Coords(lat, lon);
                          final maps = await MapLauncher.installedMaps;
                          if (maps.isNotEmpty && context.mounted) {
                            _showMapPicker(context, coords, name, maps);
                          }
                        } catch (_) {}
                      },
                      trailing: Icon(Iconsax.arrow_right_3, size: 14.sp, color: context.tSub),
                    ),
                  ),
                  SizedBox(height: 8.h),
                ],
                if (yandex || fixed || market) ...[
                  FadeUpWidget(
                    delay: const Duration(milliseconds: 140),
                    child: _InfoCard(
                      icon: Iconsax.truck,
                      iconColor: const Color(0xFF6C63FF),
                      label: '',
                      child: Wrap(
                        spacing: 6.w,
                        runSpacing: 4.h,
                        children: [
                          if (market) _DeliveryChip(label: 'delivery_market'.tr()),
                          if (fixed)  _DeliveryChip(label: 'delivery_fixed'.tr()),
                          if (yandex) _DeliveryChip(label: 'delivery_yandex'.tr()),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 8.h),
                ],
                if (deliveryAmount != null && deliveryAmount != '0' && fixed) ...[
                  FadeUpWidget(
                    delay: const Duration(milliseconds: 160),
                    child: _InfoCard(
                      icon: Iconsax.money,
                      iconColor: const Color(0xFFFFAA00),
                      label: deliveryAmount.toMoney() + " so'm",
                    ),
                  ),
                  SizedBox(height: 8.h),
                ],
                SizedBox(height: 12.h),
                // ── Category filter chips ──
                if (cats.length > 1) ...[  
                  FadeUpWidget(
                    delay: const Duration(milliseconds: 160),
                    child: SizedBox(
                      height: 38.h,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _FilterChip(
                            label: 'filter_all'.tr(),
                            selected: _selectedCategoryId == null,
                            onTap: () => setState(() {
                              _selectedCategoryId = null;
                              _visibleCount = 14;
                            }),
                          ),
                          ...cats.map<Widget>((cat) => _FilterChip(
                                label: cat['name_uz'] ?? cat['name'] ?? '',
                                selected: _selectedCategoryId == cat['id'],
                                onTap: () => setState(() {
                                  _selectedCategoryId = cat['id'];
                                  _visibleCount = 14;
                                }),
                              )),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 8.h),
                ],
                // ── Search bar ──
                FadeUpWidget(
                  delay: const Duration(milliseconds: 170),
                  child: Container(
                    height: 46.h,
                    padding: EdgeInsets.symmetric(horizontal: 14.w),
                    decoration: BoxDecoration(
                      color: context.tInput,
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                    child: Row(
                      children: [
                        Icon(Iconsax.search_normal, color: context.tSub, size: 18.sp),
                        SizedBox(width: 10.w),
                        Expanded(
                          child: TextField(
                            controller: _searchCtrl,
                            style: TextStyle(color: context.tText, fontSize: 14.sp),
                            decoration: InputDecoration(
                              hintText: 'shop_search_hint'.tr(),
                              hintStyle: TextStyle(color: context.tSub, fontSize: 14.sp),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        if (_query.isNotEmpty)
                          GestureDetector(
                            onTap: () => _searchCtrl.clear(),
                            child: Icon(Icons.close_rounded, color: context.tSub, size: 18.sp),
                          ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 14.h),
                FadeUpWidget(
                  delay: const Duration(milliseconds: 180),
                  child: Row(
                    children: [
                      Text(
                        'shop_products_title'.tr(),
                        style: TextStyle(color: context.tText, fontSize: 18.sp, fontWeight: FontWeight.w700),
                      ),
                      SizedBox(width: 8.w),
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                        decoration: BoxDecoration(
                          color: AppConstant.primaryColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20.r),
                        ),
                        child: Text(
                          (products).length.toString(),
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
              ],
            ),
          ),
        ),

        // ── Products grid ────────────────────────────────────────────────────────
        if (filtered.isEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 32.h),
              child: EmptyState(
                icon: _query.isEmpty ? Iconsax.box : Iconsax.search_normal_1,
                title: _query.isEmpty
                    ? 'products_empty'.tr()
                    : 'search_empty'.tr(),
                subtitle: _query.isEmpty
                    ? "Bu do'konda hozircha mahsulotlar yo'q."
                    : null,
              ),
            ),
          )
        else
          SliverPadding(
            padding: EdgeInsets.symmetric(horizontal: 10.w),
            sliver: SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 3 / 4,
                mainAxisSpacing: 12.h,
                crossAxisSpacing: 10.w,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => FadeUpWidget(
                  delay: Duration(milliseconds: 50 * (index % 8)),
                  child: _ProductCard(
                    product: displayed[index],
                    onTap: () => Navigator.pushNamed(
                      context,
                      RouteNames.shopProductScreen,
                      arguments: {
                        'name': displayed[index]['name'],
                        'product_id': displayed[index]['id'],
                        'desc': displayed[index]['desc'],
                        'image': displayed[index]['image'],
                        'shop_id': data['id'],
                      },
                    ),
                  ),
                ),
                childCount: displayed.length,
              ),
            ),
          ),
        if (_visibleCount < filtered.length)
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 4.h),
              child: GestureDetector(
                onTap: () => setState(() => _visibleCount += 14),
                child: Container(
                  height: 46.h,
                  decoration: BoxDecoration(
                    color: AppConstant.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14.r),
                    border: Border.all(
                        color: AppConstant.primaryColor.withValues(alpha: 0.3)),
                  ),
                  child: Center(
                    child: Text(
                      'load_more'.tr(),
                      style: TextStyle(
                        color: AppConstant.primaryColor,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        SliverToBoxAdapter(child: SizedBox(height: 40.h)),

      ],

      
    );
  }

  void _showMapPicker(BuildContext context, Coords coords, String title, List maps) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.tCard,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(height: 8.h),
            Container(
              width: 40.w,
              height: 4.h,
              decoration: BoxDecoration(
                  color: context.tDivider,
                  borderRadius: BorderRadius.circular(2.r)),
            ),
            SizedBox(height: 16.h),
            ...maps.map((m) => ListTile(
                  onTap: () {
                    Navigator.pop(context);
                    m.showMarker(coords: coords, title: title);
                  },
                  title: Text(m.mapName, style: TextStyle(color: context.tText)),
                  leading: SvgPicture.asset(m.icon, height: 28, width: 28),
                  trailing:
                      Icon(Iconsax.arrow_right_3, size: 14.sp, color: context.tSub),
                )),
            SizedBox(height: 8.h),
          ],
        ),
      ),
    );
  }

  Widget _backButton(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pop(context),
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
          child: Icon(Iconsax.arrow_left,
              color: AppConstant.primaryColor, size: 18.sp),
        ),
      ),
    );
  }
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
class _HeroBanner extends StatelessWidget {
  final String imageUrl;
  final String name;
  final String address;
  final double lat;
  final double lon;
  const _HeroBanner(
      {required this.imageUrl,
      required this.name,
      required this.address,
      required this.lat,
      required this.lon});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        CachedNetworkImage(
          imageUrl: imageUrl,
          fit: BoxFit.cover,
          placeholder: (_, __) => Shimmer.fromColors(
            baseColor: context.tInput,
            highlightColor: context.tDivider,
            child: Container(color: context.tInput),
          ),
          errorWidget: (_, __, ___) => const AppImagePlaceholder(),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.35),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.72),
                ],
                stops: const [0.0, 0.40, 1.0],
              ),
            ),
          ),
        ),
        Positioned(
          left: 16.w,
          bottom: 16.h,
          right: 72.w,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22.sp,
                  fontWeight: FontWeight.w800,
                  shadows: const [Shadow(color: Colors.black54, blurRadius: 8)],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (address.isNotEmpty) ...[
                SizedBox(height: 4.h),
                Row(
                  children: [
                    Icon(Iconsax.location5, color: Colors.white70, size: 11.sp),
                    SizedBox(width: 4.w),
                    Flexible(
                      child: Text(
                        address,
                        style: TextStyle(color: Colors.white70, fontSize: 11.sp),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        Positioned(
          right: 16.w,
          bottom: 16.h,
          child: _MapButton(lat: lat, lon: lon, title: name),
        ),
      ],
    );
  }
}

// ─── Map button ───────────────────────────────────────────────────────────────
class _MapButton extends StatelessWidget {
  final double lat;
  final double lon;
  final String title;
  const _MapButton({required this.lat, required this.lon, required this.title});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        try {
          final coords = Coords(lat, lon);
          final maps = await MapLauncher.installedMaps;
          if (maps.isNotEmpty && context.mounted) {
            showModalBottomSheet(
              context: context,
              builder: (ctx) => SafeArea(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: maps
                        .map((m) => ListTile(
                              onTap: () {
                                Navigator.pop(ctx);
                                m.showMarker(coords: coords, title: title);
                              },
                              title: Text(m.mapName),
                              leading: SvgPicture.asset(m.icon, height: 28, width: 28),
                            ))
                        .toList(),
                  ),
                ),
              ),
            );
          }
        } catch (_) {}
      },
      child: Container(
        padding: EdgeInsets.all(10.w),
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Image.asset(
          'assets/images/go_location.png',
          width: 18.w,
          height: 18.w,
          color: AppConstant.primaryColor,
        ),
      ),
    );
  }
}

// ─── Info card ────────────────────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Widget? child;
  const _InfoCard(
      {required this.icon,
      required this.iconColor,
      required this.label,
      this.onTap,
      this.trailing,
      this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(12.w),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(color: context.tDivider, width: 0.5),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 36.w,
              height: 36.w,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10.r),
              ),
              child: Icon(icon, color: iconColor, size: 18.sp),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: child ??
                  Text(label,
                      style: TextStyle(
                          color: context.tText,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w500)),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}

// ─── Delivery chip ────────────────────────────────────────────────────────────
class _DeliveryChip extends StatelessWidget {
  final String label;
  const _DeliveryChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: AppConstant.primaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppConstant.primaryColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: AppConstant.primaryColor,
          fontSize: 12.sp,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ─── Filter chip ─────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(right: 8.w),
        padding: EdgeInsets.symmetric(horizontal: 14.w),
        decoration: BoxDecoration(
          color: selected ? AppConstant.primaryColor : context.tInput,
          borderRadius: BorderRadius.circular(20.r),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : context.tSub,
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// ─── Product card ─────────────────────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  final dynamic product;
  final VoidCallback? onTap;
  const _ProductCard({required this.product, this.onTap});

  @override
  Widget build(BuildContext context) {
    final String? imgPath = product['image']?.toString();
    final String imageUrl = imgPath != null
        ? Endpoints.img('products', imgPath)
        : AppConstant.defaultImage;
    final String name = product['name']?.toString() ?? '';
    final int count = int.tryParse(product['count']?.toString() ?? '0') ?? 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(14.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14.r),
          child: Column(
            children: [
              Expanded(
                flex: 6,
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  memCacheWidth: 600,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  placeholder: (_, __) => Shimmer.fromColors(
                    baseColor: context.tInput,
                    highlightColor: context.tDivider,
                    child: Container(color: context.tInput),
                  ),
                  errorWidget: (_, __, ___) => const AppImagePlaceholder(),
                ),
              ),
              Expanded(
                flex: 4,
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                      const Spacer(),
                      if (count > 0)
                        Text(
                          count.toString() + '+ ' + 'sold'.tr(),
                          style: TextStyle(color: context.tSub, fontSize: 11.sp),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}