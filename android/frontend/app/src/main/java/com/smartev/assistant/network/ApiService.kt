package com.smartev.assistant.network

import com.smartev.assistant.model.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/login")
    fun login(@Body req: LoginRequest): Call<AuthResponse>

    @POST("auth/register")
    fun register(@Body req: RegisterRequest): Call<AuthResponse>

    @POST("auth/verify-otp")
    fun verifyOtp(@Body req: OtpRequest): Call<AuthResponse>

    @POST("auth/forgot-password")
    fun forgotPassword(@Body req: ForgotPasswordRequest): Call<GenericResponse>

    @POST("auth/reset-password")
    fun resetPassword(@Body req: ResetPasswordRequest): Call<GenericResponse>

    @POST("auth/logout")
    fun logout(): Call<GenericResponse>

    // Vehicles
    @GET("vehicles")
    fun getVehicles(): Call<VehicleResponse>

    @POST("vehicles")
    fun addVehicle(@Body vehicle: Vehicle): Call<VehicleResponse>

    @PUT("vehicles/{id}/default")
    fun setDefaultVehicle(@Path("id") id: String): Call<VehicleResponse>

    // Charging Stations
    @GET("stations")
    fun getStations(): Call<StationResponse>

    @GET("stations/{id}")
    fun getStationById(@Path("id") id: String): Call<StationResponse>

    // Bookings
    @GET("bookings")
    fun getBookings(): Call<BookingResponse>

    @POST("bookings")
    fun createBooking(@Body req: BookingRequest): Call<BookingResponse>

    // SOS / Emergency
    @POST("emergency/sos")
    fun triggerSOS(@Body req: SOSRequest): Call<EmergencySOSResponse>

    // Voice Command
    @POST("voice/command")
    fun sendVoiceCommand(@Body req: VoiceCommandRequest): Call<VoiceCommandResponse>

    // Community / Forum
    @GET("community/posts")
    fun getForumPosts(): Call<ForumResponse>

    @POST("community/posts")
    fun createForumPost(@Body post: ForumPost): Call<ForumResponse>

    // Analytics
    @GET("analytics")
    fun getAnalytics(): Call<AnalyticsResponse>

    // Charging Sessions
    @GET("sessions")
    fun getSessions(): Call<SessionResponse>

    @POST("sessions/start")
    fun startSession(@Body body: Map<String, String>): Call<SessionResponse>

    @PUT("sessions/{id}/end")
    fun endSession(@Path("id") id: String): Call<SessionResponse>
}
