abstract class OrderCreateState {}

class OrderCreateIntialState extends OrderCreateState {}

class OrderCreateWaitingState extends OrderCreateState {}

class OrderCreateSuccessState extends OrderCreateState {
  final data;
  OrderCreateSuccessState({required this.data});
}

class OrderCreateErrorState extends OrderCreateState {
  String? title;
  String? message;
  OrderCreateErrorState({required this.message, required this.title});
}
