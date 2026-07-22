import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/10_services_manager.dart';

import '../../bloc/workerbyService/workerbyService_bloc.dart';
import '../../bloc/workerbyService/workerbyService_state.dart';
import '../../export_files.dart';

class WorkersScreen extends StatefulWidget {
  final dynamic data;
  const WorkersScreen({super.key, required this.data});

  @override
  State<WorkersScreen> createState() => _WorkersScreenState();
}

class _WorkersScreenState extends State<WorkersScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();

  String _periodLabel(String? type) {
    switch (type) {
      case 'day':   return 'period_day'.tr();
      case 'week':  return 'period_week'.tr();
      case 'month': return 'period_month'.tr();
      default:      return type ?? '';
    }
  }

  @override
  void initState() {
    super.initState();
    ServicesManager.getWorkers(context, serviceId: '${widget.data["id"]}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        widget.data?["name"] ?? '- - -',
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: BlocBuilder<WorkerByServiceBloc, WorkerByServiceState>(
          builder: (context, state) {
        if (state is WorkerByServiceWaitingState) return _buildShimmer(context);
        if (state is WorkerByServiceSuccessState) {
          if (state.data.isEmpty) return _buildEmpty(context);
          // Newest first.
          final items = state.data.reversed.toList();
          return GridView.builder(
            padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 30.h),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, childAspectRatio: 3 / 4),
            itemCount: items.length,
            itemBuilder: (ctx, i) =>
                _WorkerCard(item: items[i], periodLabel: _periodLabel),
          );
        }
        return const SizedBox();
      }),
    );
  }

  Widget _buildEmpty(BuildContext context) => EmptyState(
        icon: Iconsax.people,
        title: 'workers_empty'.tr(),
        subtitle: "Hozircha bu yerda ustalar ro'yxati yo'q.",
      );

  Widget _buildShimmer(BuildContext context) => GridView.builder(
        padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 30.h),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, childAspectRatio: 3 / 4),
        itemCount: 6,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            margin: EdgeInsets.all(6.w),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(16.r),
            ),
          ),
        ),
      );
}

class _WorkerCard extends StatelessWidget {
  final dynamic item;
  final String Function(String?) periodLabel;
  const _WorkerCard({required this.item, required this.periodLabel});

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('workers', img) : null;
    final String name = item["fullname"]?.toString() ?? '';
    final String amount = '${item["amount"]}'.toMoney();
    final String period = periodLabel(item["payment_type"]?.toString());

    return GestureDetector(
      onTap: () => Navigator.of(context).pushNamed('/workerScreen',
          arguments: {"id": item["id"], "name": item["name"]}),
      child: Container(
        margin: EdgeInsets.all(6.w),
        decoration: BoxDecoration(
          color: context.tCard,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(children: [
          // ── avatar ──
          Expanded(
            flex: 7,
            child: ClipRRect(
              borderRadius:
                  BorderRadius.vertical(top: Radius.circular(16.r)),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      fit: BoxFit.cover,
                      width: double.infinity,
                      imageUrl: imageUrl,
                      memCacheWidth: 600,
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
          // ── info row ──
          Expanded(
            flex: 3,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 6.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(children: [
                    Icon(Iconsax.user, size: 12.sp, color: context.tSub),
                    SizedBox(width: 4.w),
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                            color: context.tText,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ]),
                  SizedBox(height: 3.h),
                  Row(children: [
                    Icon(Iconsax.dollar_circle,
                        size: 12.sp, color: AppConstant.primaryColor),
                    SizedBox(width: 4.w),
                    Text(
                      "$amount / $period",
                      style: TextStyle(
                          color: AppConstant.primaryColor,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ]),
      ),
    );
  }
}


// ignore: must_be_immutable
