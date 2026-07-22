import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/extensions/theme_ext.dart';

/// A single shimmering rectangle the right size & shape for a skeleton.
/// Use inside a `Shimmer.fromColors(...)` (e.g. [SkeletonGroup]) parent.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double? height;
  final double radius;
  final EdgeInsetsGeometry? margin;
  final BoxShape shape;

  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.radius = 8,
    this.margin,
    this.shape = BoxShape.rectangle,
  });

  const SkeletonBox.circle({
    super.key,
    required double size,
    this.margin,
  })  : width = size,
        height = size,
        radius = 0,
        shape = BoxShape.circle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: context.tInput,
        borderRadius:
            shape == BoxShape.rectangle ? BorderRadius.circular(radius) : null,
        shape: shape,
      ),
    );
  }
}

/// Wraps children in a single, themed Shimmer animation.
/// All [SkeletonBox] descendants will use this animation.
class SkeletonGroup extends StatelessWidget {
  final Widget child;
  final Duration period;
  const SkeletonGroup({
    super.key,
    required this.child,
    this.period = const Duration(milliseconds: 1100),
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: context.tInput,
      highlightColor: context.tDivider,
      period: period,
      child: child,
    );
  }
}

/// Pre-built skeleton: product detail page layout (image banner + title + body).
class ProductDetailSkeleton extends StatelessWidget {
  const ProductDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonGroup(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // hero image
          SkeletonBox(width: 1.sw, height: 220.h, radius: 0),
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    SkeletonBox.circle(size: 22.w),
                    SizedBox(width: 10.w),
                    SkeletonBox(width: 120.w, height: 14.h, radius: 4),
                  ],
                ),
                SizedBox(height: 18.h),
                SkeletonBox(width: 1.sw, height: 12.h, radius: 4),
                SizedBox(height: 8.h),
                SkeletonBox(width: 1.sw * 0.85, height: 12.h, radius: 4),
                SizedBox(height: 8.h),
                SkeletonBox(width: 1.sw * 0.6, height: 12.h, radius: 4),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Pre-built skeleton: list of shop rows (used on product detail "shops" section).
class ShopListSkeleton extends StatelessWidget {
  final int count;
  const ShopListSkeleton({super.key, this.count = 3});

  @override
  Widget build(BuildContext context) {
    return SkeletonGroup(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.w),
            child: Row(
              children: [
                SkeletonBox(width: 32.w, height: 32.w, radius: 10),
                SizedBox(width: 10.w),
                SkeletonBox(width: 150.w, height: 14.h, radius: 4),
                const Spacer(),
                SkeletonBox(width: 30.w, height: 18.h, radius: 8),
              ],
            ),
          ),
          SizedBox(height: 14.h),
          // rows
          ...List.generate(
            count,
            (_) => Padding(
              padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 12.h),
              child: Container(
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: context.tCard,
                  borderRadius: BorderRadius.circular(14.r),
                ),
                child: Row(
                  children: [
                    SkeletonBox(
                        width: 52.w, height: 52.w, radius: 12),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(
                              width: 140.w, height: 13.h, radius: 4),
                          SizedBox(height: 8.h),
                          SkeletonBox(
                              width: 90.w, height: 11.h, radius: 4),
                        ],
                      ),
                    ),
                    SkeletonBox.circle(size: 28.w),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Pre-built skeleton: full-screen order detail layout (status + items + total).
class OrderDetailSkeleton extends StatelessWidget {
  const OrderDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonGroup(
      child: ListView(
        padding: EdgeInsets.all(16.w),
        children: [
          // status card
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: context.tCard,
              borderRadius: BorderRadius.circular(14.r),
            ),
            child: Row(
              children: [
                SkeletonBox.circle(size: 40.w),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(
                          width: 120.w, height: 14.h, radius: 4),
                      SizedBox(height: 8.h),
                      SkeletonBox(
                          width: 80.w, height: 12.h, radius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 16.h),
          // items
          ...List.generate(
            3,
            (_) => Padding(
              padding: EdgeInsets.only(bottom: 12.h),
              child: Container(
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: context.tCard,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Row(
                  children: [
                    SkeletonBox(
                        width: 60.w, height: 60.w, radius: 10),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(
                              width: 1.sw * 0.5, height: 12.h, radius: 4),
                          SizedBox(height: 6.h),
                          SkeletonBox(
                              width: 70.w, height: 11.h, radius: 4),
                        ],
                      ),
                    ),
                    SkeletonBox(width: 40.w, height: 13.h, radius: 4),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
