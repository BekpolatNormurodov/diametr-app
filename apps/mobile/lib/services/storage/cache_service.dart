import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class CacheService {
  static AndroidOptions _getAndroidOptions() => const AndroidOptions(
        encryptedSharedPreferences: true,
      );
  static IOSOptions _getIosOptions() => const IOSOptions(
        accessibility: KeychainAccessibility.first_unlock,
      );
  static FlutterSecureStorage storage = FlutterSecureStorage(
      aOptions: _getAndroidOptions(), iOptions: _getIosOptions());

  static Future<String?> read(String key) async {
    return await storage.read(key: key);
  }

  static Future<void> write(String key, dynamic value) async {
    await storage.write(key: key, value: value.toString());
  }

  static Future remove(String key) async {
    await storage.delete(key: key);
  }

  static String token = 'token';
  static String user = 'user';
}