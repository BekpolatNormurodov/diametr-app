import 'package:hive/hive.dart';

class HiveService {
  static Box box = Hive.box("stroymarket");

  static Future read(String key) async {
    return await box.get(key);
  }

  static Future<void> write(String key, dynamic value) async {
    await box.put(key, value);
  }

  static Future remove(String key) async {
    await box.delete(key);
  }

  static String apps = 'apps';
  static String progress = 'progress-apps';
}