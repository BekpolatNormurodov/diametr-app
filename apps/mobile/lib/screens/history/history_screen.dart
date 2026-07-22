import 'package:stroymarket/core/extensions/date_extension.dart';
import 'package:stroymarket/core/extensions/str.dart';

import '../../bloc/orderAll/orderAll_bloc.dart';
import '../../bloc/orderAll/orderAll_state.dart';
import '../../export_files.dart';
import '../../manager/3_order_manager.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    OrderManager.getAll(context);
    _searchCtrl.addListener(() => setState(() => _query = _searchCtrl.text.trim().toLowerCase()));
    super.initState();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List _filtered(List data) {
    if (_query.isEmpty) return data;
    return data.where((o) =>
        o["id"].toString().contains(_query) ||
        (o["status"] ?? '').toString().toLowerCase().contains(_query)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      drawerEnableOpenDragGesture: false,
      appBar: CustomAppBar(
        scaffoldKey,
        'history_title'.tr(),
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
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
                  Icon(Iconsax.search_normal, color: context.tSub, size: 18.sp),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      style: TextStyle(color: context.tText, fontSize: 14.sp),
                      decoration: InputDecoration(
                        hintText: 'history_search_hint'.tr(),
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
          // ── Body ──
          Expanded(
            child: RefreshIndicator(
              displacement: 60.h,
              backgroundColor: AppConstant.primaryColor,
              color: Colors.white,
              strokeWidth: 2.h,
              triggerMode: RefreshIndicatorTriggerMode.onEdge,
              onRefresh: () async => OrderManager.refreshAll(context),
              child: BlocBuilder<OrderAllBloc, OrderAllState>(
                builder: (context, state) {
                  if (state is OrderAllSuccessState) {
                    final items = _filtered(state.data ?? []);
                    if (items.isEmpty) {
                      return EmptyState(
                        icon: _query.isEmpty
                            ? Iconsax.receipt_1
                            : Iconsax.search_normal_1,
                        title: _query.isEmpty
                            ? 'history_empty'.tr()
                            : 'search_empty'.tr(),
                        subtitle: _query.isEmpty
                            ? "Bu yerda buyurtmalaringiz tarixi ko'rinadi."
                            : null,
                      );
                    }
                    return orderBody(items);
                  } else if (state is OrderAllWaitingState) {
                    return _buildShimmer();
                  }
                  // Error / Initial → still show the empty state so the
                  // user is not left looking at a blank screen.
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: 40.h),
                      EmptyState(
                        icon: Iconsax.receipt_1,
                        title: 'history_empty'.tr(),
                        subtitle: "Bu yerda buyurtmalaringiz tarixi ko'rinadi.",
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
      itemCount: 5,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: context.tInput,
        highlightColor: context.tDivider,
        child: Container(
          height: 120.h,
          margin: EdgeInsets.only(bottom: 12.h),
          decoration: BoxDecoration(
            color: context.tCard,
            borderRadius: BorderRadius.circular(16.r),
          ),
        ),
      ),
    );
  }

  final _statusCfg = <String, Map<String, dynamic>>{
    'CONFIRMED':  {'label': 'YETKAZILGAN', 'color': 0xFF00C48C, 'icon': Iconsax.tick_circle},
    'STARTED':    {'label': 'KUTILYAPTI',  'color': 0xFFFFCF5C, 'icon': Iconsax.clock},
    'FINISHED':   {'label': 'JARAYONDA',   'color': 0xFF0084F4, 'icon': Iconsax.timer_1},
    'CANCELLED':  {'label': 'RAD ETILGAN', 'color': 0xFFFF647C, 'icon': Iconsax.close_circle},
  };

  Widget statusWidget(order) {
    final status = order['status']?.toString() ?? '';
    final cfg = _statusCfg[status] ?? _statusCfg['CANCELLED']!;
    final color = Color(cfg['color'] as int);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(cfg['icon'] as IconData, color: color, size: 13.sp),
          SizedBox(width: 5.w),
          Text(
            cfg['label'] as String,
            style: TextStyle(fontSize: 11.sp, color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget orderBody(List data) {
    return ListView.builder(
      padding: EdgeInsets.fromLTRB(16.w, 4.h, 16.w, 20.h),
      itemCount: data.length,
      itemBuilder: (context, index) {
        final order = data[index];
        return GestureDetector(
          onTap: () => Navigator.of(context).pushNamed('/statusScreen', arguments: {
            'id': '${order['id']}',
            'order_id': '${order['id']}',
            'shop_id': '${order['shop_id']}',
            'status': '${order['status']}',
          }),
          child: Container(
            margin: EdgeInsets.only(bottom: 12.h),
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: context.tCard,
              borderRadius: BorderRadius.circular(18.r),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: context.isDark ? 0.18 : 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── top row: status + date ──
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    statusWidget(order),
                    Text(
                      DateTime.tryParse(order['createdAt'].toString()).toMyFormat(),
                      style: TextStyle(fontSize: 12.sp, color: context.tSub),
                    ),
                  ],
                ),
                Divider(thickness: 0.3, height: 16.h, color: context.tDivider),
                // ── order ID ──
                Row(
                  children: [
                    Icon(Iconsax.receipt_1, color: AppConstant.primaryColor, size: 16.sp),
                    SizedBox(width: 8.w),
                    Text(
                      'Buyurtma #${order['id']}',
                      style: TextStyle(
                        fontSize: 15.sp,
                        color: AppConstant.primaryColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 10.h),
                // ── amount + count ──
                Row(
                  children: [
                    Expanded(
                      child: _infoTile(
                        context,
                        label: 'UMUMIY QIYMAT',
                        value: '${(order['amount'] ?? 0).toString().toMoney()} so\'m',
                      ),
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: _infoTile(
                        context,
                        label: 'MAHSULOTLAR',
                        value: '${order['products']?.length ?? 0} ta',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _infoTile(BuildContext context, {required String label, required String value}) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
      decoration: BoxDecoration(
        color: context.tInput,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10.sp, color: context.tSub, fontWeight: FontWeight.w400)),
          SizedBox(height: 2.h),
          Text(value, style: TextStyle(fontSize: 13.sp, color: context.tText, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
