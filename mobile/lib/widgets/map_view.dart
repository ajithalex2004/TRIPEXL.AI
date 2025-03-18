import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MapView extends StatelessWidget {
  const MapView({super.key});

  @override
  Widget build(BuildContext context) {
    const initialPosition = LatLng(40.7128, -74.0060); // New York

    return GoogleMap(
      initialCameraPosition: const CameraPosition(
        target: initialPosition,
        zoom: 12,
      ),
      markers: {
        const Marker(
          markerId: MarkerId('center'),
          position: initialPosition,
        ),
      },
    );
  }
}
