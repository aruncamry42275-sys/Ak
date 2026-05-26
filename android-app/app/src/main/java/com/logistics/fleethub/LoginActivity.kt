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
        
        // Setup view bindings
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            performLogin()
        }
    }

    private fun performLogin() {
        val identifier = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (identifier.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all security fields.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressLoader.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        // Attempt login lookup in both `/users` document indices and `/driverCredentials`
        db.collection("users")
            .whereEqualTo("fileNumber", identifier)
            .get()
            .addOnSuccessListener { querySnapshot ->
                if (!querySnapshot.isEmpty) {
                    val doc = querySnapshot.documents[0]
                    val dbPass = doc.getString("password")
                    if (dbPass == password) {
                        navigateBasedOnRole(
                            uid = doc.id,
                            name = doc.getString("name") ?: "Unnamed Driver",
                            email = doc.getString("email") ?: "",
                            role = doc.getString("role") ?: "driver"
                        )
                    } else {
                        onAuthFailed("Invalid Password/PIN.")
                    }
                } else {
                    // Try by Email as second primary route
                    db.collection("users")
                        .whereEqualTo("email", identifier)
                        .get()
                        .addOnSuccessListener { emailSnap ->
                            if (!emailSnap.isEmpty) {
                                val doc = emailSnap.documents[0]
                                val dbPass = doc.getString("password")
                                if (dbPass == password) {
                                    navigateBasedOnRole(
                                        uid = doc.id,
                                        name = doc.getString("name") ?: "Unnamed Driver",
                                        email = doc.getString("email") ?: "",
                                        role = doc.getString("role") ?: "driver"
                                    )
                                } else {
                                    onAuthFailed("Invalid Password.")
                                }
                            } else {
                                // Fallback checking legacy credentials table
                                checkLegacyCredentials(identifier, password)
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

    private fun checkLegacyCredentials(identifier: String, password: String) {
        db.collection("driverCredentials")
            .document(identifier)
            .get()
            .addOnSuccessListener { doc ->
                if (doc.exists() && doc.getString("password") == password) {
                    navigateBasedOnRole(
                        uid = identifier,
                        name = doc.getString("name") ?: "Unnamed Driver",
                        email = doc.getString("email") ?: "",
                        role = doc.getString("role") ?: "driver"
                    )
                } else {
                    onAuthFailed("Account credentials not recognized.")
                }
            }
            .addOnFailureListener {
                onAuthFailed(it.message ?: "Legacy credentials lookup failure.")
            }
    }

    private fun navigateBasedOnRole(uid: String, name: String, email: String, role: String) {
        binding.progressLoader.visibility = View.GONE
        binding.btnLogin.isEnabled = true
        
        Toast.makeText(this, "Welcome, $name!", Toast.LENGTH_SHORT).show()

        val nextIntent = if (role.lowercase() == "admin") {
            Intent(this, AdminActivity::class.java)
        } else {
            Intent(this, DriverDashboardActivity::class.java)
        }

        nextIntent.putExtra("uid", uid)
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
