import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_storage/get_storage.dart';

class ThemeCubit extends Cubit<ThemeMode> {
  static const _key = 'theme_mode';
  final _box = GetStorage();

  ThemeCubit() : super(_load());

  static ThemeMode _load() {
    final v = GetStorage().read<String>(_key);
    if (v == 'light') return ThemeMode.light;
    return ThemeMode.dark; // default dark
  }

  void setLight() {
    _box.write(_key, 'light');
    emit(ThemeMode.light);
  }

  void setDark() {
    _box.write(_key, 'dark');
    emit(ThemeMode.dark);
  }
}
