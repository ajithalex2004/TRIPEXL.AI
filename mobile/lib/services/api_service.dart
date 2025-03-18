import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/booking.dart';
import '../models/vehicle.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';

  Future<List<Vehicle>> getVehicles() async {
    final response = await http.get(Uri.parse('$baseUrl/vehicles'));
    if (response.statusCode == 200) {
      final List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Vehicle.fromJson(json)).toList();
    }
    throw Exception('Failed to load vehicles');
  }

  Future<List<Booking>> getBookings() async {
    final response = await http.get(Uri.parse('$baseUrl/bookings'));
    if (response.statusCode == 200) {
      final List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => Booking.fromJson(json)).toList();
    }
    throw Exception('Failed to load bookings');
  }

  Future<Booking> createBooking(Map<String, dynamic> bookingData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/bookings'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(bookingData),
    );

    if (response.statusCode == 200) {
      return Booking.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to create booking');
  }
}
