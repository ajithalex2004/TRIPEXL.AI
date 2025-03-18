import 'package:flutter/material.dart';
import '../widgets/vehicle_list.dart';
import '../widgets/map_view.dart';
import 'package:shared_preferences.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> _handleLogout(BuildContext context) async {
    try {
      // Clear stored authentication data
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');

      // Navigate to login screen
      Navigator.of(context).pushReplacementNamed('/login');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error during logout. Please try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.logout, color: Color(0xFF004990)),
          onPressed: () {
            // Show confirmation dialog
            showDialog(
              context: context,
              builder: (BuildContext context) {
                return AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: <Widget>[
                    TextButton(
                      child: const Text('Cancel'),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    TextButton(
                      child: const Text(
                        'Logout',
                        style: TextStyle(color: Color(0xFF004990)),
                      ),
                      onPressed: () {
                        Navigator.of(context).pop(); // Close dialog
                        _handleLogout(context); // Handle logout
                      },
                    ),
                  ],
                );
              },
            );
          },
        ),
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