// ignore: camel_case_extensions
import 'package:easy_localization/easy_localization.dart';

extension my_format_extension on DateTime? {
  String toMyFormat() {
    if (this == null) {
      return "- - -";
    }
    // 'Aprel 2, 2024 11:08',
    final DateFormat formatter = DateFormat('MMMM dd, yyyy HH:mm');
    final String formatted = formatter.format(this!);

    return formatted;
  }
  String toMyFormatStatus() {
    if (this == null) {
      return "- - -";
    }
    // 'Aprel 2, 2024 11:08',
    final DateFormat formatter = DateFormat('dd/MM/yyyy');
    final String formatted = formatter.format(this!);

    return formatted;
  }
}


