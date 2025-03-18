import 'package:flutter/material.dart';
import '../widgets/booking_form.dart';

class BookingScreen extends StatelessWidget {
  const BookingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Booking'),
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: BookingForm(),
      ),
    );
  }
}
