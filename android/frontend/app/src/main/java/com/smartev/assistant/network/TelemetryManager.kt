package com.smartev.assistant.network

import android.os.Handler
import android.os.Looper
import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

object TelemetryManager {
    private const val TAG = "TelemetryManager"
    private var socket: Socket? = null
    
    interface TelemetryListener {
        fun onSessionUpdate(data: JSONObject)
        fun onVehicleTelemetry(data: JSONObject)
        fun onDrivingStopped(data: JSONObject)
        fun onChargeFull()
        fun onChargeLow(message: String)
        fun onConnect()
        fun onDisconnect()
    }

    private val listeners = mutableListOf<TelemetryListener>()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun registerListener(listener: TelemetryListener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener)
        }
    }

    fun unregisterListener(listener: TelemetryListener) {
        listeners.remove(listener)
    }

    fun connect(token: String) {
        if (socket != null && socket!!.connected()) {
            return
        }

        try {
            val opts = IO.Options().apply {
                auth = mapOf("token" to token)
            }
            socket = IO.socket("http://10.0.2.2:5000", opts)
            
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket Connected")
                runOnMain { listeners.forEach { it.onConnect() } }
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Socket Disconnected")
                runOnMain { listeners.forEach { it.onDisconnect() } }
            }

            socket?.on("session:update") { args ->
                val data = args[0] as JSONObject
                runOnMain { listeners.forEach { it.onSessionUpdate(data) } }
            }

            socket?.on("vehicle:telemetry") { args ->
                val data = args[0] as JSONObject
                runOnMain { listeners.forEach { it.onVehicleTelemetry(data) } }
            }

            socket?.on("driving:stopped") { args ->
                val data = args[0] as JSONObject
                runOnMain { listeners.forEach { it.onDrivingStopped(data) } }
            }

            socket?.on("charge:full") {
                runOnMain { listeners.forEach { it.onChargeFull() } }
            }

            socket?.on("charge:low") { args ->
                val data = args[0] as JSONObject
                val msg = data.optString("message", "Low Battery Warning!")
                runOnMain { listeners.forEach { it.onChargeLow(msg) } }
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Error initializing socket", e)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }

    fun subscribeToSession(sessionId: String) {
        val payload = JSONObject().put("sessionId", sessionId)
        socket?.emit("session:subscribe", payload)
    }

    fun startDrivingSim(vehicleId: String, speed: Int = 80, hvac: Boolean = false, terrain: String = "flat") {
        val payload = JSONObject()
            .put("vehicleId", vehicleId)
            .put("speedKmph", speed)
            .put("hvacOn", hvac)
            .put("terrain", terrain)
        socket?.emit("driving:start", payload)
    }

    fun stopDrivingSim(vehicleId: String) {
        val payload = JSONObject().put("vehicleId", vehicleId)
        socket?.emit("driving:stop", payload)
    }

    private fun runOnMain(action: () -> Unit) {
        mainHandler.post(action)
    }
}
