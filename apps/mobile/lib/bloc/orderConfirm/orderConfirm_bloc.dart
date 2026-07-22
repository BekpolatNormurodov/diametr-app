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
  }
}
