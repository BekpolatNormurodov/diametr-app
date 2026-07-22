
// ignore: must_be_immutable
import '../../export_files.dart';

class CustomButton extends StatelessWidget {
  CustomButton({super.key, required this.onPressed,required this.text,this.color =AppConstant.primaryColor,this.width});
  VoidCallback onPressed;
  String text;
  Color color;
  double? width;
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor:color,
        fixedSize: Size(width ??  MediaQuery.of(context).size.width, 50.h),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6.r),
        ),
      ),
      onPressed: onPressed,
      child: Text(
        text,
        style: TextStyle(
          fontSize: 16.sp,
          color: Colors.white,
          fontWeight: FontWeight.w300,
        ),
      ),
    );
  }
}
