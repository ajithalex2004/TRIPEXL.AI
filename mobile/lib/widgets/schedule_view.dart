import 'package:flutter/material.dart';
import '../models/booking.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class ScheduleView extends StatefulWidget {
  const ScheduleView({super.key});

  @override
  State<ScheduleView> createState() => _ScheduleViewState();
}

class _ScheduleViewState extends State<ScheduleView> {
  final ApiService _apiService = ApiService();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Booking>>(
      future: _apiService.getBookings(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        final bookings = snapshot.data!;
        return ListView.builder(
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final booking = bookings[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ExpansionTile(
                title: Text('Booking #${booking.id}'),
                subtitle: Text(
                  DateFormat('MMM dd, yyyy').format(booking.createdAt),
                ),
                children: [
                  ListTile(
                    title: const Text('Pickup'),
                    subtitle: Text(booking.pickupLocation.address),
                  ),
                  ListTile(
                    title: const Text('Dropoff'),
                    subtitle: Text(booking.dropoffLocation.address),
                  ),
                  ListTile(
                    title: const Text('Status'),
                    trailing: Chip(
                      label: Text(booking.status),
                      backgroundColor: _getStatusColor(booking.status),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange[100]!;
      case 'assigned':
        return Colors.blue[100]!;
      case 'completed':
        return Colors.green[100]!;
      default:
        return Colors.grey[100]!;
    }
  }
}
