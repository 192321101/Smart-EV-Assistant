package com.smartev.assistant.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.google.gson.Gson
import com.smartev.assistant.R
import com.smartev.assistant.databinding.FragmentSigninBinding
import com.smartev.assistant.model.AuthResponse
import com.smartev.assistant.model.LoginRequest
import com.smartev.assistant.network.ApiClient
import com.smartev.assistant.network.TelemetryManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class SignInFragment : Fragment() {

    private var _binding: FragmentSigninBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSigninBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.signinBtn.setOnClickListener {
            performLogin()
        }

        binding.gotoSignupBtn.setOnClickListener {
            findNavController().navigate(R.id.nav_signup)
        }

        binding.forgotPasswordBtn.setOnClickListener {
            showForgotPasswordHint()
        }

        // Setup Quick Demo Auto-fill buttons
        binding.demoDriverBtn.setOnClickListener {
            binding.emailInput.setText("test1@ev.app")
            binding.passwordInput.setText("Test@1234")
            performLogin()
        }

        binding.demoAdminBtn.setOnClickListener {
            binding.emailInput.setText("admin@ev.app")
            binding.passwordInput.setText("Admin@1234")
            performLogin()
        }

        binding.demoOperatorBtn.setOnClickListener {
            binding.emailInput.setText("operator@ev.app")
            binding.passwordInput.setText("Operator@1234")
            performLogin()
        }
    }

    private fun performLogin() {
        val email = binding.emailInput.text.toString().trim()
        val password = binding.passwordInput.text.toString().trim()

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

        binding.signinBtn.isEnabled = false
        binding.signinBtn.text = "SYNCING GRID..."

        val apiService = ApiClient.getApiService()
        val call = apiService.login(LoginRequest(email, password))
        
        call.enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                binding.signinBtn.isEnabled = true
                binding.signinBtn.text = "SIGN IN"

                if (response.isSuccessful && response.body() != null) {
                    val authBody = response.body()!!
                    if (authBody.success && authBody.accessToken != null && authBody.user != null) {
                        ApiClient.setToken(authBody.accessToken)
                        ApiClient.saveUserJson(Gson().toJson(authBody.user))
                        
                        // Connect to Telemetry WebSocket stream using token
                        TelemetryManager.connect(authBody.accessToken)
                        
                        Toast.makeText(context, "Successfully Logged In!", Toast.LENGTH_SHORT).show()
                        findNavController().navigate(R.id.nav_dashboard)
                    } else {
                        Toast.makeText(context, authBody.message ?: "Authentication failed", Toast.LENGTH_LONG).show()
                    }
                } else {
                    Toast.makeText(context, "Invalid email or password", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<AuthResponse>, t: Throwable) {
                binding.signinBtn.isEnabled = true
                binding.signinBtn.text = "SIGN IN"
                Toast.makeText(context, "Connection error. Make sure backend node is running.", Toast.LENGTH_LONG).show()
            }
        })
    }

    private fun showForgotPasswordHint() {
        AlertDialog.Builder(requireContext())
            .setTitle("Forgot Password")
            .setMessage("Demo accounts: test1@ev.app (pass: Test@1234), admin@ev.app (pass: Admin@1234), operator@ev.app (pass: Operator@1234). User OTP simulator: otp is '123456'.")
            .setPositiveButton("OK", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
