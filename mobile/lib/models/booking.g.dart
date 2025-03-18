// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Booking _$BookingFromJson(Map<String, dynamic> json) => Booking(
      id: (json['id'] as num).toInt(),
      pickupLocation:
          Location.fromJson(json['pickupLocation'] as Map<String, dynamic>),
      dropoffLocation:
          Location.fromJson(json['dropoffLocation'] as Map<String, dynamic>),
      pickupWindow:
          TimeWindow.fromJson(json['pickupWindow'] as Map<String, dynamic>),
      dropoffWindow:
          TimeWindow.fromJson(json['dropoffWindow'] as Map<String, dynamic>),
      loadSize: (json['loadSize'] as num).toInt(),
      status: json['status'] as String,
      vehicleId: (json['vehicleId'] as num?)?.toInt(),
      driverId: (json['driverId'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$BookingToJson(Booking instance) => <String, dynamic>{
      'id': instance.id,
      'pickupLocation': instance.pickupLocation,
      'dropoffLocation': instance.dropoffLocation,
      'pickupWindow': instance.pickupWindow,
      'dropoffWindow': instance.dropoffWindow,
      'loadSize': instance.loadSize,
      'status': instance.status,
      'vehicleId': instance.vehicleId,
      'driverId': instance.driverId,
      'createdAt': instance.createdAt.toIso8601String(),
    };

TimeWindow _$TimeWindowFromJson(Map<String, dynamic> json) => TimeWindow(
      start: json['start'] as String,
      end: json['end'] as String,
    );

Map<String, dynamic> _$TimeWindowToJson(TimeWindow instance) =>
    <String, dynamic>{
      'start': instance.start,
      'end': instance.end,
    };
