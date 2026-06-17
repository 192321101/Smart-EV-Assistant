package com.smartev.assistant.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smartev.assistant.R
import com.smartev.assistant.databinding.FragmentStationsBinding
import com.smartev.assistant.databinding.ItemStationBinding
import com.smartev.assistant.model.Station
import com.smartev.assistant.model.StationResponse
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class StationsFragment : Fragment() {

    private var _binding: FragmentStationsBinding? = null
    private val binding get() = _binding!!

    private var allStations = listOf<Station>()
    private var displayedStations = mutableListOf<Station>()
    private lateinit var adapter: StationAdapter

    private var currentFilter = "ALL" // "ALL", "DC", "AC"

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStationsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.stationsRecycler.layoutManager = LinearLayoutManager(context)
        adapter = StationAdapter(displayedStations) { station ->
            // Book slot navigation action
            val bundle = Bundle().apply {
                putString("stationId", station.id ?: station._id)
                putString("stationName", station.name)
            }
            findNavController().navigate(R.id.nav_bookings, bundle)
        }
        binding.stationsRecycler.adapter = adapter

        // Setup filter button listeners
        binding.filterAll.setOnClickListener {
            updateFilterStyle(binding.filterAll, binding.filterDc, binding.filterAc)
            currentFilter = "ALL"
            applyFilters()
        }
        binding.filterDc.setOnClickListener {
            updateFilterStyle(binding.filterDc, binding.filterAll, binding.filterAc)
            currentFilter = "DC"
            applyFilters()
        }
        binding.filterAc.setOnClickListener {
            updateFilterStyle(binding.filterAc, binding.filterAll, binding.filterDc)
            currentFilter = "AC"
            applyFilters()
        }

        // Setup search input listener
        binding.searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        loadStations()
    }

    private fun updateFilterStyle(selected: Button, unselected1: Button, unselected2: Button) {
        selected.setBackgroundColor(resources.getColor(R.color.colorPrimary, null))
        selected.setTextColor(resources.getColor(R.color.textColorPrimary, null))

        unselected1.setBackgroundColor(resources.getColor(android.R.color.transparent, null))
        unselected1.setTextColor(resources.getColor(R.color.textColorSecondary, null))

        unselected2.setBackgroundColor(resources.getColor(android.R.color.transparent, null))
        unselected2.setTextColor(resources.getColor(R.color.textColorSecondary, null))
    }

    private fun loadStations() {
        ApiClient.getApiService().getStations().enqueue(object : Callback<StationResponse> {
            override fun onResponse(call: Call<StationResponse>, response: Response<StationResponse>) {
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    allStations = response.body()!!.stations ?: emptyList()
                    applyFilters()
                } else {
                    Toast.makeText(context, "Failed to load stations", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<StationResponse>, t: Throwable) {
                Toast.makeText(context, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun applyFilters() {
        val search = binding.searchInput.text.toString().trim().lowercase()
        val filtered = allStations.filter { station ->
            val matchesSearch = station.name.lowercase().contains(search) || 
                                (station.location?.address?.lowercase()?.contains(search) ?: false)
            
            val matchesType = when (currentFilter) {
                "DC" -> station.slots?.any { it.type.contains("DC") || it.type.contains("Hyper") } ?: false
                "AC" -> station.slots?.any { it.type.contains("AC") } ?: false
                else -> true
            }
            matchesSearch && matchesType
        }

        displayedStations.clear()
        displayedStations.addAll(filtered)
        adapter.notifyDataSetChanged()

        binding.emptyStationsText.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // Inner Recycler Adapter for Stations list
    private class StationAdapter(
        private val list: List<Station>,
        private val onBookClick: (Station) -> Unit
    ) : RecyclerView.Adapter<StationAdapter.ViewHolder>() {

        class ViewHolder(val binding: ItemStationBinding) : RecyclerView.ViewHolder(binding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemStationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val station = list[position]
            holder.binding.stationName.text = station.name
            holder.binding.stationAddress.text = station.location?.address ?: "No address provided"
            holder.binding.stationOperator.text = station.operator ?: "Independent Operator"
            
            val price = station.pricing_per_kWh ?: 0.0
            holder.binding.stationPricing.text = "₹${price} / kWh"
            
            val totalSlots = station.slots?.size ?: 0
            val availableSlots = station.slots?.count { it.status == "available" } ?: 0
            holder.binding.stationSlots.text = "Slots Available: $availableSlots / $totalSlots"

            holder.binding.bookBtn.setOnClickListener {
                onBookClick(station)
            }
        }

        override fun getItemCount() = list.size
    }
}
