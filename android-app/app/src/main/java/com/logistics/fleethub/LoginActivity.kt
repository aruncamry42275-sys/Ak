package com.logistics.fleethub

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val db = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Check local storage for persistent active session before displaying login layout
        val prefs = getSharedPreferences("FleetHubPrefs", MODE_PRIVATE)
        if (prefs.getBoolean("isLoggedIn", false)) {
            val uid = prefs.getString("uid", "") ?: ""
            val companyId = prefs.getString("companyId", "") ?: ""
            val name = prefs.getString("name", "") ?: ""
            val email = prefs.getString("email", "") ?: ""
            val role = prefs.getString("role", "") ?: ""

            if (uid.isNotEmpty() && companyId.isNotEmpty()) {
                val nextIntent = if (role.lowercase() == "admin") {
                    Intent(this, AdminActivity::class.java)
                } else {
                    Intent(this, DriverDashboardActivity::class.java)
                }
                nextIntent.putExtra("uid", uid)
                nextIntent.putExtra("companyId", companyId)
                nextIntent.putExtra("name", name)
                nextIntent.putExtra("email", email)
                nextIntent.putExtra("role", role)
                
                startActivity(nextIntent)
                finish()
                return
            }
        }

        // Setup view bindings if no cached session exists
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            performLogin()
        }

        binding.btnToMaster.setOnClickListener {
            startActivity(Intent(this, MasterControlActivity::class.java))
            finish()
        }
    }

    private fun performLogin() {
        val companyId = binding.etLoginCompanyId.text.toString().trim().replace(" ", "_").uppercase()
        val identifier = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (companyId.isEmpty()) {
            Toast.makeText(this, "Please enter your Company Tenant ID.", Toast.LENGTH_SHORT).show()
            return
        }

        if (identifier.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all security fields.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressLoader.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        // Attempt multi-tenant login lookup under /Companies/{Company_ID}/users
        db.collection("Companies")
            .document(companyId)
            .collection("users")
            .whereEqualTo("fileNumber", identifier)
            .get()
            .addOnSuccessListener { querySnapshot ->
                if (!querySnapshot.isEmpty) {
                    val doc = querySnapshot.documents[0]
                    val dbPass = doc.getString("password")
                    if (dbPass == password) {
                        navigateBasedOnRole(
                            companyId = companyId,
                            uid = doc.id,
                            name = doc.getString("name") ?: "Unnamed Driver",
                            email = doc.getString("email") ?: "",
                            role = doc.getString("role") ?: "driver"
                        )
                    } else {
                        onAuthFailed("Invalid Password/PIN.")
                    }
                } else {
                    // Try email lookup in the exact same multi-tenant node
                    db.collection("Companies")
                        .document(companyId)
                        .collection("users")
                        .whereEqualTo("email", identifier)
                        .get()
                        .addOnSuccessListener { emailSnap ->
                            if (!emailSnap.isEmpty) {
                                val doc = emailSnap.documents[0]
                                val dbPass = doc.getString("password")
                                if (dbPass == password) {
                                    navigateBasedOnRole(
                                        companyId = companyId,
                                        uid = doc.id,
                                        name = doc.getString("name") ?: "Unnamed Driver",
                                        email = doc.getString("email") ?: "",
                                        role = doc.getString("role") ?: "driver"
                                    )
                                } else {
                                    onAuthFailed("Invalid Password/PIN.")
                                }
                            } else {
                                onAuthFailed("Identifier not found inside Company node.")
                            }
                        }
                        .addOnFailureListener {
                            onAuthFailed(it.message ?: "Authentication query error.")
                        }
                }
            }
            .addOnFailureListener {
                onAuthFailed(it.message ?: "Network error connecting to Firestore.")
            }
    }

    private fun navigateBasedOnRole(companyId: String, uid: String, name: String, email: String, role: String) {
        // Save persistent credentials into SharedPreferences cache to survive App updates safely
        val prefs = getSharedPreferences("FleetHubPrefs", MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("isLoggedIn", true)
            putString("companyId", companyId)
            putString("uid", uid)
            putString("name", name)
            putString("email", email)
            putString("role", role)
            apply()
        }

        binding.progressLoader.visibility = View.GONE
        binding.btnLogin.isEnabled = true
        
        Toast.makeText(this, "Welcome, $name!", Toast.LENGTH_SHORT).show()

        val nextIntent = if (role.lowercase() == "admin") {
            Intent(this, AdminActivity::class.java)
        } else {
            Intent(this, DriverDashboardActivity::class.java)
        }

        nextIntent.putExtra("uid", uid)
        nextIntent.putExtra("companyId", companyId)
        nextIntent.putExtra("name", name)
        nextIntent.putExtra("email", email)
        nextIntent.putExtra("role", role)
        
        startActivity(nextIntent)
        finish()
    }

    private fun onAuthFailed(errMsg: String) {
        binding.progressLoader.visibility = View.GONE
        binding.btnLogin.isEnabled = true
        Toast.makeText(this, "⚠️ Access Denied: $errMsg", Toast.LENGTH_LONG).show()
    }
}
