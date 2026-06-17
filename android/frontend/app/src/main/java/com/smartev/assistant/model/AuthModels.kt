package com.smartev.assistant.model

data class User(
    val id: String,
    val _id: String?,
    val name: String,
    val email: String,
    val phone: String?,
    val evModel: String?,
    val role: String, // "driver", "admin", "station_operator"
    val points: Int,
    val tier: String
)

data class AuthResponse(
    val success: Boolean,
    val accessToken: String?,
    val message: String?,
    val user: User?
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val phone: String?,
    val evModel: String?
)

data class OtpRequest(
    val email: String,
    val otp: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val email: String,
    val otp: String,
    val newPassword: String
)

data class GenericResponse(
    val success: Boolean,
    val message: String?
)
