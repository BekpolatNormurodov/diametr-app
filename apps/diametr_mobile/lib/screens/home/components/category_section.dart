import '../../../bloc/categoryAll/categoryAll_bloc.dart';
import '../../../bloc/categoryAll/categoryAll_state.dart';
import '../../../export_files.dart';

// ignore: must_be_immutable
class CategorySection extends StatelessWidget {
  CategorySection({Key? key, required this.header}) : super(key: key);
  Widget header;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CategoryAllBloc, CategoryAllState>(
      builder: (context, state) {
        if (state is CategoryAllSuccessState && state.data.isEmpty) {
          return const SizedBox.shrink();
        }

        Widget content;
        if (state is CategoryAllSuccessState) {
          // Newest first: reverse the list so the most recently added items appear at the top.
          final reversed = state.data.reversed.toList();
          final items = reversed.length > 6 ? reversed.sublist(0, 6) : reversed;
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
                      '/productsScreen',
                      arguments: {"data": items[index]},
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
                                          'categories', items[index]["image"]),
                                      placeholder: (_, __) =>
                                          Shimmer.fromColors(
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
      },
    );
  }
}
