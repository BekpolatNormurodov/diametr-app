import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'productAll_state.dart';

class ProductAllBloc extends Cubit<ProductAllState> {
  DioClient dioClient = DioClient();
  ProductAllBloc() : super(ProductAllIntialState());

  /// [silent] is a background refresh (app resume): keep what is on screen
  /// instead of flashing the skeleton, and keep it if the refresh fails.
  Future getAll({bool silent = false}) async {
    final bool keep = silent && state is ProductAllSuccessState;
    if (!keep) emit(ProductAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(
      Endpoints.ProductAll,
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
        ProductAllSuccessState(
          data: response.data,
        ),
      );
    } else if (!keep) {
      emit(
        ProductAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
