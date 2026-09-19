import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:url_launcher/url_launcher.dart';

/// In-app update via Google Play's official API (Play Core / Play In-App Update).
///
/// This replaces the old `upgrader` package, which scraped the Play Store's
/// HTML to read the latest version — unreliable in Uzbekistan (no country code,
/// and it breaks whenever Google changes the store page markup). This asks Play
/// directly, so there is nothing to scrape and nothing to misconfigure.
///
/// The update is **visible on purpose**: an *immediate* update is preferred, so
/// the user sees Play's own full-screen "downloading / installing" flow and the
/// app restarts into the new version — not a silent background download. Only if
/// Play won't allow an immediate update do we fall back to a flexible one, and
/// if the in-app API is unavailable entirely (not installed from Play, Play
/// Services missing) we open the store listing so the user can update by hand.
///
/// Android only: the API does not exist on iOS (or in debug/sideloaded builds),
/// so every call is a no-op there and never throws to the caller.
class AppUpdateService {
  AppUpdateService._();

  static const String _packageId = 'com.diametr.diametr_mobile';

  /// Android keeps the process alive for days, so "once per launch" meant a
  /// user who never force-closes the app was never offered a new release.
  /// Re-check at most this often (on start and when the app is resumed).
  static const Duration _minInterval = Duration(hours: 12);
  static DateTime? _lastCheck;

  /// True while Play's update flow is on screen, so a resume event fired by
  /// that flow itself does not launch a second check.
  static bool _inProgress = false;

  /// Call after the first screen is on-screen (HomeScreen.initState) and when
  /// the app returns to the foreground; throttled by [_minInterval].
  static Future<void> checkAndUpdate() async {
    if (_inProgress) return;
    final now = DateTime.now();
    if (_lastCheck != null && now.difference(_lastCheck!) < _minInterval) {
      return;
    }
    _lastCheck = now;

    if (!Platform.isAndroid) return; // Play In-App Update is Android-only.

    _inProgress = true;
    try {
      AppUpdateInfo info;
      try {
        info = await InAppUpdate.checkForUpdate();
      } catch (e) {
        // The in-app API itself is unavailable (sideloaded/not from Play, Play
        // Services missing, offline). There is nothing to show in-app, so do
        // nothing here — a manual store visit is the user's call, and bouncing
        // every offline launch to the store would be hostile.
        if (kDebugMode) {
          // ignore: avoid_print
          print('[AppUpdateService] checkForUpdate unavailable: $e');
        }
        return;
      }

      if (info.updateAvailability != UpdateAvailability.updateAvailable) {
        return;
      }

      // A newer version exists. Prefer the immediate (full-screen, visible)
      // flow so the user actually sees the app updating and lands on the new
      // version. A user dismissal throws here and is intentionally ignored —
      // we do NOT then bounce them to the store.
      try {
        if (info.immediateUpdateAllowed) {
          await InAppUpdate.performImmediateUpdate();
        } else if (info.flexibleUpdateAllowed) {
          final result = await InAppUpdate.startFlexibleUpdate();
          if (result == AppUpdateResult.success) {
            await InAppUpdate.completeFlexibleUpdate();
          }
        } else {
          // Update exists but neither in-app flow is allowed — the only way to
          // update is the store page.
          await _openStore();
        }
      } catch (e) {
        if (kDebugMode) {
          // ignore: avoid_print
          print('[AppUpdateService] update flow ended: $e');
        }
      }
    } finally {
      _inProgress = false;
    }
  }

  /// Opens the Play Store listing. Tries the Play app first (`market://`), then
  /// the https page. Never throws to the caller.
  static Future<void> _openStore() async {
    for (final raw in [
      'market://details?id=$_packageId',
      'https://play.google.com/store/apps/details?id=$_packageId',
    ]) {
      try {
        final uri = Uri.parse(raw);
        if (await canLaunchUrl(uri)) {
          final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
          if (ok) return;
        }
      } catch (_) {
        // try the next form
      }
    }
  }
}
