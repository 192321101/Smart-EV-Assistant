package com.smartev.assistant

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.smartev.assistant.databinding.ActivityMainBinding
import com.smartev.assistant.network.ApiClient

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize API Client singleton to access SharedPreferences
        ApiClient.init(applicationContext)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController

        // Bind Navigation Controller to bottom nav menu
        binding.bottomNavigation.setupWithNavController(navController)

        // Dynamically toggle visibility of bottom bar and toolbar based on active navigation node
        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                R.id.nav_splash, R.id.nav_welcome, R.id.nav_signin, R.id.nav_signup -> {
                    binding.toolbar.visibility = View.GONE
                    binding.bottomNavigation.visibility = View.GONE
                }
                else -> {
                    binding.toolbar.visibility = View.VISIBLE
                    binding.bottomNavigation.visibility = View.VISIBLE
                    binding.toolbar.title = destination.label
                }
            }
        }
    }
}
