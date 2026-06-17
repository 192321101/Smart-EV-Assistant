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
import com.smartev.assistant.databinding.FragmentSettingsBinding
import com.smartev.assistant.model.GenericResponse
import com.smartev.assistant.model.User
import com.smartev.assistant.model.VehicleResponse
import com.smartev.assistant.network.ApiClient
import com.smartev.assistant.network.TelemetryManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Fill Profile Info from SharedPreferences
        val userJson = ApiClient.getUserJson()
        if (userJson != null) {
            val user = Gson().fromJson(userJson, User::class.java)
            binding.profileName.text = user.name
            binding.profileEmail.text = user.email
        }

        binding.logoutBtn.setOnClickListener {
            performLogout()
        }

        loadGarageInfo()
    }

    private fun loadGarageInfo() {
        ApiClient.getApiService().getVehicles().enqueue(object : Callback<VehicleResponse> {
            override fun onResponse(call: Call<VehicleResponse>, response: Response<VehicleResponse>) {
                if (isAdded && response.isSuccessful && response.body() != null && response.body()!!.success) {
                    val list = response.body()!!.vehicles ?: emptyList()
                    val defaultVeh = list.find { it.isDefault } ?: list.firstOrNull()
                    
                    if (defaultVeh != null) {
                        binding.vehicleModel.text = "${defaultVeh.brand} ${defaultVeh.model}"
                        binding.vehiclePlate.text = "Plate: ${defaultVeh.plateNumber}"
                        binding.vehicleBatterySpec.text = "Capacity: ${defaultVeh.batteryCapacity_kWh} kWh | SoC: ${defaultVeh.currentCharge_percent}%"
                    } else {
                        binding.vehicleModel.text = "No vehicle added"
                        binding.vehiclePlate.text = "Add vehicle in settings"
                    }
                }
            }

            override fun onFailure(call: Call<VehicleResponse>, t: Throwable) {}
        })
    }

    private fun performLogout() {
        binding.logoutBtn.isEnabled = false
        binding.logoutBtn.text = "revoking grid token..."

        ApiClient.getApiService().logout().enqueue(object : Callback<GenericResponse> {
            override fun onResponse(call: Call<GenericResponse>, response: Response<GenericResponse>) {
                finalizeLogout()
            }

            override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                finalizeLogout() // Log out locally anyway
            }
        })
    }

    private fun finalizeLogout() {
        if (isAdded) {
            // Disconnect WebSockets stream
            TelemetryManager.disconnect()
            
            // Clear token in storage
            ApiClient.clearSession()
            
            Toast.makeText(context, "Logged out successfully", Toast.LENGTH_SHORT).show()
            
            // Navigate back to SignIn Gateway
            findNavController().navigate(R.id.nav_signin)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
