package com.smartev.assistant.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.google.gson.Gson
import com.smartev.assistant.R
import com.smartev.assistant.databinding.FragmentDashboardBinding
import com.smartev.assistant.model.User
import com.smartev.assistant.network.ApiClient
import com.smartev.assistant.network.TelemetryManager
import org.json.JSONObject

class DashboardFragment : Fragment(), TelemetryManager.TelemetryListener {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Read active user name
        val userJson = ApiClient.getUserJson()
        if (userJson != null) {
            val user = Gson().fromJson(userJson, User::class.java)
            binding.dashboardWelcome.text = "Welcome, ${user.name}"
            binding.pointsText.text = "${user.points} pts"
        }

        // Register telemetry socket listener
        TelemetryManager.registerListener(this)

        // Bind shortcut grids
        binding.shortcutSos.setOnClickListener { findNavController().navigate(R.id.nav_sos) }
        binding.shortcutVoice.setOnClickListener { findNavController().navigate(R.id.nav_voice) }
        binding.shortcutAnalytics.setOnClickListener { findNavController().navigate(R.id.nav_analytics) }
        binding.shortcutCommunity.setOnClickListener { findNavController().navigate(R.id.nav_community) }
        binding.shortcutCost.setOnClickListener { findNavController().navigate(R.id.nav_cost_optimizer) }
        binding.shortcutWeather.setOnClickListener { findNavController().navigate(R.id.nav_weather) }
    }

    override fun onResume() {
        super.onResume()
        // If socket is disconnected, try reconnecting
        val token = ApiClient.getToken()
        if (token != null) {
            TelemetryManager.connect(token)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        TelemetryManager.unregisterListener(this)
        _binding = null
    }

    // Telemetry Listeners implementation
    override fun onSessionUpdate(data: JSONObject) {
        val charge = data.optInt("currentCharge", 0)
        binding.batteryProgress.progress = charge
        binding.batteryPercentText.text = "$charge%"
        binding.batteryChargingStatus.text = "Charging | Power: ${data.optDouble("powerDraw", 0.0)} kW"
    }

    override fun onVehicleTelemetry(data: JSONObject) {
        val charge = data.optInt("currentCharge", 0)
        binding.batteryProgress.progress = charge
        binding.batteryPercentText.text = "$charge%"
        binding.batteryChargingStatus.text = "Discharging | Speed: ${data.optInt("speed", 0)} km/h"
        
        val range = data.optInt("range_km", 243)
        binding.rangeText.text = "$range km"
    }

    override fun onDrivingStopped(data: JSONObject) {
        binding.batteryChargingStatus.text = "Standby (Sim Stopped)"
    }

    override fun onChargeFull() {
        binding.batteryProgress.progress = 100
        binding.batteryPercentText.text = "100%"
        binding.batteryChargingStatus.text = "Full Charge Complete"
        Toast.makeText(context, "🔋 Your vehicle is fully charged! (100%)", Toast.LENGTH_LONG).show()
    }

    override fun onChargeLow(message: String) {
        binding.batteryChargingStatus.text = "⚠️ Battery Low Warning!"
        Toast.makeText(context, "⚠️ Telemetry Alert: $message", Toast.LENGTH_LONG).show()
    }

    override fun onConnect() {
        binding.dashboardStatusLbl.text = "System Telemetry: Online"
        binding.dashboardStatusLbl.setTextColor(resources.getColor(R.color.colorAccent, null))
    }

    override fun onDisconnect() {
        binding.dashboardStatusLbl.text = "System Telemetry: Offline (Standby)"
        binding.dashboardStatusLbl.setTextColor(resources.getColor(R.color.textColorSecondary, null))
    }
}
