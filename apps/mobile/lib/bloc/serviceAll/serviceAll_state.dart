abstract class ServiceAllState {}

class ServiceAllIntialState extends ServiceAllState {}

class ServiceAllWaitingState extends ServiceAllState {}

class ServiceAllSuccessState extends ServiceAllState {
  final data;
  ServiceAllSuccessState({required this.data});
}

class ServiceAllErrorState extends ServiceAllState {
  String? title;
  String? message;
  ServiceAllErrorState({required this.message, required this.title});
}
