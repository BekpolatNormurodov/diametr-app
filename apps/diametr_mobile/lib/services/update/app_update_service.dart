import 'package:easy_localization/easy_localization.dart';
import 'package:upgrader/upgrader.dart';

/// Custom upgrader messages that pull localized strings from
/// the app's easy_localization translations (uz / ru).
///
/// For the body and release notes we fall back to the package's
/// built-in localized strings (which already perform `{{appName}}` /
/// `{{currentAppStoreVersion}}` substitution correctly).
class AppUpgraderMessages extends UpgraderMessages {
  AppUpgraderMessages({String code = 'en'}) : super(code: code);

  @override
  String? message(UpgraderMessage messageKey) {
    switch (messageKey) {
      case UpgraderMessage.title:
        return 'update_title'.tr();
      case UpgraderMessage.prompt:
        return 'update_prompt'.tr();
      case UpgraderMessage.releaseNotes:
        return 'update_release_notes'.tr();
      case UpgraderMessage.buttonTitleUpdate:
        return 'update_now'.tr();
      case UpgraderMessage.buttonTitleLater:
        return 'update_later'.tr();
      case UpgraderMessage.buttonTitleIgnore:
        return 'update_ignore'.tr();
      case UpgraderMessage.body:
        // keep upgrader's default body so version substitution works
        return super.message(messageKey);
    }
  }
}

/// Single shared Upgrader instance used across the app.
///
/// Behaviour:
///  * Checks the installed app version against Google Play / App Store
///    automatically (no custom backend / `app/version` API needed).
///  * Shown as a foreground dialog right when the app starts via
///    `UpgradeAlert` in `MaterialAppCustomBuilder`.
///  * Re-checks every 6 hours so the user is not spammed.
final Upgrader appUpgrader = Upgrader(
  messages: AppUpgraderMessages(code: 'ru'),
  durationUntilAlertAgain: const Duration(hours: 6),
  debugLogging: false,
);
