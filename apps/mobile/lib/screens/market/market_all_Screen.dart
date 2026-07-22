import 'dart:math';

import 'package:geolocator/geolocator.dart';
import 'package:stroymarket/manager/6_region_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';
import 'package:stroymarket/screens/home/components/region_filter.dart';
import 'package:stroymarket/services/location/location_service.dart';

import '../../bloc/shopAll/shopAll_bloc.dart';
import '../../bloc/shopAll/shopAll_state.dart';
import '../../export_files.dart';

double _distKmAll(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371.0;
  final dLat = (lat2 - lat1) * pi / 180;
  final dLon = (lon2 - lon1) * pi / 180;
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) *
          cos(lat2 * pi / 180) *
          sin(dLon / 2) *
          sin(dLon / 2);
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
}

String _fmtDist(double km) {
  if (km < 1) return '${(km * 1000).round()} m';
  return '${km.toStringAsFixed(1)} km';
}

class MarketAllScreen extends StatefulWidget {
  const MarketAllScreen({super.key});

  @override
  State<MarketAllScreen> createState() => _MarketAllScreenState();
}

class _MarketAllScreenState extends State<MarketAllScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';
  int _visibleCount = 14;
  Position? _pos;

  @override
  void initState() {
    super.initState();
    ShopManager.getAll(context);
    RegionManager.getAll(context);
    _searchCtrl.addListener(() => setState(() {
      _query = _searchCtrl.text.trim().toLowerCase();
      _visibleCount = 14;
    }));
    LocationService.getCurrentPoint().then((p) {
      if (p != null && mounted) setState(() => _pos = p);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List _filtered(List data) {
    var list = _query.isEmpty
        ? List.from(data)
        : data.where((s) => (s["name"] ?? "").toString().toLowerCase().contains(_query)).toList();
    if (_pos != null) {
      list.sort((a, b) {
        final aLat = (a["lat"] as num?)?.toDouble() ?? 0.0;
        final aLon = (a["lon"] as num?)?.toDouble() ?? 0.0;
        final bLat = (b["lat"] as num?)?.toDouble() ?? 0.0;
        final bLon = (b["lon"] as num?)?.toDouble() ?? 0.0;
        return _distKmAll(_pos!.latitude, _pos!.longitude, aLat, aLon)
            .compareTo(_distKmAll(_pos!.latitude, _pos!.longitude, bLat, bLon));
      });
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(scaffoldKey, 'market_all_title'.tr(), () {
        Navigator.of(context).pop();
      }, 'assets/icons/chevron-left.png', savatcha: true),
      body: Column(
        children: [
          // ── Search bar ──
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 8.h),
            child: Row(
                children: [
                  Expanded(
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
                        hintText: 'market_search_hint'.tr(),
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
                      child: Icon(Icons.close_rounded,
                          color: context.tSub, size: 18.sp),
                    ),
                ],
              ),
            ),
          ),
                  SizedBox(width: 10.w),
                  GestureDetector(
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => regionFilter(),
                      );
                    },
                    child: Container(
                      width: 48.h,
                      height: 48.h,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Icon(Iconsax.filter, color: context.tSub, size: 20.sp),
                    ),
                  ),
                ],
            ),
          ),
          // ── List ──
          Expanded(
            child: BlocBuilder<ShopAllBloc, ShopAllState>(
              builder: (context, state) {
                if (state is ShopAllSuccessState) {
                  // Newest first.
                  final items = _filtered(state.data.reversed.toList());
                  final visibleItems = items.take(_visibleCount).toList();
                  if (items.isEmpty) {
                    return EmptyState(
                      icon: _query.isEmpty
                          ? Iconsax.shop
                          : Iconsax.search_normal_1,
                      title: _query.isEmpty
                          ? 'market_all_title'.tr()
                          : 'search_empty'.tr(),
                      subtitle: _query.isEmpty
                          ? "Hozircha do'konlar topilmadi."
                          : null,
                    );
                  }
                  return Column(
                    children: [
                      Expanded(
                        child: GridView.builder(
                    padding: EdgeInsets.fromLTRB(12.w, 4.h, 12.w, 16.h),
                    itemCount: visibleItems.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 3 / 4,
                    ),
                    itemBuilder: (ctx, i) {
                      final shop = visibleItems[i];
                      double? dist;
                      if (_pos != null) {
                        final lat = (shop["lat"] as num?)?.toDouble() ?? 0.0;
                        final lon = (shop["lon"] as num?)?.toDouble() ?? 0.0;
                        if (lat != 0 || lon != 0) {
                          dist = _distKmAll(_pos!.latitude, _pos!.longitude, lat, lon);
                        }
                      }
                      return GestureDetector(
                        onTap: () => Navigator.of(ctx).pushNamed('/marketScreen',
                            arguments: {"id": shop["id"].toString(), "name": shop["name"]}),
                        child: Container(
                          margin: EdgeInsets.all(6.w),
                          decoration: BoxDecoration(
                            color: context.tCard,
                            borderRadius: BorderRadius.circular(16.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(
                                    alpha: context.isDark ? 0.20 : 0.07),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 6,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.vertical(
                                      top: Radius.circular(16.r)),
                                  child: SizedBox(
                                    width: double.infinity,
                                    child: shop["image"] != null
                                        ? CachedNetworkImage(
                                            fit: BoxFit.cover,
                                            imageUrl: Endpoints.img('shops', shop["image"]),
                                            placeholder: (_, __) => Shimmer.fromColors(
                                              baseColor: context.tInput,
                                              highlightColor: context.tDivider,
                                              child: Container(color: context.tInput),
                                            ),
                                            errorWidget: (_, __, ___) =>
                                                const AppImagePlaceholder(),
                                          )
                                        : const AppImagePlaceholder(),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 3,
                                child: Padding(
                                  padding: EdgeInsets.symmetric(
                                      horizontal: 10.w, vertical: 6.h),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        shop["name"] ?? "",
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: context.tText,
                                          fontSize: 13.sp,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      SizedBox(height: 3.h),
                                      if (dist != null)
                                        Row(
                                          children: [
                                            Icon(Iconsax.location,
                                                color: AppConstant.primaryColor,
                                                size: 12.sp),
                                            SizedBox(width: 3.w),
                                            Text(
                                              _fmtDist(dist),
                                              style: TextStyle(
                                                color: AppConstant.primaryColor,
                                                fontSize: 11.sp,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        )
                                      else if (shop["address"] != null)
                                        Text(
                                          shop["address"].toString(),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                              color: context.tSub,
                                              fontSize: 10.sp),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                      ),
                      if (_visibleCount < items.length)
                        GestureDetector(
                          onTap: () => setState(() => _visibleCount += 14),
                          child: Container(
                            margin: EdgeInsets.fromLTRB(16.w, 0, 16.w, 12.h),
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
                    ],
                  );
                } else if (state is ShopAllWaitingState) {
                  return GridView.builder(
                    padding: EdgeInsets.fromLTRB(12.w, 4.h, 12.w, 16.h),
                    itemCount: 6,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 3 / 4,
                    ),
                    itemBuilder: (_, __) => Container(
                      margin: EdgeInsets.all(6.w),
                      decoration: BoxDecoration(
                        color: context.tCard,
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      child: Shimmer.fromColors(
                        baseColor: context.tInput,
                        highlightColor: context.tDivider,
                        child: Column(
                          children: [
                            Expanded(
                              flex: 6,
                              child: ClipRRect(
                                borderRadius: BorderRadius.vertical(
                                    top: Radius.circular(16.r)),
                                child: Container(
                                    color: context.tInput,
                                    width: double.infinity),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: EdgeInsets.all(10.w),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      height: 12.h,
                                      width: 100.w,
                                      decoration: BoxDecoration(
                                          color: context.tInput,
                                          borderRadius: BorderRadius.circular(4.r)),
                                    ),
                                    SizedBox(height: 6.h),
                                    Container(
                                      height: 10.h,
                                      width: 60.w,
                                      decoration: BoxDecoration(
                                          color: context.tInput,
                                          borderRadius: BorderRadius.circular(4.r)),
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
                return const SizedBox();
              },
            ),
          ),
        ],
      ),
    );
  }
}
