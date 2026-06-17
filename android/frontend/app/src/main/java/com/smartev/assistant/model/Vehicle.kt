package com.smartev.assistant.model

data class Vehicle(
    val id: String?,
    val _id: String?,
    val userId: String?,
    val name: String,
    val brand: String,
    val model: String,
    val year: Int,
    val batteryCapacity_kWh: Double,
    val currentCharge_percent: Int,
    val range_km: Int,
    val plateNumber: String,
    val isDefault: Boolean
)

data class VehicleResponse(
    val success: Boolean,
    val vehicles: List<Vehicle>?,
    val vehicle: Vehicle?,
    val message: String?
)
