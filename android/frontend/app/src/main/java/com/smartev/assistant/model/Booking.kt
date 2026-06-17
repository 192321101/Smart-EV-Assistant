package com.smartev.assistant.model

data class Booking(
    val id: String?,
    val _id: String?,
    val userId: String?,
    val vehicleId: String?,
    val stationId: String?,
    val slotId: String?,
    val date: String?,
    val timeSlot: String?,
    val status: String?, // "pending" | "active" | "completed" | "cancelled"
    val powerDraw_kW: Int?,
    val cost: Double?,
    val createdAt: String?
)

data class BookingRequest(
    val vehicleId: String,
    val stationId: String,
    val slotId: String,
    val date: String,
    val timeSlot: String
)

data class BookingResponse(
    val success: Boolean,
    val bookings: List<Booking>?,
    val booking: Booking?,
    val message: String?
)
