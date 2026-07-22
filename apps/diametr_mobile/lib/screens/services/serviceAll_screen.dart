import 'package:stroymarket/bloc/serviceAll/serviceAll_bloc.dart';
import 'package:stroymarket/bloc/serviceAll/serviceAll_state.dart';
import 'package:stroymarket/manager/10_services_manager.dart';

import '../../export_files.dart';

class ServiceAllScreen extends StatefulWidget {
  const ServiceAllScreen({super.key});

  @override
  State<ServiceAllScreen> createState() => _ServiceAllScreenState();
}

class _ServiceAllScreenState extends State<ServiceAllScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    ServicesManager.getAll(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        _scaffoldKey,
        'services'.tr(),
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: BlocBuilder<ServiceAllBloc, ServiceAllState>(builder: (context, state) {
        if (state is ServiceAllWaitingState) return _buildShimmer(context);
        if (state is ServiceAllSuccessState) {
          if (state.data.isEmpty) return _buildEmpty(context);
          // Newest first.
          final items = state.data.reversed.toList();
          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 30.h),
            itemCount: items.length,
            itemBuilder: (ctx, i) => _ServiceCard(item: items[i]),
          );
        }
        return const SizedBox();
      }),
    );
  }

  Widget _buildEmpty(BuildContext context) => EmptyState(
        icon: Iconsax.briefcase,
        title: 'services_empty'.tr(),
        subtitle: "Tez orada yangi xizmatlar qo'shiladi.",
      );

  Widget _buildShimmer(BuildContext context) => ListView.builder(
        padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 30.h),
        itemCount: 4,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            height: 120.h,
            margin: EdgeInsets.only(bottom: 14.h),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(18.r),
            ),
          ),
        ),
      );
}

class _ServiceCard extends StatelessWidget {
  final dynamic item;
  const _ServiceCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('services', img) : null;
    final String name = item["name"]?.toString() ?? '';
    final String desc = item["desc"]?.toString() ?? '';

    return GestureDetector(
      onTap: () => Navigator.of(context)
          .pushNamed('/workersScreen', arguments: {"data": item}),
      child: Container(
        height: 120.h,
        margin: EdgeInsets.only(bottom: 14.h),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.14),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18.r),
          child: Stack(fit: StackFit.expand, children: [
            // в”Ђв”Ђ image в”Ђв”Ђ
            imageUrl != null
                ? CachedNetworkImage(
                    fit: BoxFit.cover,
                    imageUrl: imageUrl,
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
            // в”Ђв”Ђ gradient в”Ђв”Ђ
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withValues(alpha: 0.72),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            // в”Ђв”Ђ texts в”Ђв”Ђ
            Padding(
              padding:
                  EdgeInsets.symmetric(horizontal: 18.w, vertical: 14.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (desc.isNotEmpty) ...[
                    SizedBox(height: 4.h),
                    Text(
                      desc,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 12.sp),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            // в”Ђв”Ђ arrow в”Ђв”Ђ
            Positioned(
              right: 16.w,
              top: 0,
              bottom: 0,
              child: Center(
                child: Container(
                  padding: EdgeInsets.all(8.w),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.arrow_right_2,
                      color: Colors.white, size: 16.sp),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
