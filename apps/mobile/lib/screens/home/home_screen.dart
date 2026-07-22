import 'package:geolocator/geolocator.dart';
import 'package:stroymarket/bloc/news/news_bloc.dart';
import 'package:stroymarket/bloc/news/news_state.dart';
import 'package:stroymarket/bloc/orderAll/orderAll_bloc.dart';
import 'package:stroymarket/bloc/orderAll/orderAll_state.dart';
import 'package:stroymarket/export_files.dart';
import 'package:stroymarket/manager/10_services_manager.dart';
import 'package:stroymarket/manager/5_product_manager.dart';
import 'package:stroymarket/manager/3_order_manager.dart';
import 'package:stroymarket/manager/4_category_manager.dart';
import 'package:stroymarket/manager/6_region_manager.dart';
import 'package:stroymarket/manager/7_ads_manager.dart';
import 'package:stroymarket/manager/9_news_manager.dart';
import 'package:stroymarket/screens/home/components/ads_scetion.dart';
import 'package:stroymarket/screens/home/components/category_section.dart';
import 'package:stroymarket/screens/home/components/header_section.dart';
import 'package:stroymarket/screens/home/components/more_and_cheap_section.dart';
import 'package:stroymarket/screens/home/components/region_filter.dart';
import 'package:stroymarket/screens/home/components/services_section.dart';
import 'package:stroymarket/screens/home/components/shop_section.dart';
import 'package:stroymarket/services/location/location_service.dart';
import 'package:stroymarket/widgets/common/custom_bottomsheet.dart';
import 'package:stroymarket/widgets/common/custom_drawer.dart';

