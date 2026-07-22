import 'package:dio/dio.dart' as dio;
import 'package:stroymarket/bloc/regionSelected/regionSelected_bloc.dart';
import 'package:stroymarket/services/storage/storage_service.dart';
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import 'shopAll_state.dart';

class ShopAllBloc extends Cubit<ShopAllState> {
  DioClient dioClient = DioClient();
  ShopAllBloc() : super(ShopAllIntialState());

  Future getAll(BuildContext context) async {
    emit(ShopAllWaitingState());
    String? token = await StorageService().read(
      StorageService.token,
    );
    List regions = BlocProvider.of<RegionSelectedBloc>(context).state;
    dio.Response response = await dioClient.get(
      Endpoints.ShopAll,
      queryParameters: {
        'key': Endpoints.authKey,
        'regions' : regions.map((e) => e["id"].toString()).join(",")
      },
      options: dio.Options(
        headers: {
          "Authorization": "Bearer " + (token ?? ""),
        },
      ),
    );
    if (response.statusCode == 200) {
      emit(
        ShopAllSuccessState(
          data: response.data,
        ),
      );
    } else {
      emit(
        ShopAllErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
