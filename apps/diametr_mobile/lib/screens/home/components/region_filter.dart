import 'package:stroymarket/manager/6_region_manager.dart';
import 'package:stroymarket/manager/8_shop_manager.dart';

import '../../../bloc/regionAll/regionAll_bloc.dart';
import '../../../bloc/regionAll/regionAll_state.dart';
import '../../../export_files.dart';

/// Beautiful region filter bottom-sheet widget.
/// Shows all regions immediately as tappable chip cards,
/// then confirms with a green "Qo'llash" button.
Widget regionFilter() {
  return _RegionFilterSheet();
}

class _RegionFilterSheet extends StatefulWidget {
  const _RegionFilterSheet();

  @override
  State<_RegionFilterSheet> createState() => _RegionFilterSheetState();
}

class _RegionFilterSheetState extends State<_RegionFilterSheet> {
  List<bool> _checked = [];
  bool _initialised = false;

  void _init(List data, List selected) {
    if (_initialised) return;
    _initialised = true;
    _checked = List.generate(
      data.length,
      (i) => selected.any((s) => s['id'] == data[i]['id']),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = context.isDark;
    final Color bg = isDark ? const Color(0xFF1A1A2E) : Colors.white;
    final Color textPrimary = context.tText;
    final Color textSub = context.tSub;
    final Color divider = context.tDivider;

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24.r),
          topRight: Radius.circular(24.r),
        ),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 24.h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Drag handle ──
          SizedBox(height: 12.h),
          Container(
            width: 40.w,
            height: 4.h,
            decoration: BoxDecoration(
              color: divider,
              borderRadius: BorderRadius.circular(2.r),
            ),
          ),
          SizedBox(height: 20.h),

          // ── Header ──
          Row(
            children: [
              Container(
                width: 40.w,
                height: 40.w,
                decoration: BoxDecoration(
                  color: AppConstant.primaryColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(
                  Iconsax.location,
                  color: AppConstant.primaryColor,
                  size: 20.sp,
                ),
              ),
              SizedBox(width: 12.w),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'region_title'.tr(),
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'region_subtitle'.tr(),
                    style: TextStyle(
                      color: textSub,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width: 34.w,
                  height: 34.w,
                  decoration: BoxDecoration(
                    color: context.tIconBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Iconsax.close_circle,
                    color: textSub,
                    size: 18.sp,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 20.h),
          Divider(color: divider, height: 1),
          SizedBox(height: 16.h),

          // ── Region list via BLoC ──
          BlocBuilder<RegionAllBloc, RegionAllState>(
            builder: (context, state) {
              if (state is RegionAllWaitingState) {
                return Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.h),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(
                        color: AppConstant.primaryColor,
                        strokeWidth: 3.w,
                        strokeCap: StrokeCap.round,
                        backgroundColor:
                            AppConstant.primaryColor.withValues(alpha: 0.15),
                      ),
                      SizedBox(height: 16.h),
                      Text(
                        "region_loading".tr(),
                        style: TextStyle(
                          color: textSub,
                          fontSize: 14.sp,
                        ),
                      ),
                    ],
                  ),
                );
              }

              if (state is RegionAllSuccessState) {
                final List data = state.data;

                if (data.isEmpty) {
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 40.h),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Iconsax.location_slash,
                          size: 44.sp,
                          color: textSub,
                        ),
                        SizedBox(height: 12.h),
                        Text(
                          'region_empty'.tr(),
                          style: TextStyle(
                            color: textSub,
                            fontSize: 15.sp,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                // Init selections
                final List selected = RegionManager.getSelectedValue(context);
                if (selected.isEmpty) {
                  RegionManager.changeSelectedValue(context, data: data);
                }
                _init(data, selected.isEmpty ? data : selected);

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ── "Select all" row ──
                    Row(
                      children: [
                        Text(
                          '${'region_all_count'.tr()} (${data.length})',
                          style: TextStyle(
                            color: textSub,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              final allOn = _checked.every((v) => v);
                              _checked = List.filled(data.length, !allOn);
                            });
                          },
                          child: Text(
                            _checked.every((v) => v) ? 'region_deselect_all'.tr() : 'region_select_all'.tr(),
                            style: TextStyle(
                              color: AppConstant.primaryColor,
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12.h),

                    // ── Chip grid ──
                    Wrap(
                      spacing: 8.w,
                      runSpacing: 8.h,
                      children: List.generate(data.length, (i) {
                        final bool sel = i < _checked.length && _checked[i];
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              if (i < _checked.length) _checked[i] = !_checked[i];
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            curve: Curves.easeOut,
                            padding: EdgeInsets.symmetric(
                              horizontal: 14.w,
                              vertical: 10.h,
                            ),
                            decoration: BoxDecoration(
                              color: sel
                                  ? AppConstant.primaryColor
                                  : context.tIconBg,
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(
                                color: sel
                                    ? AppConstant.primaryColor
                                    : divider,
                                width: sel ? 1.5 : 1.0,
                              ),
                              boxShadow: sel
                                  ? [
                                      BoxShadow(
                                        color: AppConstant.primaryColor
                                            .withValues(alpha: 0.28),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      )
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (sel) ...
                                  [
                                    Icon(
                                      Iconsax.tick_circle5,
                                      color: Colors.white,
                                      size: 15.sp,
                                    ),
                                    SizedBox(width: 8.w),
                                  ],
                                Text(
                                  context.locale.languageCode == 'ru'
                                      ? (data[i]['name_ru']?.toString().isNotEmpty == true
                                          ? data[i]['name_ru'].toString()
                                          : data[i]['name']?.toString() ?? '')
                                      : data[i]['name']?.toString() ?? '',
                                  style: TextStyle(
                                    color: sel ? Colors.white : textPrimary,
                                    fontSize: 13.sp,
                                    fontWeight: sel
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ),
                    SizedBox(height: 24.h),
                    Divider(color: divider, height: 1),
                    SizedBox(height: 16.h),

                    // ── Action buttons ──
                    Row(
                      children: [
                        // Clear button
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _checked = List.filled(data.length, false);
                            });
                          },
                          child: Container(
                            height: 48.h,
                            padding: EdgeInsets.symmetric(horizontal: 20.w),
                            decoration: BoxDecoration(
                              color: context.tIconBg,
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(color: divider),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'region_clear'.tr(),
                              style: TextStyle(
                                color: textSub,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        // Apply button
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              if (_checked.any((v) => v)) {
                                final selected = List.generate(
                                  data.length,
                                  (i) => i < _checked.length && _checked[i]
                                      ? data[i]
                                      : null,
                                ).whereType<dynamic>().toList();
                                RegionManager.changeSelectedValue(
                                  context,
                                  data: selected,
                                );
                                ShopManager.getAll(context);
                                Navigator.pop(context);
                              }
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 48.h,
                              decoration: BoxDecoration(
                                color: _checked.any((v) => v)
                                    ? AppConstant.primaryColor
                                    : textSub.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(12.r),
                                boxShadow: _checked.any((v) => v)
                                    ? [
                                        BoxShadow(
                                          color: AppConstant.primaryColor
                                              .withValues(alpha: 0.35),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        )
                                      ]
                                    : null,
                              ),
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Iconsax.tick_circle,
                                    color: Colors.white,
                                    size: 18.sp,
                                  ),
                                  SizedBox(width: 8.w),
                                  Text(
                                    "${'region_apply'.tr()} (${_checked.where((v) => v).length})",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14.sp,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              }

              // Error / initial state
              return SizedBox(height: 12.h);
            },
          ),
        ],
      ),
    );
  }
}
