import 'package:fluttertoast/fluttertoast.dart';
import 'package:geolocator/geolocator.dart';
import 'package:stroymarket/services/location/location_service.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

import '../../export_files.dart';
import '../../manager/9_news_manager.dart';

// ignore: must_be_immutable
class SelectLocationScreen extends StatefulWidget {
  SelectLocationScreen({super.key});

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final GlobalKey<FormState> formKey = GlobalKey();
  YandexMapController? yandexMapController;
  List<MapObject> mapObjects = [];
  @override
  void initState() {
    NewsManager.getAll(
      context,
    );
    super.initState();
  }

  Position? MyPosition;
  Point? SelectPosition;
  goMyCurrentLocation() async {
    MyPosition = await LocationService.getCurrentPoint();

    if (MyPosition != null) {
      yandexMapController?.moveCamera(
        CameraUpdate.newCameraPosition(CameraPosition(
            target: Point(
                latitude: MyPosition!.latitude,
                longitude: MyPosition!.longitude))),
        animation: MapAnimation(
          type: MapAnimationType.smooth,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        key: scaffoldKey,
        appBar: CustomAppBar(
          scaffoldKey,
          'Manzilni tanlash',
          () {
            Navigator.of(context).pop();
          },
          'assets/icons/chevron-left.png',
        ),
        floatingActionButton: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            SizedBox(),
            GestureDetector(
              onTap: () {
                Navigator.pop(context, {
                  "lat": SelectPosition?.latitude,
                  "lon": SelectPosition?.longitude,
                });
                    Fluttertoast.showToast(
                      msg: "Manzil tanlandi",
                      toastLength: Toast.LENGTH_SHORT,
                      gravity: ToastGravity.BOTTOM,
                      timeInSecForIosWeb: 1,
                      backgroundColor: AppConstant.darkColor.withOpacity(0.9),
                      textColor: Colors.white,
                      fontSize: 14.sp,
                    );

                
              },
              child: Container(
                height: 48.h,
                width: 270.w,
                alignment: Alignment.center,
                child: Text("Tasdiqlash"),
                decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16.r),
                    color: AppConstant.primaryColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        spreadRadius: 5.r,
                        blurRadius: 10.r,
                        offset: Offset(0, 3),
                      )
                    ]),
              ),
            ),
            FloatingActionButton(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0.r)),
              materialTapTargetSize: MaterialTapTargetSize.padded,
              onPressed: goMyCurrentLocation,
              backgroundColor: AppConstant.primaryColor,
              child: Image.asset(
                width: 24.w,
                height: 24.w,
                'assets/images/go_location.png',
                color: Colors.white,
                // scale: 3.sp,
              ),
            ),
          ],
        ),
        body: SizedBox(
          width: 1.sw,
          height: 1.sh,
          child: YandexMap(
            mapObjects: mapObjects,
            onMapTap: (point)async {
              mapObjects
                  .removeWhere((element) => element.mapId.value == "select");
              SelectPosition = point;
              print(SelectPosition?.latitude);
               print(SelectPosition?.longitude);
              print(await LocationService.getAddressName(point));
              mapObjects.add(
                PlacemarkMapObject(
                  mapId: MapObjectId("select"),
                  point: Point(
                    latitude: SelectPosition!.latitude,
                    longitude: SelectPosition!.longitude,
                  ),
                  icon: PlacemarkIcon.single(
                    PlacemarkIconStyle(
                      scale: 2.r,
                      // zIndex: 2,
                      isFlat: true,
                      // isVisible: false,
                      image: BitmapDescriptor.fromAssetImage(
                        'assets/images/select_location.png'
                      ),
                    ),
                  ),
                ),
              );

              setState(() {});
            },
            onMapCreated: (controller) async {
              yandexMapController = controller;
              await goMyCurrentLocation();
              if (MyPosition != null) {
                mapObjects.add(
                  PlacemarkMapObject(
                    mapId: MapObjectId("me"),
                    point: Point(
                      latitude: MyPosition!.latitude,
                      longitude: MyPosition!.longitude,
                    ),
                    icon: PlacemarkIcon.single(
                      PlacemarkIconStyle(
                        scale: 0.3,
                        // zIndex: 2,
                        isFlat: true,
                        // isVisible: false,
                        image: BitmapDescriptor.fromAssetImage(
                          "assets/images/me.png",
                        ),
                      ),
                    ),
                  ),
                );
                SelectPosition = Point(
                    latitude: MyPosition!.latitude,
                    longitude: MyPosition!.longitude);
                mapObjects.add(
                  PlacemarkMapObject(
                    mapId: MapObjectId("select"),
                    point: Point(
                      latitude: SelectPosition!.latitude,
                      longitude: SelectPosition!.longitude,
                    ),
                    icon: PlacemarkIcon.single(
                      PlacemarkIconStyle(
                        scale: 2.r,
                        // zIndex: 2,
                        isFlat: true,
                        // isVisible: false,
                        image: BitmapDescriptor.fromAssetImage(
                          'assets/images/select_location.png'
                        ),
                      ),
                    ),
                  ),
                );

                setState(() {});
              } else {
                SelectPosition = Point(latitude: 41.2995, longitude: 69.2401);
                mapObjects.add(
                  PlacemarkMapObject(
                    mapId: MapObjectId("select"),
                    point: Point(
                      latitude: SelectPosition!.latitude,
                      longitude: SelectPosition!.longitude,
                    ),
                    icon: PlacemarkIcon.single(
                      PlacemarkIconStyle(
                        scale: 1.5.r,
                        // zIndex: 2,
                        isFlat: true,
                        // isVisible: false,
                        image: BitmapDescriptor.fromAssetImage(
                          'assets/icons/map-pin.png'
                        ),
                      ),
                    ),
                  ),
                );

                setState(() {});
              }
            },
          ),
        ));
  }
}
