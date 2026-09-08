import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'orderCreate_state.dart';

class OrderCreateBloc extends Cubit<OrderCreateState> {
  DioClient dioClient = DioClient();
  OrderCreateBloc() : super(OrderCreateIntialState());

  Future create({
   required data
  }) async {
    emit(OrderCreateWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    // DioClient.post rethrows on any non-2xx (a 400 from the order validator
    // included), so without this catch the else-branch below never ran and a
    // rejected order left the cart spinning forever with no message.
    try {
      dio.Response response = await dioClient.post(
        Endpoints.OrderCreate,
        data: data,
        queryParameters: {
          'key': Endpoints.authKey,
        },
        options: dio.Options(
          headers: {
            "Authorization": "Bearer " + (token ?? ""),
          },
        ),
      );
      if (response.statusCode == 201) {
        emit(
          OrderCreateSuccessState(
            data: response.data,
          ),
        );
      } else {
        emit(
          OrderCreateErrorState(
              title: response.data["name"], message: response.data["message"]),
        );
      }

      return response.data;
    } on dio.DioError catch (e) {
      emit(OrderCreateErrorState(
          title: 'Xatolik', message: _errorMessage(e)));
    } catch (e) {
      emit(OrderCreateErrorState(title: 'Xatolik', message: e.toString()));
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
