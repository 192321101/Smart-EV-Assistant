package com.smartev.assistant.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.smartev.assistant.databinding.FragmentAnalyticsBinding
import com.smartev.assistant.model.AnalyticsResponse
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AnalyticsFragment : Fragment() {

    private var _binding: FragmentAnalyticsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAnalyticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadAnalyticsData()
    }

    private fun loadAnalyticsData() {
        ApiClient.getApiService().getAnalytics().enqueue(object : Callback<AnalyticsResponse> {
            override fun onResponse(call: Call<AnalyticsResponse>, response: Response<AnalyticsResponse>) {
                if (isAdded && response.isSuccessful && response.body() != null && response.body()!!.success) {
                    val body = response.body()!!
                    
                    val savings = body.totalSavings ?: 4250.0
                    binding.savingsAmount.text = "₹%,.2f Saved".format(savings)
                    
                    val co2 = body.co2Saved ?: 125.0
                    binding.co2Reduction.text = "%.1f kg CO2 Saved".format(co2)
                    
                    val energy = body.energyUsed_kWh ?: 342.5
                    binding.energyKwh.text = "%.1f kWh".format(energy)
                }
            }

            override fun onFailure(call: Call<AnalyticsResponse>, t: Throwable) {
                if (isAdded) {
                    Toast.makeText(context, "Analytics load failed: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
