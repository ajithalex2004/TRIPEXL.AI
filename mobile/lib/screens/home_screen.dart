import 'package:flutter/material.dart';
import '../widgets/vehicle_list.dart';
import '../widgets/map_view.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Image.asset(
            'assets/images/logo.png',
            height: 32,
            fit: BoxFit.contain,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        centerTitle: true,
      ),
      body: Column(
        children: [
          const SizedBox(height: 200, child: MapView()),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Available Vehicles',
              style: TextStyle(
                fontSize: 20, 
                fontWeight: FontWeight.bold,
                color: Color(0xFF004990), // EXL Solutions blue
              ),
            ),
          ),
          const Expanded(child: VehicleList()),
        ],
      ),
    );
  }
}