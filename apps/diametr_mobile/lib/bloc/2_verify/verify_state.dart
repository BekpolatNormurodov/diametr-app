abstract class VerifyState {}

class VerifyIntialState extends VerifyState {}

class VerifyWaitingState extends VerifyState {}

class VerifySuccessState extends VerifyState {
  Map? user;
  String? token;
  VerifySuccessState({required this.user, required this.token});
}

class VerifyErrorState extends VerifyState {
  String? title;
  String? message;
  VerifyErrorState({required this.message, required this.title});
}
