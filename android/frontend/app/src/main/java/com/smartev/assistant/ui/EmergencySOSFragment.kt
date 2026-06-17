package com.smartev.assistant.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.smartev.assistant.databinding.FragmentSosBinding
import com.smartev.assistant.model.EmergencySOSResponse
import com.smartev.assistant.model.SOSRequest
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class EmergencySOSFragment : Fragment() {

    private var _binding: FragmentSosBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSosBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.sosTriggerBtn.setOnClickListener {
            triggerSOS()
        }
    }

    private fun triggerSOS() {
        binding.sosTriggerBtn.isEnabled = false
        binding.sosTriggerBtn.text = "ALERTING..."

        // Broadcasting default Mumbai coordinates
        val req = SOSRequest(19.0596, 72.8311, null)

        ApiClient.getApiService().triggerSOS(req).enqueue(object : Callback<EmergencySOSResponse> {
            override fun onResponse(call: Call<EmergencySOSResponse>, response: Response<EmergencySOSResponse>) {
                if (isAdded) {
                    binding.sosTriggerBtn.isEnabled = true
                    binding.sosTriggerBtn.text = "SOS"

                    if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                        val body = response.body()!!
                        binding.sosStatusCard.visibility = View.VISIBLE
                        binding.sosDetails.text = "Dispatcher Sent: ${if (body.dispatcherSent == true) "Yes" else "No"}\n" +
                                "Nearest Hospital: ${body.nearestHospital ?: "Finding Nearest..."}\n" +
                                "Alerted Contacts: ${body.contactsAlerted?.size ?: 0}"
                        Toast.makeText(context, "SOS Beacon successfully broadcasted!", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(context, "Failed to register SOS request", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            override fun onFailure(call: Call<EmergencySOSResponse>, t: Throwable) {
                if (isAdded) {
                    binding.sosTriggerBtn.isEnabled = true
                    binding.sosTriggerBtn.text = "SOS"
                    Toast.makeText(context, "SOS Dispatch network error: ${t.message}", Toast.LENGTH_LONG).show()
                }
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
