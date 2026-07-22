
import 'package:stroymarket/bloc/ads/ads_bloc.dart';
import 'package:stroymarket/bloc/ads/ads_state.dart';

import '../export_files.dart';

class AdsManager {
  static Future<void> getAll(
    BuildContext context,
  ) async {
    try {
      await BlocProvider.of<AdsBloc>(context).get();
    } catch (e) {
      final msg = e is DioExceptions ? e.message : e.toString();
      BlocProvider.of<AdsBloc>(context).emit(AdsErrorState(
        message: msg,
        title: msg,
      ));
    }
  }
}
