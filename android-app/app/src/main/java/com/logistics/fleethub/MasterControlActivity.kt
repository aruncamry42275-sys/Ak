package com.logistics.fleethub

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.databinding.ActivityMasterControlBinding

class MasterControlActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMasterControlBinding
    private val db = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMasterControlBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Read and list any existing companies
        loadCompaniesList()

        binding.btnCreateCompany.setOnClickListener {
            createNewCompany()
        }

        binding.btnBackToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun loadCompaniesList() {
        binding.layoutCompaniesList.removeAllViews()

        db.collection("Companies")
            .get()
            .addOnSuccessListener { query ->
                if (query.isEmpty) {
                    val helpText = TextView(this)
                    helpText.text = "No companies registered in cloud database."
                    helpText.setTextColor(getColor(R.color.text_secondary))
                    helpText.textSize = 12f
                    binding.layoutCompaniesList.addView(helpText)
                    return@addOnSuccessListener
                }

                for (doc in query.documents) {
                    val companyName = doc.getString("companyName") ?: "Unnamed Tenant"
                    val companyId = doc.id

                    val companyView = LinearLayout(this).apply {
                        orientation = LinearLayout.VERTICAL
                        setPadding(12, 12, 12, 12)
                        setBackgroundColor(getColor(R.color.dark_background))
                        val params = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, 0, 0, 16)
                        }
                        layoutParams = params
                    }

                    val titleText = TextView(this).apply {
                        text = companyName.uppercase()
                        setTextColor(getColor(R.color.white))
                        textSize = 13f
                        isSelected = true // for marquee effect if required
                    }

                    val subtitleText = TextView(this).apply {
                        text = "Company ID: $companyId"
                        setTextColor(getColor(R.color.danger))
                        textSize = 10f
                    }

                    companyView.addView(titleText)
                    companyView.addView(subtitleText)
                    binding.layoutCompaniesList.addView(companyView)
                }
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Failed to inspect directory: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun createNewCompany() {
        val companyName = binding.etCompanyName.text.toString().trim()
        val requestedCompanyId = binding.etCompanyIdInput.text.toString().trim()
        val adminEmail = binding.etAdminEmail.text.toString().trim()
        val adminPassword = binding.etAdminPassword.text.toString().trim()

        if (companyName.isEmpty() || requestedCompanyId.isEmpty() || adminEmail.isEmpty() || adminPassword.isEmpty()) {
            Toast.makeText(this, "Please fulfill all setup specifications.", Toast.LENGTH_SHORT).show()
            return
        }

        val companyIdClean = requestedCompanyId.replace(" ", "_").uppercase()

        // Construct Company Master fields
        val companyPayload = hashMapOf(
            "companyId" to companyIdClean,
            "companyName" to companyName,
            "createdAt" to com.google.firebase.Timestamp.now()
        )

        binding.btnCreateCompany.isEnabled = false
        binding.btnCreateCompany.text = "PROVISIONING INSTANCE..."

        // Write to Master Companies collection path
        db.collection("Companies").document(companyIdClean)
            .set(companyPayload)
            .addOnSuccessListener {
                
                // Initialize default Admin user account under subcollection: `/Companies/{Company_ID}/users/admin_usr`
                val adminPayload = hashMapOf(
                    "uid" to "admin_usr",
                    "name" to "$companyName Admin",
                    "email" to adminEmail,
                    "password" to adminPassword,
                    "role" to "admin",
                    "fileNumber" to "999" // Default Admin fileId fallback
                )

                db.collection("Companies").document(companyIdClean)
                    .collection("users").document("admin_usr")
                    .set(adminPayload)
                    .addOnSuccessListener {
                        Toast.makeText(this, "Company initialized with Admin successfully!", Toast.LENGTH_LONG).show()
                        
                        binding.etCompanyName.text.clear()
                        binding.etCompanyIdInput.text.clear()
                        binding.etAdminEmail.text.clear()
                        binding.etAdminPassword.text.clear()

                        binding.btnCreateCompany.isEnabled = true
                        binding.btnCreateCompany.text = "INITIALIZE COMPANY PROFILE"

                        loadCompaniesList()
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(this, "Admin setup failed: ${e.message}", Toast.LENGTH_LONG).show()
                        binding.btnCreateCompany.isEnabled = true
                        binding.btnCreateCompany.text = "INITIALIZE COMPANY PROFILE"
                    }
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Company setup failed: ${e.message}", Toast.LENGTH_LONG).show()
                binding.btnCreateCompany.isEnabled = true
                binding.btnCreateCompany.text = "INITIALIZE COMPANY PROFILE"
            }
    }
}
