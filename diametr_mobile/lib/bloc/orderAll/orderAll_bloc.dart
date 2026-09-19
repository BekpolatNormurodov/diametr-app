import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'orderAll_state.dart';

class OrderAllBloc extends Cubit<OrderAllState> {
  DioClient dioClient = DioClient();
  OrderAllBloc() : super(OrderAllIntialState());

  Future getAll() async {
    emit(OrderAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.OrderAll,
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
        OrderAllSuccessState(
         data: (response.data as List).reversed.toList(),
        ),
      );
    } else {
      emit(
        OrderAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
    Future refreshAll() async {
   // Pull-to-refresh after an error (or before the first load finished) used
   // to be a silent no-op; do a normal load instead. A load already in flight
   // is left alone.
   if (state is OrderAllWaitingState) return null;
   if (state is! OrderAllSuccessState) return getAll();
   if (state is OrderAllSuccessState) {
      String? token = await StorageService().read(
      StorageService.token,
    );

    dio.Response response = await dioClient.get(
      Endpoints.OrderAll,
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
        OrderAllSuccessState(
          data: (response.data as List).reversed.toList(),
        ),
      );
    } else {
      emit(
        OrderAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
   }
  }



}
