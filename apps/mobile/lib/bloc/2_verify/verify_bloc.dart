import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import 'verify_state.dart';

class VerifyBloc extends Cubit<VerifyState> {
  DioClient dioClient = DioClient();
  VerifyBloc() : super(VerifyIntialState());

  Future post({
    required String? id,
    required String? code,
  }) async {
    emit(VerifyWaitingState());
    try {
      dio.Response response = await dioClient.post(Endpoints.verify, data: {
        'id': id,
        'code': code,
      }, queryParameters: {
        'key': Endpoints.authKey,
      });

      if (response.statusCode == 200) {
        emit(
          VerifySuccessState(
              user: response.data["user"], token: response.data["token"]),
        );
      } else {
        emit(
          VerifyErrorState(
              title: response.data["error"],
              message: response.data["message"]),
        );
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
      emit(VerifyErrorState(title: 'Xatolik', message: message));
    } catch (e) {
      emit(VerifyErrorState(title: 'Xatolik', message: e.toString()));
    }
  }
}