import '../../bloc/savatcha/savatcha_bloc.dart';
import '../../manager/8_shop_manager.dart';
import '../../services/storage/storage_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  var scaffoldKey = GlobalKey<ScaffoldState>();

  Position? _userPosition;
  Timer? _locationTimer;
  StreamSubscription? _reconnectSub;

  Future<void> _updateLocation() async {
    final pos = await LocationService.getCurrentPoint();
    if (pos != null && mounted) setState(() => _userPosition = pos);
  }

  @override
  void initState() {
    super.initState();
    OrderManager.getAll(context);
    CategoryManager.getAll(context);
    ShopManager.getAll(context);
    AdsManager.getAll(context);
    ServicesManager.getAll(context);
    ProductManager.getAll(context);
    NewsManager.getAll(context);
    final savatchaItem = StorageService().read(StorageService.savatcha) ?? [];
    context.read<SavatchaBloc>().changeValue(savatchaItem);
    _updateLocation();
    _locationTimer = Timer.periodic(const Duration(seconds: 15), (_) => _updateLocation());
    _reconnectSub = ConnectivityService.instance.onReconnect.listen((_) {
      if (!mounted) return;
      OrderManager.getAll(context);
      CategoryManager.getAll(context);
      ShopManager.getAll(context);
      AdsManager.getAll(context);
      ServicesManager.getAll(context);
      ProductManager.getAll(context);
      NewsManager.getAll(context);
    });
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _reconnectSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext ctx) {
    return RefreshIndicator(
      displacement: 60.h,
      backgroundColor: AppConstant.primaryColor,
      color: Colors.white,
      strokeWidth: 2.h,
      triggerMode: RefreshIndicatorTriggerMode.onEdge,
      onRefresh: () async {
        setState(() {});
        OrderManager.getAll(context);
        CategoryManager.getAll(context);
        ShopManager.getAll(context);
        AdsManager.getAll(context);
        ServicesManager.getAll(context);
        ProductManager.getAll(context);
        NewsManager.getAll(context);
        List savatchaItem =
            StorageService().read(StorageService.savatcha) ?? [];
         context.read<SavatchaBloc>().changeValue(
                               savatchaItem);
      },
      child: Scaffold(
        key: scaffoldKey,
        drawerEnableOpenDragGesture: true,
        drawerScrimColor: Colors.black26,
        appBar: CustomAppBar(scaffoldKey, 'home_title'.tr(), () {
          scaffoldKey.currentState!.openDrawer();
        }, null, savatcha: true, isMenu: true, actions: [
          BlocBuilder<OrderAllBloc, OrderAllState>(
            builder: (context, orderState) {
              final activeCount = orderState is OrderAllSuccessState
                  ? (orderState.data ?? [])
                      .where((o) =>
                          o['status'] == 'STARTED' ||
                          o['status'] == 'FINISHED')
                      .length
                  : 0;
              return GestureDetector(
                onTap: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const _NotificationSheet(),
                ),
                child: Container(
                  margin: EdgeInsets.only(right: 4.w),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 38.w,
                        height: 38.w,
                        decoration: BoxDecoration(
                          color: context.tIconBg,
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Center(
                          child: Icon(Iconsax.notification,
                              color: context.tIconTint, size: 18.sp),
                        ),
                      ),
                      if (activeCount > 0)
                        Positioned(
                          right: -3,
                          top: -3,
                          child: Container(
                            padding: EdgeInsets.all(4.w),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFFFF647C),
                            ),
                            child: Text(
                              '$activeCount',
                              style: TextStyle(
                                fontSize: 9.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
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
        ]),
        drawer: CustomDrawer(scaffoldKey: scaffoldKey),
        floatingActionButton: customFloatingButton(),
        body: SafeArea(
          child: ListView(
            scrollDirection: Axis.vertical,
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            children: [
              SizedBox(height: 16.h),
              // ── Search bar ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 50),
                child: GestureDetector(
                  onTap: () => Navigator.of(ctx).pushNamed('/searchScreen'),
                  child: Container(
                    height: 50.h,
                    alignment: Alignment.center,
                    margin: EdgeInsets.symmetric(horizontal: 16.w),
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    decoration: BoxDecoration(
                      color: ctx.tInput,
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Iconsax.search_normal,
                          color: ctx.tText.withValues(alpha: 0.45),
                          size: 18.sp,
                        ),
                        SizedBox(width: 10.w),
                        Text(
                          'search_placeholder'.tr(),
                          style: TextStyle(
                            color: ctx.tText.withValues(alpha: 0.45),
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              // ── Ads (banner) ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 120),
                child: const AdsSection(),
              ),
              SizedBox(height: 20.h),
              // ── Categories ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 190),
                child: CategorySection(
                  header: HeaderSections(
                    title: 'categories_header'.tr(),
                    onTap: () => Navigator.of(ctx).pushNamed('/categoryScreen'),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              // ── Shops ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 260),
                child: ShopSection(
                  userLat: _userPosition?.latitude,
                  userLon: _userPosition?.longitude,
                  header: HeaderSections(
                    title: 'shops_header'.tr(),
                    onTap: () => Navigator.of(ctx).pushNamed('/marketAllScreen'),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              // ── Services ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 330),
                child: ServiceSection(
                  header: HeaderSections(
                    title: 'services_header'.tr(),
                    onTap: () => Navigator.of(ctx).pushNamed('/serviceAllScreen'),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              // ── Bestsellers (end) ──
              FadeUpWidget(
                delay: const Duration(milliseconds: 400),
                child: MoreAndCheapSection(
                  header: HeaderSections(
                    title: 'bestsellers_header'.tr(),
                    onTap: () => Navigator.of(ctx)
                        .pushNamed('/popularProductsScreen'),
                  ),
                ),
              ),
              SizedBox(height: 30.h),
            ],
          ),
        ),
      ),
    );
  }

  customFloatingButton<Widget>() {
    return FloatingActionButton.small(
      onPressed: () {
        RegionManager.getAll(context);
        customBottomsheet(
          context,
          regionFilter(),
        );
      },
      backgroundColor: AppConstant.primaryColor,
      child: Image.asset(
        'assets/icons/map-pin.png',
        scale: 3.sp,
        color: Colors.white,
      ),
    );
  }
}

// ─── Notification Sheet ───────────────────────────────────────────────────────

class _NotificationSheet extends StatefulWidget {
  const _NotificationSheet();

  @override
  State<_NotificationSheet> createState() => _NotificationSheetState();
}

class _NotificationSheetState extends State<_NotificationSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 0.78.sh,
      decoration: BoxDecoration(
        color: context.tBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              width: 40.w,
              height: 4.h,
              margin: EdgeInsets.only(top: 12.h),
              decoration: BoxDecoration(
                color: context.tDivider,
                borderRadius: BorderRadius.circular(2.r),
              ),
            ),
          ),
          // Header
          Padding(
            padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 0),
            child: Row(
              children: [
                Container(
                  width: 36.w,
                  height: 36.w,
                  decoration: BoxDecoration(
                    color: AppConstant.primaryColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10.r),
                  ),
                  child: Icon(Iconsax.notification,
                      color: AppConstant.primaryColor, size: 18.sp),
                ),
                SizedBox(width: 10.w),
                Text(
                  'notifications'.tr(),
                  style: TextStyle(
                    fontSize: 17.sp,
                    fontWeight: FontWeight.w700,
                    color: context.tText,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 14.h),
          // Pill tabs
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            child: Container(
              height: 42.h,
              decoration: BoxDecoration(
                color: context.tInput,
                borderRadius: BorderRadius.circular(12.r),
              ),
              padding: EdgeInsets.all(3.w),
              child: Row(
                children: [
                  _pillTab(context, 0, 'notif_orders'.tr()),
                  _pillTab(context, 1, 'notif_news'.tr()),
                ],
              ),
            ),
          ),
          SizedBox(height: 12.h),
          Divider(height: 0.5.h, color: context.tDivider),
          // Content
          Expanded(
            child: TabBarView(
              controller: _tab,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _ordersTab(context),
                _newsTab(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _pillTab(BuildContext context, int i, String label) {
    final sel = _tab.index == i;
    return Expanded(
      child: GestureDetector(
        onTap: () => _tab.animateTo(i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: sel ? AppConstant.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(10.r),
            boxShadow: sel
                ? [
                    BoxShadow(
                      color: AppConstant.primaryColor.withValues(alpha: 0.25),
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
              fontSize: 13.sp,
              fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _ordersTab(BuildContext context) {
    return BlocBuilder<OrderAllBloc, OrderAllState>(
      builder: (context, state) {
        if (state is OrderAllWaitingState) return _shimmer(context);
        if (state is OrderAllSuccessState) {
          final orders = (state.data ?? []).take(15).toList();
          if (orders.isEmpty) {
            return _emptyWidget(context, Iconsax.receipt_1, 'history_empty'.tr());
          }
          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 20.h),
            itemCount: orders.length,
            itemBuilder: (_, i) => _OrderNotifCard(order: orders[i]),
          );
        }
        return _emptyWidget(context, Iconsax.receipt_1, 'history_empty'.tr());
      },
    );
  }

  Widget _newsTab(BuildContext context) {
    return BlocBuilder<NewsBloc, NewsState>(
      builder: (context, state) {
        if (state is NewsWaitingState) return _shimmer(context);
        if (state is NewsSuccessState) {
          final news = (state.data ?? []).take(15).toList();
          if (news.isEmpty) {
            return _emptyWidget(
                context, Iconsax.document_text, 'news_empty'.tr());
          }
          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 20.h),
            itemCount: news.length,
            itemBuilder: (_, i) => _NewsNotifCard(item: news[i]),
          );
        }
        return _emptyWidget(
            context, Iconsax.document_text, 'news_empty'.tr());
      },
    );
  }

  Widget _emptyWidget(BuildContext context, IconData icon, String label) {
    return EmptyState(icon: icon, title: label);
  }

  Widget _shimmer(BuildContext context) {
    return ListView.builder(
      padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 20.h),
      itemCount: 5,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: context.tInput,
        highlightColor: context.tDivider,
        child: Container(
          height: 68.h,
          margin: EdgeInsets.only(bottom: 10.h),
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: BorderRadius.circular(14.r),
          ),
        ),
      ),
    );
  }
}

// ─── Order notification card ──────────────────────────────────────────────────

class _OrderNotifCard extends StatelessWidget {
  final dynamic order;
  const _OrderNotifCard({required this.order});

  static const _statusCfg = <String, Map<String, Object>>{
    'CONFIRMED': {
      'label': 'YETKAZILGAN',
      'color': 0xFF00C48C,
      'icon': Iconsax.tick_circle
    },
    'STARTED': {
      'label': 'KUTILYAPTI',
      'color': 0xFFFFCF5C,
      'icon': Iconsax.clock
    },
    'FINISHED': {
      'label': 'JARAYONDA',
      'color': 0xFF0084F4,
      'icon': Iconsax.timer_1
    },
    'CANCELLED': {
      'label': 'RAD ETILGAN',
      'color': 0xFFFF647C,
      'icon': Iconsax.close_circle
    },
  };

  @override
  Widget build(BuildContext context) {
    final status = order['status']?.toString() ?? '';
    final cfg = _statusCfg[status] ?? _statusCfg['CANCELLED']!;
    final color = Color(cfg['color'] as int);

    return GestureDetector(
      onTap: () {
        Navigator.of(context).pop();
        Navigator.of(context).pushNamed('/statusScreen', arguments: {
          'id': '${order['id']}',
          'order_id': '${order['id']}',
          'shop_id': '${order['shop_id']}',
          'status': '${order['status']}',
        });
      },
      child: Container(
        margin: EdgeInsets.only(bottom: 10.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(14.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withValues(alpha: context.isDark ? 0.18 : 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44.w,
              height: 44.w,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Icon(cfg['icon'] as IconData, color: color, size: 20.sp),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Buyurtma #${order['id']}',
                    style: TextStyle(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: context.tText,
                    ),
                  ),
                  SizedBox(height: 5.h),
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Text(
                      cfg['label'] as String,
                      style: TextStyle(
                          fontSize: 11.sp,
                          color: color,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            Icon(Iconsax.arrow_right_3, color: context.tSub, size: 16.sp),
          ],
        ),
      ),
    );
  }
}

// ─── News notification card ───────────────────────────────────────────────────

class _NewsNotifCard extends StatelessWidget {
  final dynamic item;
  const _NewsNotifCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final String? img = item['image']?.toString();
    final imageUrl = img != null ? Endpoints.img('news', img) : null;
    final String title = item['title']?.toString() ?? '';

    return GestureDetector(
      onTap: () {
        Navigator.of(context).pop();
        Navigator.of(context).pushNamed('/newsScreen');
      },
      child: Container(
        margin: EdgeInsets.only(bottom: 10.h),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(14.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withValues(alpha: context.isDark ? 0.18 : 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius:
                  BorderRadius.horizontal(left: Radius.circular(14.r)),
              child: SizedBox(
                width: 80.w,
                height: 72.h,
                child: imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: context.tInput),
                        errorWidget: (_, __, ___) =>
                            AppImagePlaceholder(minimal: true, puckSize: 36.w, iconSize: 14.sp),
                      )
                    : AppImagePlaceholder(minimal: true, puckSize: 36.w, iconSize: 14.sp),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 4.w),
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600,
                    color: context.tText,
                  ),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.only(right: 12.w),
              child:
                  Icon(Iconsax.arrow_right_3, color: context.tSub, size: 16.sp),
            ),
          ],
        ),
      ),
    );
  }
}
