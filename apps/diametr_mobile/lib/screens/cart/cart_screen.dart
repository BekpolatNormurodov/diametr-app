// ignore_for_file: file_names, prefer_const_constructors

import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:map_launcher/map_launcher.dart';
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/core/network/dio_Client.dart';
import 'package:stroymarket/services/storage/storage_service.dart';

import 'package:dio/dio.dart' as dio;
import '../../export_files.dart';
import '../../services/loading/loading_service.dart';
import '../../services/location/location_service.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  // в”Ђв”Ђ per-shop fetched data в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  Map<String, Map<String, dynamic>> shopsData = {};
  Map<String, String?> selectedTypes = {};        // shopId в†’ "MARKET"|"FIXED"|"YANDEX"
  Map<String, String?> selectedLocationTypes = {}; // shopId в†’ label
  Map<String, dynamic> orderLocations = {};        // shopId в†’ {lat, lon}
  bool isLoading = true;

  // ignore: unused_field
  List _dummy = [
    {
      "image":
          'https://source.unsplash.com/user/hocza/three-silver-keys-y5N2HDwagVw',
      "title": "Kalit",
    },
    {
      "image":
          'https://source.unsplash.com/user/hocza/brown-wooden-hammer-D3nouOYbALc',
      "title": "Bolg'a",
    },
    {
      "image":
          'https://source.unsplash.com/user/hocza/white-disposable-lighter-rXgg90zA820',
      "title": "Zajigalka",
    },
  ];

  String _typeLabel(String name) {
    switch (name) {
      case 'MARKET': return 'delivery_market'.tr();
      case 'YANDEX': return 'delivery_yandex'.tr();
      case 'FIXED':  return 'delivery_fixed'.tr();
      default:       return name;
    }
  }

  LoadingService loadingService = LoadingService();
  List savatchaItem = [];

  @override
  void initState() {
    savatchaItem = StorageService().read(StorageService.savatcha) ?? [];
    _fetchAllShops();
    super.initState();
  }

  /// Fetch shop data for every unique shop_id in cart.
  Future<void> _fetchAllShops() async {
    if (savatchaItem.isEmpty) {
      setState(() => isLoading = false);
      return;
    }
    final Set<String> shopIds =
        savatchaItem.map<String>((it) => it["shop_id"].toString()).toSet();
    final DioClient client = DioClient();
    final String? token = StorageService().read(StorageService.token);
    for (final String shopId in shopIds) {
      try {
        final resp = await client.get(
          Endpoints.Shop + shopId,
          queryParameters: {'key': Endpoints.authKey},
          options: dio.Options(
              headers: {"Authorization": "Bearer ${token ?? ""}"}),
        );
        if (resp.statusCode == 200) {
          shopsData[shopId] = Map<String, dynamic>.from(resp.data);
          final List types =
              ((resp.data["types"] ?? []) as List)
                  .where((e) => e["value"] == "true")
                  .toList();
          if (types.isEmpty) selectedTypes[shopId] = "MARKET";
        }
      } catch (e) {
        // silent
      }
    }
    setState(() => isLoading = false);
  }

  // в”Ђв”Ђ grouped cart items by shop в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  Map<String, List> get _grouped {
    final Map<String, List> g = {};
    for (final item in savatchaItem) {
      g.putIfAbsent(item["shop_id"].toString(), () => []).add(item);
    }
    return g;
  }

  // в”Ђв”Ђ price helpers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  int _itemsTotal() {
    double t = 0;
    for (final it in savatchaItem) t += it["price"] * it["count"];
    return t.toInt();
  }

  int _deliveryForShop(String shopId) {
    if (selectedTypes[shopId] == "FIXED") {
      return (double.tryParse(
              shopsData[shopId]?["delivery_amount"]?.toString() ?? "0") ??
          0)
          .toInt();
    }
    return 0;
  }

  int _totalDelivery() {
    int t = 0;
    for (final sid in _grouped.keys) t += _deliveryForShop(sid);
    return t;
  }

  int _grandTotal() => _itemsTotal() + _totalDelivery();

  bool get _canConfirm {
    if (savatchaItem.isEmpty) return false;
    for (final sid in _grouped.keys) {
      if (selectedTypes[sid] == null) return false;
      if (selectedTypes[sid] != "MARKET" && orderLocations[sid] == null) {
        return false;
      }
    }
    return true;
  }

  // в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
  @override
  Widget build(BuildContext context) {
    final scaffoldKey = GlobalKey<ScaffoldState>();
    return Scaffold(
      backgroundColor: context.tBg,
      resizeToAvoidBottomInset: true,
      appBar: CustomAppBar(scaffoldKey, 'cart'.tr(), () {
        Navigator.of(context).pop();
      }, 'assets/icons/chevron-left.png', actions: [
        if (savatchaItem.isNotEmpty)
          GestureDetector(
            onTap: () async {
              await StorageService().remove(StorageService.savatcha);
              savatchaItem = StorageService().read(StorageService.savatcha) ?? [];
              context.read<SavatchaBloc>().changeValue(savatchaItem);
              setState(() {});
              AppToast.show(context, message: 'cart_cleared'.tr(), type: ToastType.info);
            },
            child: const Icon(Iconsax.trash, size: 19),
          )
      ]),
      body: _buildBody(),
    );
  }

  // в”Ђв”Ђ main body в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  Widget _buildBody() {
    if (savatchaItem.isEmpty) {
      return EmptyState(
        icon: Iconsax.shopping_cart,
        title: 'empty_cart'.tr(),
        subtitle: "Savatchaga mahsulot qo'shing va buyurtmani rasmiylashtiring.",
      );
    }
    if (isLoading) {
      return _buildCartSkeleton();
    }
    return Stack(
      children: [
        ListView(
          padding: EdgeInsets.only(bottom: 120.h),
          children: [
            ..._grouped.entries
                .map((e) => _buildShopSection(e.key, e.value))
                ,
            _buildSummary(),
          ],
        ),
        // Sticky bottom CTA
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: _buildStickyCheckout(),
        ),
      ],
    );
  }

  // ── shimmer skeleton ──
  Widget _buildCartSkeleton() {
    return SkeletonGroup(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // banner
          SkeletonBox(width: 1.sw, height: 180.h, radius: 0),
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 180.w, height: 16.h, radius: 6),
                SizedBox(height: 10.h),
                SkeletonBox(width: 240.w, height: 12.h, radius: 4),
                SizedBox(height: 24.h),
                ...List.generate(3, (_) => Padding(
                  padding: EdgeInsets.only(bottom: 12.h),
                  child: Row(children: [
                    SkeletonBox(width: 70.w, height: 70.w, radius: 12),
                    SizedBox(width: 12.w),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 1.sw * 0.55, height: 13.h, radius: 4),
                        SizedBox(height: 8.h),
                        SkeletonBox(width: 70.w, height: 11.h, radius: 4),
                      ],
                    )),
                    SkeletonBox(width: 60.w, height: 14.h, radius: 4),
                  ]),
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── sticky bottom checkout bar ──
  Widget _buildStickyCheckout() {
    final primary = AppConstant.primaryColor;
    final total = _grandTotal();
    return Container(
      padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 16.h),
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20.r),
          topRight: Radius.circular(20.r),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: context.isDark ? 0.4 : 0.10),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('total'.tr(),
                    style: TextStyle(
                        color: context.tSub,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.3)),
                SizedBox(height: 2.h),
                Text("${total.toString().toMoney()} so'm",
                    style: TextStyle(
                        color: primary,
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w800)),
              ],
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(14.r),
                  onTap: () {
                    if (_canConfirm) {
                      _submitOrders();
                    } else {
                      AppToast.show(
                        context,
                        message: selectedTypes.values.any((v) => v == null)
                            ? 'cart_select_delivery'.tr()
                            : 'cart_select_address'.tr(),
                        type: ToastType.warning,
                      );
                    }
                  },
                  child: Ink(
                    height: 52.h,
                    decoration: BoxDecoration(
                      gradient: _canConfirm
                          ? LinearGradient(colors: [
                              primary,
                              Color.lerp(primary, Colors.black, 0.18) ??
                                  primary,
                            ])
                          : null,
                      color: _canConfirm ? null : AppConstant.greyColor,
                      borderRadius: BorderRadius.circular(14.r),
                      boxShadow: _canConfirm
                          ? [
                              BoxShadow(
                                color: primary.withValues(alpha: 0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              )
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('confirm'.tr(),
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15.sp,
                                  fontWeight: FontWeight.w700)),
                          SizedBox(width: 8.w),
                          Icon(Iconsax.arrow_right_3,
                              color: Colors.white, size: 18.sp),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // в”Ђв”Ђ one section per shop в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  Widget _buildShopSection(String shopId, List items) {
    final shop = shopsData[shopId];
    if (shop == null) return const SizedBox();

    // Backend may return "value" as either bool true or string "true".
    List shopTypes = ((shop["types"] ?? []) as List)
        .where((e) {
          final v = e is Map ? e["value"] : null;
          return v == true || v == "true" || v == 1 || v == "1";
        })
        .toList();
    // Always provide at least MARKET (pickup) so the user is never stuck.
    if (shopTypes.isEmpty) {
      shopTypes = [
        {"name": "MARKET", "value": "true"},
      ];
    }
    final String shopName = shop["name"]?.toString() ?? "Do'kon";
    final String? shopImage = shop["image"]?.toString();
    final admin =
        (shop["admins"] is List && (shop["admins"] as List).isNotEmpty)
            ? shop["admins"][0]
            : null;
    final primary = AppConstant.primaryColor;

    return Container(
      margin: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 4.h),
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black
                .withValues(alpha: context.isDark ? 0.30 : 0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // shop banner with overlay and map button
          ClipRRect(
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20.r),
              topRight: Radius.circular(20.r),
            ),
            child: SizedBox(
              height: 160.h,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  shopImage != null
                      ? CachedNetworkImage(
                          imageUrl: Endpoints.img('shops', shopImage),
                          fit: BoxFit.cover,
                          memCacheWidth: 1080,
                          placeholder: (_, __) => Shimmer.fromColors(
                            baseColor: context.tInput,
                            highlightColor: context.tDivider,
                            child: Container(color: context.tInput),
                          ),
                          errorWidget: (_, __, ___) =>
                              const AppImagePlaceholder(),
                        )
                      : const AppImagePlaceholder(),
                  IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.65),
                          ],
                          stops: const [0.45, 1.0],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 14.w,
                    right: 70.w,
                    bottom: 12.h,
                    child: Text(
                      shopName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                        shadows: const [
                          Shadow(blurRadius: 4, color: Colors.black54),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12.h,
                    right: 12.w,
                    child: GestureDetector(
                      onTap: () async {
                        try {
                          final coords = Coords(
                            double.tryParse(shop["location"]?["lat"]
                                        ?.toString() ??
                                    "0") ??
                                0,
                            double.tryParse(shop["location"]?["lon"]
                                        ?.toString() ??
                                    "0") ??
                                0,
                          );
                          final maps = await MapLauncher.installedMaps;
                          showModalBottomSheet(
                            context: context,
                            builder: (ctx) => SafeArea(
                              child: SingleChildScrollView(
                                child: Wrap(
                                  children: maps
                                      .map((m) => ListTile(
                                            onTap: () => m.showMarker(
                                                coords: coords,
                                                title: shopName),
                                            title: Text(m.mapName),
                                            leading: SvgPicture.asset(
                                                m.icon,
                                                height: 30,
                                                width: 30),
                                          ))
                                      .toList(),
                                ),
                              ),
                            ),
                          );
                        } catch (_) {}
                      },
                      child: Container(
                        width: 44.w,
                        height: 44.w,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: primary.withValues(alpha: 0.5),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Icon(Iconsax.location,
                            color: primary, size: 22.sp),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // info chips
          Padding(
            padding: EdgeInsets.fromLTRB(14.w, 12.h, 14.w, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (shop["address"] != null)
                  _InfoChip(
                      icon: Iconsax.location,
                      text: shop["address"].toString()),
                if (admin != null) ...[
                  SizedBox(height: 8.h),
                  _InfoChip(
                      icon: Iconsax.call, text: '+${admin["phone"]}'),
                ],
              ],
            ),
          ),

          // items header
          Padding(
            padding: EdgeInsets.fromLTRB(14.w, 14.h, 14.w, 8.h),
            child: Row(
              children: [
                Icon(Iconsax.box, size: 16.sp, color: primary),
                SizedBox(width: 8.w),
                Text('cart_items'.tr(),
                    style: TextStyle(
                        color: context.tText,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w700)),
                SizedBox(width: 6.w),
                Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: 7.w, vertical: 2.h),
                  decoration: BoxDecoration(
                    color: primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Text('${items.length}',
                      style: TextStyle(
                          color: primary,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),

          // items
          ListView.builder(
            itemCount: items.length,
            shrinkWrap: true,
            padding: EdgeInsets.symmetric(horizontal: 14.w),
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              final item = items[index];
              final globalIndex = savatchaItem.indexOf(item);
              return Padding(
                padding: EdgeInsets.only(bottom: 8.h),
                child: Slidable(
                  key: ValueKey('$shopId-$index'),
                  endActionPane: ActionPane(
                    motion: const ScrollMotion(),
                    children: [
                      SlidableAction(
                        onPressed: (ctx) async {
                          final List data = StorageService()
                                  .read(StorageService.savatcha) ??
                              [];
                          data.removeAt(globalIndex);
                          await context
                              .read<SavatchaBloc>()
                              .changeValue(data);
                          await StorageService()
                              .write(StorageService.savatcha, data);
                          savatchaItem = List.from(data);
                          setState(() {});
                          AppToast.show(context,
                              message: 'cart_item_deleted'.tr(),
                              type: ToastType.info);
                        },
                        backgroundColor: const Color(0xFFFF647C),
                        foregroundColor: Colors.white,
                        borderRadius: BorderRadius.circular(14.r),
                        icon: Iconsax.trash,
                        label: 'delete'.tr(),
                      ),
                    ],
                  ),
                  child: Container(
                    padding: EdgeInsets.all(10.w),
                    decoration: BoxDecoration(
                      color: context.tBg,
                      borderRadius: BorderRadius.circular(14.r),
                      border: Border.all(
                          color:
                              context.tDivider.withValues(alpha: 0.5),
                          width: 1),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12.r),
                          child: SizedBox(
                            width: 72.w,
                            height: 72.w,
                            child: item['image'] != null &&
                                    item['image'].toString().trim().isNotEmpty
                                ? CachedNetworkImage(
                                    fit: BoxFit.cover,
                                    memCacheWidth: 400,
                                    imageUrl: Endpoints.img(
                                        'product-items', item['image']),
                                    placeholder: (_, __) =>
                                        Shimmer.fromColors(
                                      baseColor: context.tInput,
                                      highlightColor: context.tDivider,
                                      child: Container(
                                          color: context.tInput),
                                    ),
                                    errorWidget: (_, __, ___) =>
                                        AppImagePlaceholder(
                                            minimal: true,
                                            puckSize: 36.w,
                                            iconSize: 14.sp),
                                  )
                                : AppImagePlaceholder(
                                    minimal: true,
                                    puckSize: 36.w,
                                    iconSize: 14.sp),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${item['product_name']}, ${item['name']}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: context.tText,
                                    fontSize: 13.sp,
                                    fontWeight: FontWeight.w600,
                                    height: 1.2),
                              ),
                              SizedBox(height: 6.h),
                              Row(
                                children: [
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 7.w, vertical: 2.h),
                                    decoration: BoxDecoration(
                                      color: primary
                                          .withValues(alpha: 0.10),
                                      borderRadius:
                                          BorderRadius.circular(6.r),
                                    ),
                                    child: Text('x${item['count']}',
                                        style: TextStyle(
                                            color: primary,
                                            fontSize: 11.sp,
                                            fontWeight:
                                                FontWeight.w700)),
                                  ),
                                  SizedBox(width: 6.w),
                                  Expanded(
                                    child: Text(
                                      "${item['price'].toString().toMoney()} so'm",
                                      style: TextStyle(
                                          color: context.tSub,
                                          fontSize: 11.sp,
                                          fontWeight:
                                              FontWeight.w500),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        SizedBox(width: 8.w),
                        Text(
                          "${(item['price'] * item['count']).toString().toMoney()} so'm",
                          style: TextStyle(
                              color: primary,
                              fontSize: 13.sp,
                              fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

          // delivery type
          Padding(
            padding: EdgeInsets.fromLTRB(14.w, 18.h, 14.w, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(Iconsax.truck_fast,
                      size: 16.sp, color: primary),
                  SizedBox(width: 8.w),
                  Text('cart_delivery_type'.tr(),
                      style: TextStyle(
                          color: context.tText,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w700)),
                ]),
                SizedBox(height: 10.h),
                if (shopTypes.isNotEmpty)
                  ...List.generate(shopTypes.length, (i) {
                    final typeName = shopTypes[i]["name"].toString();
                    final isSelected =
                        selectedTypes[shopId] == typeName;
                    final IconData icon = typeName == 'MARKET'
                        ? Iconsax.shop
                        : typeName == 'YANDEX'
                            ? Iconsax.car
                            : Iconsax.box_tick;
                    return Padding(
                      padding: EdgeInsets.only(bottom: 8.h),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12.r),
                          onTap: () {
                            setState(() {
                              selectedTypes[shopId] = typeName;
                              if (typeName == "MARKET") {
                                orderLocations.remove(shopId);
                                selectedLocationTypes.remove(shopId);
                              }
                            });
                          },
                          child: AnimatedContainer(
                            duration:
                                const Duration(milliseconds: 180),
                            padding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 12.h),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? primary.withValues(alpha: 0.08)
                                  : Colors.transparent,
                              border: Border.all(
                                color: isSelected
                                    ? primary
                                    : context.tDivider
                                        .withValues(alpha: 0.6),
                                width: isSelected ? 1.5 : 1,
                              ),
                              borderRadius:
                                  BorderRadius.circular(12.r),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36.w,
                                  height: 36.w,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? primary
                                        : primary
                                            .withValues(alpha: 0.10),
                                    borderRadius:
                                        BorderRadius.circular(10.r),
                                  ),
                                  child: Icon(icon,
                                      color: isSelected
                                          ? Colors.white
                                          : primary,
                                      size: 18.sp),
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(_typeLabel(typeName),
                                          style: TextStyle(
                                              fontSize: 14.sp,
                                              color: context.tText,
                                              fontWeight:
                                                  FontWeight.w700)),
                                      if (typeName == "FIXED")
                                        Padding(
                                          padding: EdgeInsets.only(
                                              top: 2.h),
                                          child: Text(
                                            '${(double.tryParse(shop["delivery_amount"]?.toString() ?? "0") ?? 0).toInt().toString().toMoney()} so\'m',
                                            style: TextStyle(
                                                color: context.tSub,
                                                fontSize: 11.sp,
                                                fontWeight:
                                                    FontWeight.w500),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                AnimatedContainer(
                                  duration: const Duration(
                                      milliseconds: 180),
                                  width: 20.w,
                                  height: 20.w,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isSelected
                                        ? primary
                                        : Colors.transparent,
                                    border: Border.all(
                                      color: isSelected
                                          ? primary
                                          : context.tDivider,
                                      width: 2,
                                    ),
                                  ),
                                  child: isSelected
                                      ? Icon(Icons.check,
                                          color: Colors.white,
                                          size: 14.sp)
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),

                if (selectedTypes[shopId] != null &&
                    selectedTypes[shopId] != "MARKET") ...[
                  SizedBox(height: 6.h),
                  Row(children: [
                    Icon(Iconsax.location_tick,
                        size: 16.sp, color: primary),
                    SizedBox(width: 8.w),
                    Text('cart_address_label'.tr(),
                        style: TextStyle(
                            color: context.tText,
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w700)),
                  ]),
                  SizedBox(height: 10.h),
                  ...List.generate(2, (i) {
                    final labels = [
                      'cart_current_location'.tr(),
                      'cart_other_location'.tr()
                    ];
                    final icons = [
                      Iconsax.gps,
                      Iconsax.map_1
                    ];
                    final isSelected =
                        selectedLocationTypes[shopId] == labels[i];
                    return Padding(
                      padding: EdgeInsets.only(bottom: 8.h),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12.r),
                          onTap: () async {
                            if (i == 1) {
                              final result = await Navigator.pushNamed(
                                  context, RouteNames.selectLocation);
                              if (result != null) {
                                orderLocations[shopId] = result;
                                setState(() => selectedLocationTypes[
                                    shopId] = labels[i]);
                              }
                            } else {
                              final pos = await LocationService
                                  .getCurrentPoint();
                              if (pos != null) {
                                orderLocations[shopId] = {
                                  "lat": pos.latitude,
                                  "lon": pos.longitude
                                };
                                setState(() => selectedLocationTypes[
                                    shopId] = labels[i]);
                              } else {
                                AppToast.show(context,
                                    message: 'location_error'.tr(),
                                    type: ToastType.error);
                              }
                            }
                          },
                          child: AnimatedContainer(
                            duration:
                                const Duration(milliseconds: 180),
                            padding: EdgeInsets.symmetric(
                                horizontal: 12.w, vertical: 12.h),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? primary.withValues(alpha: 0.08)
                                  : Colors.transparent,
                              border: Border.all(
                                color: isSelected
                                    ? primary
                                    : context.tDivider
                                        .withValues(alpha: 0.6),
                                width: isSelected ? 1.5 : 1,
                              ),
                              borderRadius:
                                  BorderRadius.circular(12.r),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36.w,
                                  height: 36.w,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? primary
                                        : primary
                                            .withValues(alpha: 0.10),
                                    borderRadius:
                                        BorderRadius.circular(10.r),
                                  ),
                                  child: Icon(icons[i],
                                      color: isSelected
                                          ? Colors.white
                                          : primary,
                                      size: 18.sp),
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Text(labels[i],
                                      style: TextStyle(
                                          fontSize: 14.sp,
                                          color: context.tText,
                                          fontWeight:
                                              FontWeight.w700)),
                                ),
                                AnimatedContainer(
                                  duration: const Duration(
                                      milliseconds: 180),
                                  width: 20.w,
                                  height: 20.w,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isSelected
                                        ? primary
                                        : Colors.transparent,
                                    border: Border.all(
                                      color: isSelected
                                          ? primary
                                          : context.tDivider,
                                      width: 2,
                                    ),
                                  ),
                                  child: isSelected
                                      ? Icon(Icons.check,
                                          color: Colors.white,
                                          size: 14.sp)
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
                SizedBox(height: 14.h),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummary() {
    final primary = AppConstant.primaryColor;
    return Container(
      margin: EdgeInsets.fromLTRB(12.w, 8.h, 12.w, 8.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: context.isDark ? 0.20 : 0.10),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(Iconsax.receipt_2, size: 18.sp, color: primary),
            SizedBox(width: 8.w),
            Text('cart_summary'.tr(),
                style: TextStyle(
                    color: context.tText,
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w700)),
          ]),
          SizedBox(height: 14.h),
          _summaryRow('cart_items'.tr(),
              "${_itemsTotal().toString().toMoney()} so'm",
              subdued: false),
          ..._grouped.keys.map((sid) {
            final type = selectedTypes[sid] ?? "";
            if (type == "MARKET" || type.isEmpty) return const SizedBox();
            final shopName =
                shopsData[sid]?["name"]?.toString() ?? "Do'kon";
            final delivery = _deliveryForShop(sid);
            return Padding(
              padding: EdgeInsets.only(top: 8.h),
              child: _summaryRow(
                '${'cart_delivery_row'.tr()} ($shopName)',
                type == "YANDEX"
                    ? 'Yandex'
                    : "${delivery.toString().toMoney()} so'm",
                subdued: true,
              ),
            );
          }),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 12.h),
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  context.tDivider.withValues(alpha: 0.0),
                  context.tDivider,
                  context.tDivider.withValues(alpha: 0.0),
                ]),
              ),
            ),
          ),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('total'.tr(),
                style: TextStyle(
                    color: context.tText,
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w700)),
            Text("${_grandTotal().toString().toMoney()} so'm",
                style: TextStyle(
                    color: primary,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w800)),
          ]),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool subdued = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: subdued ? context.tSub : context.tText,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w500)),
        ),
        SizedBox(width: 8.w),
        Text(value,
            style: TextStyle(
                color: context.tText,
                fontSize: 13.sp,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
  // в”Ђв”Ђ submit one order per shop в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  Future<void> _submitOrders() async {
    if (!_canConfirm) return;
    loadingService.showLoading(context);
    final List<String> orderIds = [];
    bool hasError = false;

    for (final entry in _grouped.entries) {
      final String shopId = entry.key;
      final List shopItems = entry.value;
      final String type = selectedTypes[shopId] ?? "MARKET";
      final dynamic location =
          type != "MARKET" ? orderLocations[shopId] : null;

      double itemsSum = 0;
      for (final it in shopItems) itemsSum += it["price"] * it["count"];
      final int amount = itemsSum.toInt() +
          (type == "FIXED"
              ? (double.tryParse(
                          shopsData[shopId]?["delivery_amount"]?.toString() ??
                              "0") ??
                      0)
                  .toInt()
              : 0);

      try {
        final client = DioClient();
        final String? token = StorageService().read(StorageService.token);
        final resp = await client.post(
          Endpoints.OrderCreate,
          data: {
            "shop_id": shopId,
            "delivery_type": type.toLowerCase(),
            "amount": amount,
            "location": location,
            "source": "MOBILE",
            "products": shopItems,
          },
          queryParameters: {'key': Endpoints.authKey},
          options: dio.Options(
              headers: {"Authorization": "Bearer ${token ?? ""}"}),
        );
        if (resp.statusCode == 201) {
          orderIds.add(resp.data["order_id"]?.toString() ?? "");
        } else {
          hasError = true;
        }
      } catch (_) {
        hasError = true;
      }
    }

    loadingService.closeLoading(context);

    if (orderIds.isNotEmpty) {
      savatchaItem = [];
      await StorageService().remove(StorageService.savatcha);
      if (mounted) {
        context.read<SavatchaBloc>().changeValue([]);
        Navigator.pop(context);
      }
      setState(() {});
      final String msg = orderIds.length == 1
          ? "Buyurtma raqami ${orderIds[0]}\nTarix bo'limidan kuzatishingiz mumkin"
          : "Buyurtmalar: ${orderIds.join(', ')}\nTarix bo'limidan kuzatishingiz mumkin";
      AppToast.show(context, message: msg, type: ToastType.success, duration: const Duration(seconds: 5));
    } else if (hasError) {
      AppToast.show(context, message: 'Buyurtma yuborishda xatolik', type: ToastType.error);
    }
  }
}

/// Small info row with a tinted icon chip + label text.
class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28.w,
          height: 28.w,
          decoration: BoxDecoration(
            color: AppConstant.primaryColor.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Icon(icon, size: 14.sp, color: AppConstant.primaryColor),
        ),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(
            text,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: context.tText,
              fontSize: 12.5.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
