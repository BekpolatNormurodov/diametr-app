abstract class OrderConfirmState {}

class OrderConfirmIntialState extends OrderConfirmState {}

class OrderConfirmWaitingState extends OrderConfirmState {}

class OrderConfirmSuccessState extends OrderConfirmState {
  final data;
  OrderConfirmSuccessState({required this.data});
}

class OrderConfirmErrorState extends OrderConfirmState {
  String? title;
  String? message;
  OrderConfirmErrorState({required this.message, required this.title});
}
