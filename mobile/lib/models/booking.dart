import 'package:json_annotation/json_annotation.dart';
import 'location.dart';

part 'booking.g.dart';

@JsonSerializable()
class Booking {
  final int id;
  final Location pickupLocation;
  final Location dropoffLocation;
  final TimeWindow pickupWindow;
  final TimeWindow dropoffWindow;
  final int loadSize;
  final String status;
  final int? vehicleId;
  final int? driverId;
  final DateTime createdAt;

  Booking({
    required this.id,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.pickupWindow,
    required this.dropoffWindow,
    required this.loadSize,
    required this.status,
    this.vehicleId,
    this.driverId,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => _$BookingFromJson(json);
  Map<String, dynamic> toJson() => _$BookingToJson(this);
}

@JsonSerializable()
class TimeWindow {
  final String start;
  final String end;

  TimeWindow({required this.start, required this.end});

  factory TimeWindow.fromJson(Map<String, dynamic> json) => _$TimeWindowFromJson(json);
  Map<String, dynamic> toJson() => _$TimeWindowToJson(this);
}