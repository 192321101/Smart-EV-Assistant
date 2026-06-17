package com.smartev.assistant.network

import android.content.Context
import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val PREFS_NAME = "ev_assistant_prefs"
    private const val KEY_TOKEN = "ev_token"
    private const val KEY_USER = "ev_user"

    // Use 10.0.2.2 to connect to local server from Android Emulator
    private var baseUrl = "http://10.0.2.2:5000/api/"

    private var retrofit: Retrofit? = null
    private var token: String? = null
    private lateinit var sharedPreferences: SharedPreferences

    fun init(context: Context) {
        sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        token = sharedPreferences.getString(KEY_TOKEN, null)
    }

    fun setToken(newToken: String?) {
        token = newToken
        sharedPreferences.edit().putString(KEY_TOKEN, newToken).apply()
        retrofit = null // Force re-creation of OkHttpClient to include the token
    }

    fun getToken(): String? {
        return token
    }

    fun saveUserJson(userJson: String) {
        sharedPreferences.edit().putString(KEY_USER, userJson).apply()
    }

    fun getUserJson(): String? {
        return sharedPreferences.getString(KEY_USER, null)
    }

    fun clearSession() {
        token = null
        sharedPreferences.edit().clear().apply()
        retrofit = null
    }

    fun getApiService(): ApiService {
        if (retrofit == null) {
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .addInterceptor { chain ->
                    val original = chain.request()
                    val requestBuilder = original.newBuilder()
                    
                    token?.let {
                        requestBuilder.addHeader("Authorization", "Bearer $it")
                    }
                    
                    chain.proceed(requestBuilder.build())
                }
                .addInterceptor(loggingInterceptor)
                .build()

            retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofit!!.create(ApiService::class.java)
    }
}
