package com.smartev.assistant.model

data class SavedLocation(
    val id: String?,
    val _id: String?,
    val userId: String?,
    val name: String,
    val address: String,
    val coordinates: List<Double>,
    val isFavorite: Boolean,
    val type: String // "favorite", "destination", "landmark"
)

data class SavedLocationResponse(
    val success: Boolean,
    val locations: List<SavedLocation>?,
    val message: String?
)

data class SavedLocationRequest(
    val name: String,
    val address: String,
    val coordinates: List<Double>,
    val isFavorite: Boolean,
    val type: String
)

data class EmergencySOSResponse(
    val success: Boolean,
    val message: String?,
    val dispatcherSent: Boolean?,
    val nearestHospital: String?,
    val contactsAlerted: List<String>?
)

data class SOSRequest(
    val latitude: Double,
    val longitude: Double,
    val vehicleId: String?
)

data class ForumPost(
    val id: String?,
    val _id: String?,
    val title: String,
    val content: String,
    val author: String,
    val category: String,
    val upvotes: Int?,
    val commentsCount: Int?,
    val createdAt: String?
)

data class ForumResponse(
    val success: Boolean,
    val posts: List<ForumPost>?,
    val message: String?
)

data class VoiceCommandRequest(
    val command: String
)

data class VoiceCommandResponse(
    val success: Boolean,
    val action: String?, // "navigate", "check_battery", "sos", "book_slot", "unknown"
    val textResponse: String?,
    val actionData: Map<String, String>?
)

data class WeatherAlert(
    val title: String,
    val severity: String,
    val message: String,
    val locationName: String
)

data class WeatherResponse(
    val success: Boolean,
    val alerts: List<WeatherAlert>?,
    val weather: Map<String, String>?
)

data class SessionData(
    val id: String?,
    val _id: String?,
    val vehicleId: String?,
    val stationId: String?,
    val slotId: String?,
    val status: String?, // "active", "completed"
    val startCharge: Int?,
    val endCharge: Int?,
    val timeElapsed: Int?,
    val cost: Double?
)

data class SessionResponse(
    val success: Boolean,
    val sessions: List<SessionData>?,
    val session: SessionData?,
    val message: String?
)

data class AnalyticsResponse(
    val success: Boolean,
    val totalSavings: Double?,
    val co2Saved: Double?,
    val energyUsed_kWh: Double?,
    val totalChargingCost: Double?,
    val message: String?
)
