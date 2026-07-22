import '../../export_files.dart';

class SavatchaBloc extends Cubit<List> {
  SavatchaBloc() : super([]);

  changeValue(List data) {
    emit(data);
  }
  getValue(){
    return state;
  }
}
