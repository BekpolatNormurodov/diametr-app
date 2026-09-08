import 'dart:io';

import 'package:dio/dio.dart' as dio;
import 'package:dio/dio.dart';

import '../../export_files.dart';
import '../logger/dio_interceptor.dart';

class DioClient {
// dio instance
  final dio.Dio _dio = dio.Dio();

  /// Retry budget for network errors. Without a cap `get` recursed forever on a
  /// WiFi that connects but can't reach the API (captive portal, blocked route,
  /// IPv6-only network), so every screen sat on its shimmer with no explanation.
  static const int _maxRetries = 2;

  /// Blocs all branch on `statusCode == 200` and read `data["name"]` /
  /// `data["message"]` on the failure path, so hand back a well-formed error
  /// response once the retries are spent instead of hanging (or force-unwrapping
  /// a null `e.response`).
  dio.Response _networkErrorResponse(dio.DioError e) => dio.Response(
        requestOptions: e.requestOptions,
        statusCode: 503,
        data: const {
          "name": "Tarmoq xatosi",
          "message":
              "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring.",
        },
      );

  DioClient() {
    _dio
      ..options.baseUrl = Endpoints.baseUrl
      ..options.connectTimeout = Endpoints.connectionTimeout
      ..options.receiveTimeout = Endpoints.receiveTimeout
      ..options.sendTimeout = Endpoints.sendTimeout
      // NOTE: do NOT set Accept-Encoding manually — dart:io's HttpClient already
      // negotiates gzip and auto-decompresses (autoUncompress). Setting it by
      // hand is redundant and can disable that auto-decompression, delivering
      // raw gzip bytes that fail JSON parsing.
      ..options.responseType = dio.ResponseType.json
      ..options.receiveDataWhenStatusError = true
      ..interceptors.add(AppDioInterceptor());
  }

  Future<dio.Response> get(
    String url, {
    Map<String, dynamic>? queryParameters,
    dio.Options? options,
    dio.CancelToken? cancelToken,
    dio.ProgressCallback? onReceiveProgress,
    String? baseUrl,
    int attempt = 0,
  }) async {
    try {
      if (baseUrl != null) {
        _dio..options.baseUrl = baseUrl;
      }
      final dio.Response response = await _dio.get(
        url,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on dio.DioError catch (e) {
      DioExceptions.fromDioError(e).message;
      if ((e.error is SocketException || e.type == DioErrorType.other) &&
          attempt < _maxRetries) {
        // Exponential backoff (3s, 6s) — on a congested/slow link an immediate
        // fixed-delay retry just piles onto the congestion; backing off gives a
        // recovering network room to come back before the next attempt.
        await Future.delayed(
          Duration(seconds: 3 * (attempt + 1)),
        );
        return await get(
          url,
          queryParameters: queryParameters,
          options: options,
          cancelToken: cancelToken,
          onReceiveProgress: onReceiveProgress,
          baseUrl: baseUrl,
          attempt: attempt + 1,
        );
      }

      return e.response ?? _networkErrorResponse(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<dio.Response> post(
    String url, {
    data,
    Map<String, dynamic>? queryParameters,
    dio.Options? options,
    dio.CancelToken? cancelToken,
    dio.ProgressCallback? onSendProgress,
    dio.ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final dio.Response response = await _dio.post(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
        
      );

      return response;
    } on dio.DioError {
      rethrow;
    } catch (e) {
      rethrow;
    }
  }

  Future<dio.Response> put(
    String url, {
    data,
    Map<String, dynamic>? queryParameters,
    dio.Options? options,
    dio.CancelToken? cancelToken,
    dio.ProgressCallback? onSendProgress,
    dio.ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final dio.Response response = await _dio.put(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on dio.DioError catch (e) {
      throw DioExceptions.fromDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<dio.Response> patch(
    String url, {
    data,
    Map<String, dynamic>? queryParameters,
    dio.Options? options,
    dio.CancelToken? cancelToken,
    dio.ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final dio.Response response = await _dio.patch(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on dio.DioError catch (e) {
      throw DioExceptions.fromDioError(e);
    } catch (e) {
      // ignore: avoid_print
      print(e);
      rethrow;
    }
  }

  Future<dio.Response> delete(
    String url, {
    data,
    Map<String, dynamic>? queryParameters,
    dio.Options? options,
    dio.CancelToken? cancelToken,
    dio.ProgressCallback? onSendProgress,
    dio.ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final dio.Response response = await _dio.delete(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data;
    } on dio.DioError catch (e) {
      throw DioExceptions.fromDioError(e);
    } catch (e) {
      rethrow;
    }
  }
}
