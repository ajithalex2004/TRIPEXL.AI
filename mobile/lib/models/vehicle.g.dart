// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vehicle.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Vehicle _$VehicleFromJson(Map<String, dynamic> json) => Vehicle(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      type: json['type'] as String,
      loadCapacity: (json['loadCapacity'] as num).toInt(),
      imageUrl: json['imageUrl'] as String,
      status: json['status'] as String,
      currentLocation:
          Location.fromJson(json['currentLocation'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$VehicleToJson(Vehicle instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'loadCapacity': instance.loadCapacity,
      'imageUrl': instance.imageUrl,
      'status': instance.status,
      'currentLocation': instance.currentLocation,
    };
