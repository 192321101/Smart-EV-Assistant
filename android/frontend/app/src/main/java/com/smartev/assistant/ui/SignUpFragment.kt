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
import com.smartev.assistant.databinding.FragmentSignupBinding
import com.smartev.assistant.model.AuthResponse
import com.smartev.assistant.model.RegisterRequest
import com.smartev.assistant.network.ApiClient
import com.smartev.assistant.network.TelemetryManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class SignUpFragment : Fragment() {

    private var _binding: FragmentSignupBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSignupBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.signupBtn.setOnClickListener {
            performRegister()
        }

        binding.gotoSigninBtn.setOnClickListener {
            findNavController().navigate(R.id.nav_signin)
        }
    }

    private fun performRegister() {
        val name = binding.nameInput.text.toString().trim()
        val email = binding.emailInput.text.toString().trim()
        val password = binding.passwordInput.text.toString().trim()
        val phone = binding.phoneInput.text.toString().trim()
        val evModel = binding.evModelInput.text.toString().trim()

        if (name.isEmpty()) {
            binding.nameInput.error = "Name is required"
            return
        }
        if (email.isEmpty()) {
            binding.emailInput.error = "Email address is required"
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInput.error = "Invalid email format"
            return
        }
        if (password.isEmpty()) {
            binding.passwordInput.error = "Password is required"
            return
        }
        if (password.length < 6) {
            binding.passwordInput.error = "Password must be at least 6 characters"
            return
        }

        binding.signupBtn.isEnabled = false
        binding.signupBtn.text = "REGISTERING..."

        val apiService = ApiClient.getApiService()
        val req = RegisterRequest(name, email, password, phone.ifEmpty { null }, evModel.ifEmpty { null })
        val call = apiService.register(req)

        call.enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                binding.signupBtn.isEnabled = true
                binding.signupBtn.text = "REGISTER"

                if (response.isSuccessful && response.body() != null) {
                    val authBody = response.body()!!
                    if (authBody.success && authBody.accessToken != null && authBody.user != null) {
                        ApiClient.setToken(authBody.accessToken)
                        ApiClient.saveUserJson(Gson().toJson(authBody.user))
                        
                        // Connect socket telemetry stream
                        TelemetryManager.connect(authBody.accessToken)
                        
                        Toast.makeText(context, "Registration Successful!", Toast.LENGTH_SHORT).show()
                        findNavController().navigate(R.id.nav_dashboard)
                    } else {
                        Toast.makeText(context, authBody.message ?: "Registration failed", Toast.LENGTH_LONG).show()
                    }
                } else {
                    Toast.makeText(context, "Registration failed or email already exists", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<AuthResponse>, t: Throwable) {
                binding.signupBtn.isEnabled = true
                binding.signupBtn.text = "REGISTER"
                Toast.makeText(context, "Network error: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
