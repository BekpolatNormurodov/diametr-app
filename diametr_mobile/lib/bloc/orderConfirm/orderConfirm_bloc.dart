import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'OrderConfirm_state.dart';

class OrderConfirmBloc extends Cubit<OrderConfirmState> {
  DioClient dioClient = DioClient();
  OrderConfirmBloc() : super(OrderConfirmIntialState());

  Future confirm({
   required String OrderId
  }) async {
    emit(OrderConfirmWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    // DioClient.post rethrows on any non-2xx, so without this catch a failed
    // confirm left the UI stuck on OrderConfirmWaitingState forever instead of
    // showing the error.
    try {
      dio.Response response = await dioClient.post(
        Endpoints.OrderConfirm+OrderId,
        queryParameters: {
          'key': Endpoints.authKey,
        },
        options: dio.Options(
          headers: {
            "Authorization": "Bearer " + (token ?? ""),
          },
        ),
      );
      if (response.statusCode == 200) {
        emit(
          OrderConfirmSuccessState(
            data: response.data,
          ),
        );
      } else {
        emit(
          OrderConfirmErrorState(
              title: response.data["name"], message: response.data["message"]),
        );
      }

      return response.data;
    } on dio.DioError catch (e) {
      emit(OrderConfirmErrorState(
          title: 'Xatolik', message: _errorMessage(e)));
    } catch (e) {
      emit(OrderConfirmErrorState(title: 'Xatolik', message: e.toString()));
    }
  }

  /// class-validator returns `message` as a List; flatten it so the UI never
  /// renders a raw array.
  String _errorMessage(dio.DioError e) {
    final body = e.response?.data;
    return (body is Map
            ? (body['message'] is List
                ? (body['message'] as List).join(', ')
                : body['message']?.toString())
            : null) ??
        DioExceptions.fromDioError(e).message;
  }
}
