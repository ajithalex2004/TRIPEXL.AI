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
  bool _isLoading = false;

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
      setState(() {
        _isLoading = true;
      });

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
            SnackBar(
              content: Text(
                booking.status == 'assigned'
                    ? 'Booking created and assigned! ID: #${booking.id}'
                    : 'Booking created but waiting for assignment. ID: #${booking.id}'
              ),
              backgroundColor: booking.status == 'assigned' ? Colors.green : Colors.orange,
            ),
          );

          // Clear form after successful submission
          setState(() {
            _pickupStart = null;
            _pickupEnd = null;
            _loadSize = null;
            _formKey.currentState?.reset();
          });
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(e.toString()),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
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
                if (int.tryParse(value) == null) {
                  return 'Please enter a valid number';
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
              onPressed: _isLoading ? null : _submitForm,
              child: _isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Create Booking'),
            ),
          ),
        ],
      ),
    );
  }
}