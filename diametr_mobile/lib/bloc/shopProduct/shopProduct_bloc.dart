import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'shopProduct_state.dart';

class ShopProductBloc extends Cubit<ShopProductState> {
  DioClient dioClient = DioClient();
  ShopProductBloc() : super(ShopProductIntialState());

  Future get({
    required String productId,
    required String shopId,
  }) async {
    emit(ShopProductWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.ShopProduct,
      queryParameters: {
        'key': Endpoints.authKey,
        'product_id': productId,
        'shop_id': shopId
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    // The bloc is owned by its screen route now; the user may have left
    // before the response arrived.
    if (isClosed) return response.data;
    if (response.statusCode == 200) {
      emit(
        ShopProductSuccessState(
          data: response.data["items"] ?? [],
          tavsiyalar: response.data["tavsiyalar"] ?? [],
        ),
      );
    } else {
      emit(
        ShopProductErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }

  Future refreshAll({
    required String productId,
    required String shopId,
  }) async {
    // Pull-to-refresh after an error: do a normal load instead of nothing.
    if (state is ShopProductWaitingState) return null;
    if (state is! ShopProductSuccessState) {
      return get(productId: productId, shopId: shopId);
    }
    if (state is ShopProductSuccessState) {
      String? token = await StorageService().read(
        StorageService.token,
      );

      dio.Response response = await dioClient.get(
        Endpoints.ShopProduct,
        queryParameters: {
          'key': Endpoints.authKey,
          'product_id': productId,
          'shop_id': shopId
        },
        options: dio.Options(
          headers: {
            "Authorization": "Bearer " + (token ?? ""),
          },
        ),
      );
      if (isClosed) return response.data;
      if (response.statusCode == 200) {
        emit(
          ShopProductSuccessState(
            data: response.data["items"] ?? [],
            tavsiyalar: response.data["tavsiyalar"] ?? [],
          ),
        );
      } else {
        emit(
          ShopProductErrorState(
              title: response.data["name"], message: response.data["message"]),
        );
      }

      return response.data;
    }
  }
}
