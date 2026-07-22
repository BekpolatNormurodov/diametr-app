import 'package:flutter/services.dart';

import '../../export_files.dart';

// ignore: must_be_immutable
class CustomTextField extends StatelessWidget {
  CustomTextField({
    super.key,
    required this.icon,
    required this.text,
    required this.controller,
    this.onChanged,
    this.inputFormatters,
    this.keyboardType,
  });
  Widget icon;
  String text;
  TextEditingController controller;
  List<TextInputFormatter>? inputFormatters;
  void Function(String)? onChanged;
  TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50.h,
      child: TextFormField(
        controller: controller,
        onChanged: onChanged,
        inputFormatters: inputFormatters,
        keyboardType: keyboardType,
        style: TextStyle(
          color: context.tText,
          fontSize: 14.sp,
          fontWeight: FontWeight.w400,
        ),
        cursorColor: AppConstant.primaryColor,
        showCursor: true,
        autofocus: false,
        textInputAction: TextInputAction.done,
        decoration: InputDecoration(
          isDense: true,
          prefixIcon: icon,
          border: _searchStyle(context),
          focusedBorder: _searchStyle(context),
          enabledBorder: _searchStyle(context),
          filled: true,
          fillColor: context.tInput,
          hintText: text,
          hintStyle: TextStyle(
            color: context.tSub,
            fontSize: 14.sp,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

OutlineInputBorder _searchStyle(BuildContext context) {
  return OutlineInputBorder(
    borderSide: BorderSide(color: context.tDivider),
    borderRadius: BorderRadius.all(Radius.circular(10.r)),
  );
}

