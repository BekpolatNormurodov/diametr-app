import '../../export_files.dart';

class RegionSelectedBloc extends Cubit<List> {
  RegionSelectedBloc() : super([]);

  changeValue(List data) async {
    emit(data);
  }
  getValue(){
    return state;
  }
}
