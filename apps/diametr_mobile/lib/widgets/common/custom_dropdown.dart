
import '../../export_files.dart';

customDropdown<Widget>(String dropdownValue, List<String> items,Function(String? v) onChanged) {
  return StatefulBuilder(
    builder: (context, setState) => Container(
      height: 45.h,
      padding: EdgeInsets.symmetric(horizontal: 10.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6.r),
        border: Border.all(
          color: AppConstant.greyColor,
          width: 1.sp,
        ),
      ),
      child: DropdownButton<String>(
        icon: Icon(
          Iconsax.arrow_down,
          color: AppConstant.darkColor,
        ),
        value: dropdownValue,
        items: items
            .map(
              (String item) => DropdownMenuItem(
                value: item,
                child: Text(item),
              ),
            )
            .toList(),
        onChanged: ((String? newValue) {
          onChanged(newValue);
          setState(() {
            dropdownValue = newValue!;
          });
        }),
        borderRadius: BorderRadius.circular(10.r),
        iconSize: 14.sp,
        style: TextStyle(
          color: AppConstant.darkColor,
          fontSize: 14.sp,
          fontWeight: FontWeight.w400,
        ),
        underline: Container(),
      ),
    ),
  );
}
