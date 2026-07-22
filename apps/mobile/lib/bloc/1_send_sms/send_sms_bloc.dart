import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import 'send_sms_state.dart';

class SendSmsBloc extends Cubit<SendSmsState> {
  DioClient dioClient = DioClient();
  SendSmsBloc() : super(SendSmsIntialState());

  Future post({required String? phone}) async {
    emit(SendSmsWaitingState());
    try {
      dio.Response response = await dioClient.post(Endpoints.smsSend,
          data: {'phone': '+' + phone.toString()},
          queryParameters: {'key': Endpoints.authKey});

      if (response.statusCode == 200) {
        emit(SendSmsSuccessState(data: response.data));
      } else {
        emit(SendSmsErrorState(
            title: response.data['error'],
            message: response.data['message']));
      }
      return response.data;
    } on dio.DioError catch (e) {
      final body = e.response?.data;
      final message = (body is Map
              ? (body['message'] is List
                  ? (body['message'] as List).join(', ')
                  : body['message']?.toString())
              : null) ??
          DioExceptions.fromDioError(e).message;
      emit(SendSmsErrorState(title: 'Xatolik', message: message));
    } catch (e) {
      emit(SendSmsErrorState(title: 'Xatolik', message: e.toString()));
    }
  }
}
