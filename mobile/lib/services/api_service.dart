import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/booking.dart';
import '../models/vehicle.dart';
import '../models/location.dart';

class ApiService {
  static const String baseUrl = 'http://0.0.0.0:5000/api';  // Updated to use 0.0.0.0

  Future<List<Vehicle>> getVehicles() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/vehicles'));
      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Vehicle.fromJson(json)).toList();
      }
      throw Exception('Failed to load vehicles: ${response.statusCode}');
    } catch (e) {
      print('Error fetching vehicles: $e');
      throw Exception('Failed to load vehicles');
    }
  }

  Future<List<Booking>> getBookings() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/bookings'));
      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        return jsonList.map((json) => Booking.fromJson(json)).toList();
      }
      throw Exception('Failed to load bookings: ${response.statusCode}');
    } catch (e) {
      print('Error fetching bookings: $e');
      throw Exception('Failed to load bookings');
    }
  }

  Future<Booking> createBooking(Map<String, dynamic> bookingData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(bookingData),
      );

      if (response.statusCode == 200) {
        return Booking.fromJson(json.decode(response.body));
      }

      // Handle assignment failure
      if (response.statusCode == 409) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to assign vehicle/driver');
      }

      throw Exception('Failed to create booking: ${response.statusCode}');
    } catch (e) {
      print('Error creating booking: $e');
      throw Exception('Failed to create booking');
    }
  }
}