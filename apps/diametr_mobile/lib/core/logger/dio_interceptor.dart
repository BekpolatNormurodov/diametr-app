import 'package:dio/dio.dart';
import 'package:get_storage/get_storage.dart';

import 'app_logger.dart';

/// Dio interceptor that pretty-prints every request / response / error.
class AppDioInterceptor extends Interceptor {
  static const _startKey = '_appLogger_start';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.extra[_startKey] = DateTime.now().millisecondsSinceEpoch;
    // Add Accept-Language header so backend returns messages in the right language
    final lang = GetStorage().read<String>('app_lang') ?? 'uz';
    options.headers['Accept-Language'] = lang;
    AppLogger.request(
      method: options.method,
      url: options.path,
      data: options.data,
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final ms = _elapsed(response.requestOptions);
    AppLogger.response(
      method: response.requestOptions.method,
      url: response.requestOptions.path,
      status: response.statusCode ?? 200,
      ms: ms,
    );
    handler.next(response);
  }

  @override
  void onError(DioError err, ErrorInterceptorHandler handler) {
    final ms      = _elapsed(err.requestOptions);
    final status  = err.response?.statusCode ?? 0;
    final body    = err.response?.data;
    final message = (body is Map ? body['message']?.toString() : null) ??
        err.message;

    AppLogger.error(
      method:  err.requestOptions.method,
      url:     err.requestOptions.path,
      status:  status,
      ms:      ms,
      message: message,
    );
    handler.next(err);
  }

  int _elapsed(RequestOptions options) {
    final start = options.extra[_startKey] as int?;
    if (start == null) return 0;
    return DateTime.now().millisecondsSinceEpoch - start;
  }
}
