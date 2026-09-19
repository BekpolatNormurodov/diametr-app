
import 'package:stroymarket/bloc/ads/ads_bloc.dart';
import 'package:stroymarket/bloc/ads/ads_state.dart';

import '../export_files.dart';

class AdsManager {
  static Future<void> getAll(
    BuildContext context, {
    bool silent = false,
  }) async {
    try {
      await BlocProvider.of<AdsBloc>(context).get(silent: silent);
    } catch (e) {
      if (silent && BlocProvider.of<AdsBloc>(context).state is AdsSuccessState) {
        return;
      }
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<AdsBloc>(context).emit(AdsErrorState(
        message: msg,
        title: msg,
      ));
    }
  }
}
