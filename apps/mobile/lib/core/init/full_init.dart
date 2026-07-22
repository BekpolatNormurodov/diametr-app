import '../../export_files.dart';
import 'intl/intl_init.dart';

// ignore: non_constant_identifier_names
Future<void> FullInit() async {
  widgetBuildInit();
  await dotenvInit();
  await SystemChrome_init();
  await storageInit();
  await initLanguages();
  intl_init();
}
