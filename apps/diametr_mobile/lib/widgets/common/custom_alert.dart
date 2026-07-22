
import '../../export_files.dart';

customAlert(BuildContext context, Widget child) async {
  await showDialog(
    context: context,
    builder: (ctx) {
      return AlertDialog(
        backgroundColor: ctx.tCard,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(20.r))),
        content: child
      );
    },
  );
}
