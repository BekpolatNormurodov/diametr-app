import 'package:flutter_phone_direct_caller/flutter_phone_direct_caller.dart';
import 'package:stroymarket/core/extensions/str.dart';
import 'package:stroymarket/manager/10_services_manager.dart';

import '../../bloc/worker/worker_bloc.dart';
import '../../bloc/worker/worker_state.dart';
import '../../export_files.dart';
import '../../widgets/common/custom_button.dart';

class WorkerScreen extends StatefulWidget {
  final String? id;
  final String? name;
  const WorkerScreen({super.key, required this.id, required this.name});

  @override
  State<WorkerScreen> createState() => _WorkerScreenState();
}

class _WorkerScreenState extends State<WorkerScreen> {
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
    ServicesManager.getWorkerById(context, WorkerId: widget.id ?? '');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        scaffoldKey,
        widget.name ?? '',
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: BlocBuilder<WorkerBloc, WorkerState>(builder: (context, state) {
        if (state is WorkerWaitingState) return _buildLoading(context);
        if (state is WorkerSuccessState) {
          if (state.data == null) return _buildEmpty(context);
          return _buildBody(context, state.data);
        }
        return const SizedBox();
      }),
    );
  }

  Widget _buildLoading(BuildContext context) => Center(
        child: CircularProgressIndicator(
          color: AppConstant.primaryColor,
          backgroundColor: AppConstant.primaryColor.withValues(alpha: 0.15),
          strokeWidth: 4,
          strokeCap: StrokeCap.round,
        ),
      );

  Widget _buildEmpty(BuildContext context) => EmptyState(
        icon: Iconsax.user_remove,
        title: 'worker_not_found'.tr(),
        subtitle: "Bu usta haqida ma'lumot topilmadi.",
      );

  Widget _buildBody(BuildContext context, dynamic data) {
    final String? imgPath = data["image"]?.toString();
    final imageUrl =
        imgPath != null ? Endpoints.img('workers', imgPath) : null;
    final String fullname   = data["fullname"]?.toString() ?? '';
    final String phone      = data["phone"]?.toString() ?? '';
    final String amount     = '${data["amount"]}'.toMoney();
    final String period     = _periodLabel(data["payment_type"]?.toString());
    final String desc       = data["desc"]?.toString() ?? '';

    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 80.h),
      children: [
        // ── Avatar ──────────────────────────────────────────────
        Center(
          child: Container(
            height: 150.h,
            width: 150.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppConstant.primaryColor.withValues(alpha: 0.4),
                width: 2.5,
              ),
            ),
            child: ClipOval(
              child: imageUrl != null
                  ? CachedNetworkImage(
                      fit: BoxFit.cover,
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
        ),
        SizedBox(height: 28.h),

        // ── Info cards ──────────────────────────────────────────
        _InfoTile(icon: Iconsax.user, text: fullname),
        SizedBox(height: 12.h),
        _InfoTile(icon: Iconsax.mobile, text: '+$phone'),
        SizedBox(height: 12.h),
        _InfoTile(
          icon: Iconsax.dollar_circle,
          text: '$amount so\'m / $period',
          accent: true,
        ),
        if (desc.isNotEmpty) ...[
          SizedBox(height: 12.h),
          _InfoTile(icon: Iconsax.info_circle, text: desc, multiline: true),
        ],
        SizedBox(height: 36.h),

        // ── Call button ─────────────────────────────────────────
        CustomButton(
          onPressed: () async =>
              FlutterPhoneDirectCaller.callNumber('+$phone'),
          text: 'worker_connect'.tr(),
          width: 1.sw,
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool accent;
  final bool multiline;
  const _InfoTile({
    required this.icon,
    required this.text,
    this.accent = false,
    this.multiline = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = accent ? AppConstant.primaryColor : context.tText;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: context.tCard,
        borderRadius: BorderRadius.circular(12.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment:
            multiline ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: color,
                fontSize: 13.sp,
                fontWeight: accent ? FontWeight.w600 : FontWeight.w400,
              ),
              maxLines: multiline ? null : 1,
              overflow: multiline ? TextOverflow.visible : TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
