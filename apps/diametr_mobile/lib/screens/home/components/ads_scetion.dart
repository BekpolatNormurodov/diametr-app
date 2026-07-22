import 'package:carousel_slider/carousel_slider.dart';

import '../../../bloc/ads/ads_bloc.dart';
import '../../../bloc/ads/ads_state.dart';
import '../../../export_files.dart';

class AdsSection extends StatefulWidget {
  const AdsSection({Key? key}) : super(key: key);

  @override
  State<AdsSection> createState() => _AdsSectionState();
}

class _AdsSectionState extends State<AdsSection> {
  int _activeIndex = 0;
  final _ctrl = CarouselSliderController();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdsBloc, AdsState>(builder: (context, state) {
      if (state is AdsSuccessState) {
        if (state.data.isEmpty) return const SizedBox.shrink();

        // Newest first.
        final adsData = state.data.reversed.toList();
        final total = adsData.length;

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: 8.w),
          child: Column(
            children: [
            // ─── Carousel ───────────────────────────────────────────
            CarouselSlider.builder(
              carouselController: _ctrl,
              itemCount: total,
              options: CarouselOptions(
                height: 200.h,
                viewportFraction: 0.90,
                enableInfiniteScroll: total > 1,
                enlargeCenterPage: true,
                enlargeFactor: 0.12,
                autoPlay: total > 1,
                autoPlayInterval: const Duration(seconds: 4),
                autoPlayAnimationDuration:
                    const Duration(milliseconds: 650),
                autoPlayCurve: Curves.easeInOutCubic,
                onPageChanged: (i, _) => setState(() => _activeIndex = i),
              ),
              itemBuilder: (context, index, _) {
                final item = adsData[index];
                final imageUrl = item['image'] != null
                    ? Endpoints.img('ads', item['image'])
                    : AppConstant.defaultImage;

                return GestureDetector(
                  onTap: () {},
                  child: Container(
                    margin: EdgeInsets.symmetric(vertical: 4.h),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.22),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22.r),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // ── Image ──
                          CachedNetworkImage(
                            fit: BoxFit.cover,
                            imageUrl: imageUrl,
                            placeholder: (_, __) => Shimmer.fromColors(
                              baseColor:
                                  context.tInput,
                              highlightColor:
                                  context.tIconBg,
                              child: Container(
                                  color: context.tInput),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              color: context.tInput,
                              child: Icon(Iconsax.gallery_slash,
                                  color: context.tSub,
                                  size: 32.sp),
                            ),
                          ),
                          // ── Bottom gradient ──
                          Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.transparent,
                                    Colors.black.withValues(alpha: 0.0),
                                    Colors.black.withValues(alpha: 0.65),
                                  ],
                                  stops: const [0.0, 0.45, 1.0],
                                ),
                              ),
                            ),
                          ),
                          // ── Top: index badge ──
                          if (total > 1)
                            Positioned(
                              top: 12.h,
                              right: 12.w,
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 10.w, vertical: 5.h),
                                decoration: BoxDecoration(
                                  color:
                                      Colors.black.withValues(alpha: 0.45),
                                  borderRadius:
                                      BorderRadius.circular(20.r),
                                  border: Border.all(
                                      color: Colors.white
                                          .withValues(alpha: 0.20),
                                      width: 0.5),
                                ),
                                child: Text(
                                  '${_activeIndex + 1} / $total',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11.sp,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          // ── Bottom: title + subtitle ──
                          Positioned(
                            left: 14.w,
                            right: 80.w,
                            bottom: 14.h,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if ((item['title'] ?? '').isNotEmpty)
                                  Text(
                                    item['title'],
                                    style: TextStyle(
                                      fontSize: 15.sp,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      shadows: const [
                                        Shadow(
                                          color: Colors.black54,
                                          blurRadius: 8,
                                        )
                                      ],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                if ((item['subtitle'] ?? '').isNotEmpty) ...
                                  [
                                    SizedBox(height: 3.h),
                                    Text(
                                      item['subtitle'],
                                      style: TextStyle(
                                        fontSize: 12.sp,
                                        color: Colors.white
                                            .withValues(alpha: 0.80),
                                        fontWeight: FontWeight.w400,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ]
                              ],
                            ),
                          ),
                          // ── Green pulse badge (active) ──
                          if (index == _activeIndex)
                            Positioned(
                              bottom: 14.h,
                              right: 14.w,
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 10.w, vertical: 6.h),
                                decoration: BoxDecoration(
                                  color: AppConstant.primaryColor,
                                  borderRadius:
                                      BorderRadius.circular(10.r),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppConstant.primaryColor
                                          .withValues(alpha: 0.55),
                                      blurRadius: 10,
                                      spreadRadius: 1,
                                    )
                                  ],
                                ),
                                child: Text(
                                  'ad_badge'.tr(),
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10.sp,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),

            if (total > 1) ...
              [
                SizedBox(height: 12.h),
                // ─── Dot indicators ──────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(total, (i) {
                    final isActive = i == _activeIndex;
                    return GestureDetector(
                      onTap: () => _ctrl.animateToPage(i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 280),
                        curve: Curves.easeOut,
                        margin: EdgeInsets.symmetric(horizontal: 3.w),
                        width: isActive ? 22.w : 6.w,
                        height: 6.h,
                        decoration: BoxDecoration(
                          color: isActive
                              ? AppConstant.primaryColor
                              : context.tDivider,
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                      ),
                    );
                  }),
                ),
              ]
          ],
        ),
        );
      } else if (state is AdsWaitingState) {
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          child: Shimmer.fromColors(
            baseColor: context.tInput,
            highlightColor: context.tIconBg,
            child: Container(
              height: 200.h,
              decoration: BoxDecoration(
                color: context.tInput,
                borderRadius: BorderRadius.circular(22.r),
              ),
            ),
          ),
        );
      }
      return const SizedBox.shrink();
    });
  }
}
