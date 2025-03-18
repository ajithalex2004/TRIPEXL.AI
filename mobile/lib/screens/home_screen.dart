import 'package:flutter/material.dart';
import '../widgets/vehicle_list.dart';
import '../widgets/map_view.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicle Booking'),
      ),
      body: Column(
        children: [
          const SizedBox(height: 200, child: MapView()),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Available Vehicles',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ),
          const Expanded(child: VehicleList()),
        ],
      ),
    );
  }
}
