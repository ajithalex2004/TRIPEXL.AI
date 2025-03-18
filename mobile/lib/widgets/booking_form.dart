import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/location.dart';
import 'package:intl/intl.dart';

class BookingForm extends StatefulWidget {
  const BookingForm({super.key});

  @override
  State<BookingForm> createState() => _BookingFormState();
}

class _BookingFormState extends State<BookingForm> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  
  DateTime? _pickupStart;
  DateTime? _pickupEnd;
  int? _loadSize;

  Future<void> _selectDateTime(BuildContext context, bool isPickupStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    
    if (picked != null) {
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );
      
      if (time != null) {
        setState(() {
          final DateTime dateTime = DateTime(
            picked.year,
            picked.month,
            picked.day,
            time.hour,
            time.minute,
          );
          if (isPickupStart) {
            _pickupStart = dateTime;
          } else {
            _pickupEnd = dateTime;
          }
        });
      }
    }
  }

  void _submitForm() async {
    if (_formKey.currentState!.validate()) {
      try {
        final booking = await _apiService.createBooking({
          'pickupLocation': {
            'address': '123 Main St',
            'coordinates': {'lat': 40.7128, 'lng': -74.0060}
          },
          'dropoffLocation': {
            'address': '456 Park Ave',
            'coordinates': {'lat': 40.7580, 'lng': -73.9855}
          },
          'pickupWindow': {
            'start': _pickupStart!.toIso8601String(),
            'end': _pickupEnd!.toIso8601String(),
          },
          'loadSize': _loadSize,
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Booking created: #${booking.id}')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to create booking')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            title: const Text('Pickup Start Time'),
            subtitle: Text(_pickupStart != null 
              ? DateFormat('MMM dd, yyyy HH:mm').format(_pickupStart!)
              : 'Not selected'),
            onTap: () => _selectDateTime(context, true),
          ),
          ListTile(
            title: const Text('Pickup End Time'),
            subtitle: Text(_pickupEnd != null 
              ? DateFormat('MMM dd, yyyy HH:mm').format(_pickupEnd!)
              : 'Not selected'),
            onTap: () => _selectDateTime(context, false),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextFormField(
              decoration: const InputDecoration(
                labelText: 'Load Size (kg)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter load size';
                }
                return null;
              },
              onChanged: (value) {
                setState(() {
                  _loadSize = int.tryParse(value);
                });
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: _submitForm,
              child: const Text('Create Booking'),
            ),
          ),
        ],
      ),
    );
  }
}
