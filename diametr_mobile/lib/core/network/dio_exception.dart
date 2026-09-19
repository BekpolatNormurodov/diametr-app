import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';

class DioExceptions implements Exception {
  late String message;
  late int  statusCode;

  DioExceptions.fromDioError(DioError dioError) {
  
    statusCode = 500;

    switch (dioError.type) {
      case DioErrorType.cancel:
        message = 'network_error'.tr();
        break;
      case DioErrorType.connectTimeout:
      case DioErrorType.receiveTimeout:
      case DioErrorType.sendTimeout:
        message = 'network_timeout'.tr();
        break;
      case DioErrorType.response:
        message = _handleError(
          dioError.response?.statusCode,
          dioError.response?.data,
        );
        break;
      case DioErrorType.other:
        if (dioError.message.contains("SocketException")) {
          message = 'network_no_internet'.tr();
          break;
        }
        message = 'network_error'.tr();
        break;
    }
  }

  String _handleError(int? statusCode, dynamic error) {
    switch (statusCode) {
      case 400:
        return 'Bad request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return error['message'];
      case 500:
        return 'Internal server error';
      case 502:
        return 'Bad gateway';
      default:
        return 'Oops something went wrong';
    }
  }

  @override
  String toString() => message;
}
