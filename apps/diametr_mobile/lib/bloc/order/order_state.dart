abstract class OrderState {}

class OrderIntialState extends OrderState {}

class OrderWaitingState extends OrderState {}

class OrderSuccessState extends OrderState {
  final data;
  OrderSuccessState({required this.data});
}

class OrderErrorState extends OrderState {
  String? title;
  String? message;
  OrderErrorState({required this.message, required this.title});
}
