import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:in_app_update/in_app_update.dart';

/// In-app update via Google Play's official API (Play Core / Play In-App Update).
///
/// This replaces the old `upgrader` package, which scraped the Play Store's
/// HTML to read the latest version — unreliable in Uzbekistan (no country code,
/// and it breaks whenever Google changes the store page markup). This asks Play
/// directly, so there is nothing to scrape and nothing to misconfigure.
///
/// Android only: the API does not exist on iOS (or in debug/sideloaded builds),
/// so every call is a no-op there and never throws to the caller.
class AppUpdateService {
  AppUpdateService._();

  static bool _checkedThisLaunch = false;

  /// Call once after the first screen is on-screen (e.g. HomeScreen.initState).
  ///
  /// If Play reports a newer version, shows Play's own full-screen update flow.
  /// A "flexible" update (download in the background, then a restart prompt) is
  /// preferred; if Play only allows an immediate update, that is used instead.
  static Future<void> checkAndUpdate() async {
    if (_checkedThisLaunch) return;
    _checkedThisLaunch = true;

    if (!Platform.isAndroid) return; // Play In-App Update is Android-only.

    try {
      final info = await InAppUpdate.checkForUpdate();
      if (info.updateAvailability != UpdateAvailability.updateAvailable) {
        return;
      }

      if (info.flexibleUpdateAllowed) {
        final result = await InAppUpdate.startFlexibleUpdate();
        if (result == AppUpdateResult.success) {
          // Bytes are downloaded; ask Play to install and restart.
          await InAppUpdate.completeFlexibleUpdate();
        }
      } else if (info.immediateUpdateAllowed) {
        await InAppUpdate.performImmediateUpdate();
      }
    } catch (e) {
      // Never let an update check crash startup — offline, not from Play,
      // debug build, user dismissed, etc. all land here and are ignored.
      if (kDebugMode) {
        // ignore: avoid_print
        print('[AppUpdateService] update check skipped: $e');
      }
    }
  }
}
