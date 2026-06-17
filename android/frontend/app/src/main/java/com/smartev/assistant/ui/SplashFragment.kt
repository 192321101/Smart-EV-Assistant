package com.smartev.assistant.ui

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.smartev.assistant.R
import com.smartev.assistant.network.ApiClient

class SplashFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_splash, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Hold splash screen for 2s, then check authentication status
        Handler(Looper.getMainLooper()).postDelayed({
            if (isAdded) {
                val token = ApiClient.getToken()
                if (token != null) {
                    // Token exists, transition directly to the Main Dashboard
                    findNavController().navigate(R.id.nav_dashboard)
                } else {
                    // Navigate to onboarding Welcome sliders
                    findNavController().navigate(R.id.nav_welcome)
                }
            }
        }, 2000)
    }
}
