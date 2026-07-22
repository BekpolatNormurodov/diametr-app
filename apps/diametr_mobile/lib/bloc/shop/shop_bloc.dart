import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'shop_state.dart';

class ShopBloc extends Cubit<ShopState> {
  DioClient dioClient = DioClient();
  ShopBloc() : super(ShopIntialState());

  Future get({
   required String ShopId
  }) async {
    emit(ShopWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.Shop + ShopId,
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
        ShopSuccessState(
          data: response.data,
           admin: response.data["admins"] !=null ? ( response.data["admins"] is List &&  (response.data["admins"] as List).isNotEmpty ? response.data["admins"][0]: null) : null,
           products: response.data["products"],
        ),
      );
    } else {
      emit(
        ShopErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
