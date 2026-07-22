import 'package:stroymarket/bloc/1_send_sms/send_sms_bloc.dart';
import 'package:stroymarket/bloc/1_send_sms/send_sms_state.dart';
import 'package:stroymarket/bloc/2_verify/verify_bloc.dart';
import 'package:stroymarket/bloc/2_verify/verify_state.dart';

import '../export_files.dart';

class PhoneManager {
  static Future<void> sendSms(
    BuildContext context, {
    required String? phone,
  }) async {
    try {
      await BlocProvider.of<SendSmsBloc>(context).post(
        phone: phone,
      );
    } catch (e, track) {
      var err = e as DioExceptions;
      print("Manager Error >>" + e.toString());
      print("Manager track >>" + track.toString());
      BlocProvider.of<SendSmsBloc>(context).emit(SendSmsErrorState(message: err.message, title: err.message,));

    }
  }

  static Future<void> verify(
    BuildContext context, {
    required String? id,
    required String? code,
  }) async {
    try {
      await BlocProvider.of<VerifyBloc>(context).post(id: id, code: code);
    } catch (e, track) {
    var err = e as DioExceptions;
      print("Manager Error >>" + e.toString());
      print("Manager track >>" + track.toString());
      BlocProvider.of<VerifyBloc>(context).emit(VerifyErrorState(message: err.message, title: err.message,));

    }
  }
}
