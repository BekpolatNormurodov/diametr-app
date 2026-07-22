import 'package:yandex_mapkit/yandex_mapkit.dart';

import 'export_files.dart';

Future main() async {
  await FullInit();
  AndroidYandexMap.useAndroidViewSurface = false;
  runApp(stroymarket());
}