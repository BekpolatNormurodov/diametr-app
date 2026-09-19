import 'package:dio/dio.dart' as dio;
import '../../core/network/dio_Client.dart';
import '../../export_files.dart';
import '../../services/storage/storage_service.dart';
import 'ads_state.dart';

class AdsBloc extends Cubit<AdsState> {
  DioClient dioClient = DioClient();
  AdsBloc() : super(AdsIntialState());

  /// [silent] is a background refresh (app resume): keep what is on screen
  /// instead of flashing the skeleton, and keep it if the refresh fails.
  Future get({bool silent = false}) async {
    final bool keep = silent && state is AdsSuccessState;
    if (!keep) emit(AdsWaitingState());
     String? token = await StorageService().read(
      StorageService.token,
    );
    dio.Response response = await dioClient.get(Endpoints.Ads,  queryParameters: {
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
        AdsSuccessState(
          data: response.data,
        ),
      );
    } else if (!keep) {
      emit(
        AdsErrorState(
            title: response.data["name"], message: response.data["message"]),
      );
    }

    return response.data;
  }
}
