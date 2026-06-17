package com.smartev.assistant.model

data class StationLocation(
    val type: String?,
    val coordinates: List<Double>?,
    val address: String?
)

data class Review(
    val userName: String,
    val rating: Double,
    val comment: String
)

data class Slot(
    val id: String,
    val type: String,
    val power_kW: Int,
    val status: String
)

data class Station(
    val id: String?,
    val _id: String?,
    val name: String,
    val operator: String?,
    val location: StationLocation?,
    val amenities: List<String>?,
    val rating: Double?,
    val reviewsCount: Int?,
    val reviews: List<Review>?,
    val pricing_per_kWh: Double?,
    val slots: List<Slot>?
)

data class StationResponse(
    val success: Boolean,
    val stations: List<Station>?,
    val station: Station?,
    val message: String?
)
