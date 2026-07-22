import 'package:flutter/cupertino.dart';
import 'package:stroymarket/export_files.dart';


enum NetworkResult { on, off }

// ignore: must_be_immutable
class CheckNetworkWidget extends StatefulWidget {
  Widget? child;
  CheckNetworkWidget({super.key, required this.child});

  @override
  State<CheckNetworkWidget> createState() => _CheckNetworkWidgetState();
}

class _CheckNetworkWidgetState extends State<CheckNetworkWidget> {
  NetworkResult result = NetworkResult.on;
  StreamSubscription<List<ConnectivityResult>>? subscription;

  startListen() {
    subscription =  Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> res)  async{
    if (res.contains(ConnectivityResult.mobile) || res.contains(ConnectivityResult.wifi)) {
        result = (await InternetConnectionChecker.instance.hasConnection)
            ? NetworkResult.on
            : NetworkResult.off;
      } else {
        result = NetworkResult.off;
      }
               setState(() => {});
    });
  }

  cancelListen() {
    subscription?.cancel();
  }

  checker() async {
    result = await  InternetConnectionChecker.instance.hasConnection
        ? NetworkResult.on
        : NetworkResult.off;
                    setState(() => {});
                  
  }

  @override
  void initState() {
    checker();
    startListen();
    super.initState();
  }

  @override
  void dispose() {
    cancelListen();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        result == NetworkResult.off
            ? AbsorbPointer(
                child: widget.child ?? const SizedBox(),
              )
            : widget.child!,
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 300),
          crossFadeState: result == NetworkResult.off
              ? CrossFadeState.showFirst
              : CrossFadeState.showSecond,
          firstChild: 
          Container(
            width: 1.sw,
            height: 1.sh,
            color: Colors.white,
            child: Center(
              child: CupertinoAlertDialog(
                title: Text(
                  'Internet yo\'q',
                  style: TextStyle(
                    fontSize: 18.sp,
                  ),
                ),
                content: Text(
                  'Iltimos internetingizni tekshiring',
                  style: TextStyle(
                    fontSize: 16.sp,
                  ),
                ),
                actions: <Widget>[
                  TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                    ),
                    onPressed: checker,
                    child: Text(
                      'Tekshirish',
                      style: TextStyle(
                        color: AppConstant.primaryColor,
                        fontSize: 14.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
         
          secondChild: const SizedBox(),
        ),
      ],
    );
  }
}
