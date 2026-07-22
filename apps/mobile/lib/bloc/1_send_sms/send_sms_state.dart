abstract class SendSmsState {}

class SendSmsIntialState extends SendSmsState {}

class SendSmsWaitingState extends SendSmsState {}

class SendSmsSuccessState extends SendSmsState {
  final data;
 
  SendSmsSuccessState({required this.data});
}

class SendSmsErrorState extends SendSmsState {
  String? title;
  String? message;
  SendSmsErrorState({required this.message, required this.title});
}
