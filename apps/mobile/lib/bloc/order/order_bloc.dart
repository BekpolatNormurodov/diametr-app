import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'order_state.dart';

class OrderBloc extends Cubit<OrderState> {
  DioClient dioClient = DioClient();
  OrderBloc() : super(OrderIntialState());

  Future get({
   required String orderId
  }) async {
    emit(OrderWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Order+orderId,
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
        OrderSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        OrderErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
