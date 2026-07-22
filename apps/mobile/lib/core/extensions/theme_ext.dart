import 'package:flutter/material.dart';
import 'package:stroymarket/core/constants/constants.dart';

extension AppThemeExt on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  /// Primary text / icon color
  Color get tText => isDark ? Colors.white : AppConstant.darkColor;

  /// Scaffold / page background
  Color get tBg => isDark ? const Color(0xFF0D0D1A) : Colors.white;

  /// Card / tile background
  Color get tCard => isDark ? const Color(0xFF1A1A2E) : Colors.white;

  /// Input / search field background
  Color get tInput => isDark ? const Color(0xFF1E1E30) : const Color(0xFFF5F5F5);

  /// Icon container background (leading buttons etc.)
  Color get tIconBg => isDark
      ? const Color(0xFF252540)
      : AppConstant.primaryColor.withValues(alpha: 0.10);

  /// Subtle divider / border
  Color get tDivider => isDark ? Colors.white12 : AppConstant.greyColor;

  /// Subtitle / hint color
  Color get tSub => isDark ? Colors.white54 : Colors.grey;

  /// Icon tint for PNG assets that are black-on-transparent
  Color get tIconTint => isDark ? Colors.white : AppConstant.primaryColor;
}
