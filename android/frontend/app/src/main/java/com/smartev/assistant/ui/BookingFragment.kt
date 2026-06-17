package com.smartev.assistant.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.smartev.assistant.R
import com.smartev.assistant.databinding.FragmentBookingBinding
import com.smartev.assistant.databinding.ItemBookingBinding
import com.smartev.assistant.model.Booking
import com.smartev.assistant.model.BookingRequest
import com.smartev.assistant.model.BookingResponse
import com.smartev.assistant.model.Vehicle
import com.smartev.assistant.model.VehicleResponse
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.*

class BookingFragment : Fragment() {

    private var _binding: FragmentBookingBinding? = null
    private val binding get() = _binding!!

    private var targetStationId: String? = null
    private var targetStationName: String? = null
    private var defaultVehicleId: String? = null

    private val bookingHistory = mutableListOf<Booking>()
    private lateinit var adapter: BookingAdapter
    
    private val calendar = Calendar.getInstance()
    private val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBookingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Parse arguments
        targetStationId = arguments?.getString("stationId")
        targetStationName = arguments?.getString("stationName")

        if (targetStationName != null) {
            binding.bookingHeader.text = "Book Slot at $targetStationName"
        } else {
            binding.bookingHeader.text = "Reserve Charging Slot"
        }

        // Configure Date Picker
        binding.datePickerBtn.text = dateFormatter.format(calendar.time)
        binding.datePickerBtn.setOnClickListener {
            DatePickerDialog(requireContext(), { _, year, month, day ->
                calendar.set(Calendar.YEAR, year)
                calendar.set(Calendar.MONTH, month)
                calendar.set(Calendar.DAY_OF_MONTH, day)
                binding.datePickerBtn.text = dateFormatter.format(calendar.time)
            }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show()
        }

        // Setup Time Slot Spinner
        val timeSlots = arrayOf(
            "08:00 - 09:00",
            "10:00 - 11:00",
            "12:00 - 13:00",
            "14:00 - 15:00",
            "16:00 - 17:00",
            "18:00 - 19:00",
            "20:00 - 21:00"
        )
        val spinnerAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, timeSlots)
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.timeslotSpinner.adapter = spinnerAdapter

        // History Recycler View Setup
        binding.bookingsRecycler.layoutManager = LinearLayoutManager(context)
        adapter = BookingAdapter(bookingHistory)
        binding.bookingsRecycler.adapter = adapter

        binding.confirmBookingBtn.setOnClickListener {
            submitBooking()
        }

        loadDefaultVehicleAndHistory()
    }

    private fun loadDefaultVehicleAndHistory() {
        // Fetch vehicles to obtain default vehicle id
        ApiClient.getApiService().getVehicles().enqueue(object : Callback<VehicleResponse> {
            override fun onResponse(call: Call<VehicleResponse>, response: Response<VehicleResponse>) {
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    val list = response.body()!!.vehicles ?: emptyList()
                    val defaultVeh = list.find { it.isDefault } ?: list.firstOrNull()
                    defaultVehicleId = defaultVeh?.id ?: defaultVeh?._id
                }
                loadHistory()
            }

            override fun onFailure(call: Call<VehicleResponse>, t: Throwable) {
                loadHistory()
            }
        })
    }

    private fun loadHistory() {
        ApiClient.getApiService().getBookings().enqueue(object : Callback<BookingResponse> {
            override fun onResponse(call: Call<BookingResponse>, response: Response<BookingResponse>) {
                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    bookingHistory.clear()
                    bookingHistory.addAll(response.body()!!.bookings ?: emptyList())
                    adapter.notifyDataSetChanged()
                }
            }

            override fun onFailure(call: Call<BookingResponse>, t: Throwable) {}
        })
    }

    private fun submitBooking() {
        val stationId = targetStationId ?: "st_bandra_01" // Fallback to Bandra Hub if not selected
        val vehicleId = defaultVehicleId
        if (vehicleId == null) {
            Toast.makeText(context, "No vehicle found. Configure default vehicle in Settings first.", Toast.LENGTH_LONG).show()
            return
        }

        val date = binding.datePickerBtn.text.toString()
        val timeSlot = binding.timeslotSpinner.selectedItem.toString()

        binding.confirmBookingBtn.isEnabled = false
        binding.confirmBookingBtn.text = "RESERVING..."

        // Mapped to default slot id 's1' if not specified
        val req = BookingRequest(vehicleId, stationId, "s1", date, timeSlot)

        ApiClient.getApiService().createBooking(req).enqueue(object : Callback<BookingResponse> {
            override fun onResponse(call: Call<BookingResponse>, response: Response<BookingResponse>) {
                binding.confirmBookingBtn.isEnabled = true
                binding.confirmBookingBtn.text = "CONFIRM RESERVATION"

                if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                    Toast.makeText(context, "Slot Successfully Reserved!", Toast.LENGTH_SHORT).show()
                    loadHistory()
                } else {
                    Toast.makeText(context, response.body()?.message ?: "Reservation failed", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<BookingResponse>, t: Throwable) {
                binding.confirmBookingBtn.isEnabled = true
                binding.confirmBookingBtn.text = "CONFIRM RESERVATION"
                Toast.makeText(context, "Connection failed: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // Inner Recycler Adapter for Bookings history
    private class BookingAdapter(private val list: List<Booking>) : RecyclerView.Adapter<BookingAdapter.ViewHolder>() {

        class ViewHolder(val binding: ItemBookingBinding) : RecyclerView.ViewHolder(binding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemBookingBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val booking = list[position]
            holder.binding.bookingDateTime.text = "${booking.date} | ${booking.timeSlot}"
            holder.binding.bookingStatus.text = (booking.status ?: "PENDING").uppercase()
            
            val cost = booking.cost ?: 0.0
            holder.binding.bookingCost.text = "Estimated Cost: ₹${cost}"
            
            holder.binding.bookingStationLbl.text = "Station: " + (booking.stationId ?: "PulseCharge HyperHub")
            holder.binding.bookingSlotType.text = "Slot ID: " + (booking.slotId ?: "s1")
        }

        override fun getItemCount() = list.size
    }
}
