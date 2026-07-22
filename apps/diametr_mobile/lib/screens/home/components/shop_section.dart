import 'dart:math';
import 'package:stroymarket/bloc/shopAll/shopAll_bloc.dart';
import 'package:stroymarket/bloc/shopAll/shopAll_state.dart';

import '../../../export_files.dart';

double _distKm(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371.0;
  final dLat = (lat2 - lat1) * pi / 180;
  final dLon = (lon2 - lon1) * pi / 180;
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
}

// ignore: must_be_immutable
class ShopSection extends StatelessWidget {
  ShopSection({Key? key, required this.header, this.userLat, this.userLon})
      : super(key: key);
  Widget header;
  final double? userLat;
  final double? userLon;

  List _sorted(List data) {
    if (userLat == null || userLon == null) return data;
    final copy = List.from(data);
    copy.sort((a, b) {
      final aLat = double.tryParse(a["location"]?["lat"]?.toString() ?? '') ?? 0;
      final aLon = double.tryParse(a["location"]?["lon"]?.toString() ?? '') ?? 0;
      final bLat = double.tryParse(b["location"]?["lat"]?.toString() ?? '') ?? 0;
      final bLon = double.tryParse(b["location"]?["lon"]?.toString() ?? '') ?? 0;
      return _distKm(userLat!, userLon!, aLat, aLon)
          .compareTo(_distKm(userLat!, userLon!, bLat, bLon));
    });
    return copy;
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ShopAllBloc, ShopAllState>(builder: (context, state) {
      if (state is ShopAllSuccessState && state.data.isEmpty) {
        return const SizedBox.shrink();
      }

      Widget content;
      if (state is ShopAllSuccessState) {
        // Newest first; if user location is available we still sort by distance below.
        final reversed = state.data.reversed.toList();
        final sorted = _sorted(reversed);
        final items = sorted.length < 6 ? sorted : sorted.sublist(0, 6);
        content = SizedBox(
          height: 90.h,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            shrinkWrap: true,
            itemCount: items.length,
            itemBuilder: (context, index) {
              return FadeUpWidget(
                delay: Duration(milliseconds: 60 * index),
                child: GestureDetector(
                  onTap: () => Navigator.of(context).pushNamed(
                    '/marketScreen',
                    arguments: {
                      "id": items[index]["id"].toString(),
                      "name": items[index]["name"],
                    },
                  ),
                  child: Container(
                    width: 70.w,
                    margin: EdgeInsets.only(left: index == 0 ? 0 : 10.w),
                    child: Column(
                      children: [
                        Container(
                          width: 58.w,
                          height: 58.w,
                          decoration: BoxDecoration(
                            color: AppConstant.primaryColor.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16.r),
                            child: items[index]["image"] != null
                                ? CachedNetworkImage(
                                    fit: BoxFit.cover,
                                    memCacheWidth: 240,
                                    imageUrl: Endpoints.img(
                                        'shops', items[index]["image"]),
                                    placeholder: (_, __) => Shimmer.fromColors(
                                      baseColor: context.tInput,
                                      highlightColor: context.tDivider,
                                      child: Container(color: context.tInput),
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
                        SizedBox(height: 6.h),
                        Text(
                          items[index]["name"] ?? "",
                          style: TextStyle(
                            fontSize: 10.sp,
                            fontWeight: FontWeight.w500,
                            color: context.tText,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      } else {
        content = SizedBox(
          height: 90.h,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 5,
            itemBuilder: (_, index) => Container(
              width: 70.w,
              margin: EdgeInsets.only(left: index == 0 ? 0 : 10.w),
              child: Column(
                children: [
                  Shimmer.fromColors(
                    baseColor: context.tInput,
                    highlightColor: context.tDivider,
                    child: Container(
                      width: 58.w,
                      height: 58.w,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                    ),
                  ),
                  SizedBox(height: 6.h),
                  Shimmer.fromColors(
                    baseColor: context.tInput,
                    highlightColor: context.tDivider,
                    child: Container(
                      width: 50.w,
                      height: 10.h,
                      decoration: BoxDecoration(
                        color: context.tInput,
                        borderRadius: BorderRadius.circular(4.r),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }

      return Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.w),
        child: Column(
          children: [
            header,
            SizedBox(height: 14.h),
            content,
          ],
        ),
      );
    });
  }
}
