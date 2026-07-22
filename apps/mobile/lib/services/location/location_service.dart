import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';



class LocationService {
  static Future<Position?> getCurrentPoint() async {
    try {
      bool serviceEnabled;
      LocationPermission permission;
     

      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        print('Location services are disabled.');
        return null;
      }

      // permission = await Geolocator.checkPermission();
      permission = await Geolocator.checkPermission();
      if (permission != LocationPermission.whileInUse &&
          permission != LocationPermission.always) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied) {
        print('Location permissions are denied');
        return null;
      }

      if (permission == LocationPermission.deniedForever) {
        print(
            'Location permissions are permanently denied, we cannot request permissions.');
        return null;
      }
      Position? pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );
      // print(pos.toJson());
      return pos;
    } catch (e) {
      print("Geolocator getCurrentPosition Error: $e");
    }

    return null;
  }

  static Future<String?> getAddressName(Point myLocation) async {
    try {
      
             final result =    await   placemarkFromCoordinates(myLocation.latitude, myLocation.longitude)
                      .then((placemarks) {
                    Placemark? output;
                    if (placemarks.isNotEmpty) {
                      output = placemarks[0];
                      return output;
                    }

                  
                  });
      return result!.toJson().toString();
      return '${result.locality}, ${result.administrativeArea},${result.subLocality}, ${result.subLocality},${result.country}, ${result.street},${result.thoroughfare}, ${result.subThoroughfare}';
    } catch (e) {
      print("Geolocator getCurrentPosition Error: $e");
    }

    return null;
  }

}
