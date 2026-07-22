abstract class OrderAllState {}

class OrderAllIntialState extends OrderAllState {}

class OrderAllWaitingState extends OrderAllState {}

class OrderAllSuccessState extends OrderAllState {
  final data;
  OrderAllSuccessState({required this.data});
}

class OrderAllErrorState extends OrderAllState {
  String? title;
  String? message;
  OrderAllErrorState({required this.message, required this.title});
}
