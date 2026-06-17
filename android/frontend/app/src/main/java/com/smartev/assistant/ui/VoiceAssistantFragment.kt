package com.smartev.assistant.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.smartev.assistant.databinding.FragmentVoiceBinding
import com.smartev.assistant.model.VoiceCommandRequest
import com.smartev.assistant.model.VoiceCommandResponse
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class VoiceAssistantFragment : Fragment() {

    private var _binding: FragmentVoiceBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentVoiceBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.micBtn.setOnClickListener {
            promptVoiceCommandEntry()
        }
    }

    private fun promptVoiceCommandEntry() {
        val input = EditText(context).apply {
            hint = "e.g. check battery, find charging station, SOS"
        }

        AlertDialog.Builder(requireContext())
            .setTitle("AI Voice command simulator")
            .setMessage("Enter a text voice command to send to the assistant:")
            .setView(input)
            .setPositiveButton("Send") { dialog, _ ->
                val command = input.text.toString().trim()
                if (command.isNotEmpty()) {
                    processVoiceCommand(command)
                }
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    private fun processVoiceCommand(command: String) {
        binding.voiceStatusText.text = "Processing command..."
        binding.transcriptText.text = "\"$command\""
        
        ApiClient.getApiService().sendVoiceCommand(VoiceCommandRequest(command)).enqueue(object : Callback<VoiceCommandResponse> {
            override fun onResponse(call: Call<VoiceCommandResponse>, response: Response<VoiceCommandResponse>) {
                if (isAdded) {
                    binding.voiceStatusText.text = "Tap to Speak"
                    if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                        val body = response.body()!!
                        binding.responseText.text = body.textResponse ?: "Command processed successfully"
                        Toast.makeText(context, "Command resolved: ${body.action}", Toast.LENGTH_SHORT).show()
                    } else {
                        binding.responseText.text = "Error: Unrecognized command or grid offline"
                    }
                }
            }

            override fun onFailure(call: Call<VoiceCommandResponse>, t: Throwable) {
                if (isAdded) {
                    binding.voiceStatusText.text = "Tap to Speak"
                    binding.responseText.text = "Network error processing voice command: ${t.message}"
                }
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
