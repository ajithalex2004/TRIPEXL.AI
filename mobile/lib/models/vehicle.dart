import 'package:json_annotation/json_annotation.dart';
import 'location.dart';

part 'vehicle.g.dart';

@JsonSerializable()
class Vehicle {
  final int id;
  final String name;
  final String type;
  final int loadCapacity;
  final String imageUrl;
  final String status;
  final Location currentLocation;

  Vehicle({
    required this.id,
    required this.name,
    required this.type,
    required this.loadCapacity,
    required this.imageUrl,
    required this.status,
    required this.currentLocation,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);
  Map<String, dynamic> toJson() => _$VehicleToJson(this);
}