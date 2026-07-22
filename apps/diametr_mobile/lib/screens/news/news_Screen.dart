import 'package:stroymarket/bloc/news/news_bloc.dart';
import 'package:stroymarket/bloc/news/news_state.dart';
import 'package:stroymarket/manager/9_news_manager.dart';

import '../../export_files.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    NewsManager.getAll(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: context.tBg,
      appBar: CustomAppBar(
        _scaffoldKey,
        'news'.tr(),
        () => Navigator.of(context).pop(),
        'assets/icons/chevron-left.png',
      ),
      body: BlocBuilder<NewsBloc, NewsState>(builder: (context, state) {
        if (state is NewsWaitingState) return _buildShimmer(context);
        if (state is NewsSuccessState) {
          if (state.data.isEmpty) return _buildEmpty(context);
          // Newest first.
          final items = state.data.reversed.toList();
          return ListView.builder(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 30.h),
            itemCount: items.length,
            itemBuilder: (ctx, i) => _NewsCard(item: items[i]),
          );
        }
        return const SizedBox();
      }),
    );
  }

  Widget _buildEmpty(BuildContext context) => EmptyState(
        icon: Iconsax.document_text,
        title: 'news_empty'.tr(),
        subtitle: "Yangi maqolalar paydo bo'lganda shu yerda ko'rasiz.",
      );

  Widget _buildShimmer(BuildContext context) => ListView.builder(
        padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 30.h),
        itemCount: 4,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor: context.tInput,
          highlightColor: context.tDivider,
          child: Container(
            height: 220.h,
            margin: EdgeInsets.only(bottom: 16.h),
            decoration: BoxDecoration(
              color: context.tInput,
              borderRadius: BorderRadius.circular(20.r),
            ),
          ),
        ),
      );
}

class _NewsCard extends StatelessWidget {
  final dynamic item;
  const _NewsCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final String? img = item["image"]?.toString();
    final imageUrl = img != null ? Endpoints.img('news', img) : null;
    final String title = item["title"]?.toString() ?? '';
    final String subtitle = item["subtitle"]?.toString() ?? '';

    return Container(
      height: 220.h,
      margin: EdgeInsets.only(bottom: 16.h),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20.r),
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
                  errorWidget: (_, __, ___) => const AppImagePlaceholder(),
                )
              : const AppImagePlaceholder(),
          // в”Ђв”Ђ gradient overlay в”Ђв”Ђ
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.0),
                  Colors.black.withValues(alpha: 0.80),
                ],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          // в”Ђв”Ђ text в”Ђв”Ђ
          Positioned(
            left: 16.w,
            right: 16.w,
            bottom: 16.h,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title.isNotEmpty)
                  Text(
                    title,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w700,
                        shadows: const [
                          Shadow(color: Colors.black54, blurRadius: 8)
                        ]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (subtitle.isNotEmpty) ...[
                  SizedBox(height: 4.h),
                  Text(
                    subtitle,
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.80),
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
    );
  }
}

