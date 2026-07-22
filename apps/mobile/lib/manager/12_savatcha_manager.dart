
import 'package:stroymarket/bloc/savatcha/savatcha_bloc.dart';

import '../export_files.dart';

class SavatchaManager {


  static changeValue(BuildContext context, {required List data}) {
    // BlocProvider.of<SavatchaBloc>(context).changeValue(data);
    context.read<SavatchaBloc>().changeValue(data);
  }

  static getValue(BuildContext context) {
    return context.read<SavatchaBloc>().getValue();
  }
}
