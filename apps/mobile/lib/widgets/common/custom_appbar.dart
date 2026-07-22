
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';

import '../../export_files.dart';

// customAppBar<Widget>(
//   BuildContext context,
//   GlobalKey<ScaffoldState> scaffoldKey,
//   String text,
//   VoidCallback onPressed,
//   String icon, {
//   bool savatcha = false,
//   actions,
// }) {
//   return AppBar(
//     elevation: 0,
//     surfaceTintColor: Colors.transparent,
//     bottom: PreferredSize(
//       preferredSize: Size(MediaQuery.of(context).size.width, 1.h),
//       child: const Divider(
//         color: AppConstant.greyColor,
//         height: 0,
//       ),
//     ),
//     centerTitle: true,
//     title: Text(
//       text,
//       style: TextStyle(
//         fontSize: 18.sp,
//         color: AppConstant.darkColor,
//         fontWeight: FontWeight.w300,
//       ),
//     ),
//     leading: GestureDetector(
//       onTap: onPressed,
//       child: Image.asset(
//         icon,
//         scale: 3.sp,
//       ),
//     ),
//     actions: [
//       if (actions != null)
//         Row(
//           mainAxisSize: MainAxisSize.min,
//           children: actions!,
//         ),
//       savatcha == true
//           ? GestureDetector(onTap: () {
//               Navigator.of(context).pushNamed(
//                 '/cartScreen',
//               );
//             }, child: BlocBuilder<SavatchaBloc, List>(
//               builder: (context, state) {
//                 return Container(
//                   child: Stack(
//                     children: [
//                       Padding(
//                         padding: EdgeInsets.all(5.0.w),
//                         child: Image.asset(
//                           'assets/icons/Grocery.png',
//                           scale: 3.sp,
//                         ),
//                       ),
//                       if (state.isNotEmpty)
//                         Positioned(
//                           right: 0,
//                           top: 0,
//                           child: Container(
//                             child: Text(
//                               "${state.length}",
//                               style: TextStyle(
//                                   fontSize: 9.sp, fontWeight: FontWeight.bold),
//                             ),
//                             padding: EdgeInsets.all(5.w),
//                             decoration: BoxDecoration(
//                                 // borderRadius: BorderRadius.circular(2.w),
//                                 shape: BoxShape.circle,
//                                 color: Colors.amber),
//                           ),
//                         ),
//                     ],
//                   ),
//                 );
//               },
//             ))
//           : SizedBox(),
//       SizedBox(width: 16.w),
//     ],
//   );

// }


class CustomAppBar extends StatefulWidget implements PreferredSizeWidget {
  GlobalKey<ScaffoldState>? scaffoldKey;
  String? text;
  VoidCallback? onPressed;
  String? icon;
  bool savatcha = false;
  bool isMenu;
  final actions;

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);

  CustomAppBar(this.scaffoldKey, this.text, this.onPressed, this.icon,
      {this.savatcha = false, this.isMenu = false, this.actions, super.key});

  @override
  State<CustomAppBar> createState() => _CustomAppBarState();
}

class _CustomAppBarState extends State<CustomAppBar> {
  @override
  Widget build(BuildContext context) {
    return AppBar(
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: context.tBg,
      surfaceTintColor: Colors.transparent,
      bottom: PreferredSize(
        preferredSize: Size(MediaQuery.of(context).size.width, 0.5.h),
        child: Container(
          height: 0.5.h,
          color: context.tDivider,
        ),
      ),
      centerTitle: true,
      title: Text(
        widget.text!,
        style: TextStyle(
          fontSize: 17.sp,
          color: context.tText,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
        ),
      ),
      leading: GestureDetector(
        onTap: widget.onPressed,
        child: Container(
          margin: EdgeInsets.all(8.w),
          decoration: BoxDecoration(
            color: AppConstant.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10.r),
            border: Border.all(
              color: AppConstant.primaryColor.withValues(alpha: 0.20),
              width: 1,
            ),
          ),
          child: Center(
            child: Icon(
              widget.isMenu ? Iconsax.menu_1 : Iconsax.arrow_left,
              color: AppConstant.primaryColor,
              size: 18.sp,
            ),
          ),
        ),
      ),
      actions: [
        if (widget.actions != null)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: widget.actions!,
          ),
        BlocListener<SavatchaBloc, List>(
          listener: (context, state) => setState(() {}),
          child: const SizedBox.shrink(),
        ),
        if (widget.savatcha)
          GestureDetector(
            onTap: () => Navigator.of(context).pushNamed('/cartScreen'),
            child: BlocBuilder<SavatchaBloc, List>(
              builder: (context, state) {
                return Container(
                  margin: EdgeInsets.only(right: 6.w),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 38.w,
                        height: 38.w,
                        decoration: BoxDecoration(
                          color: context.tIconBg,
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                        child: Center(
                          child: Image.asset(
                            'assets/icons/Grocery.png',
                            scale: 3.sp,
                            color: context.tIconTint,
                          ),
                        ),
                      ),
                      if (state.isNotEmpty)
                        Positioned(
                          right: -3,
                          top: -3,
                          child: Container(
                            padding: EdgeInsets.all(4.w),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppConstant.primaryColor,
                            ),
                            child: Text(
                              "${state.length}",
                              style: TextStyle(
                                fontSize: 9.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        SizedBox(width: 8.w),
      ],
    );
  }
}