package com.logistics.fleethub

import android.app.PendingIntent
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.databinding.ActivityAdminBinding
import com.logistics.fleethub.utils.NfcUtils

class AdminActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminBinding
    private val db = FirebaseFirestore.getInstance()

    // NFC variables
    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private var isNfcRegistrationMode = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup NFC hardware
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        if (nfcAdapter == null) {
            Toast.makeText(this, "NFC Hardware interface missing on this device.", Toast.LENGTH_LONG).show()
            binding.btnNfcMode.isEnabled = false
            binding.btnNfcMode.text = "NFC COMPATIBILITY HOSE ERROR"
        }

        val launchIntent = Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags)

        // Setup Buttons click actions
        binding.btnNfcMode.setOnClickListener {
            toggleNfcRegistrationRadar()
        }

        binding.btnSaveDriver.setOnClickListener {
            saveDriverToFirestore()
        }

        binding.btnLogout.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun toggleNfcRegistrationRadar() {
        if (nfcAdapter == null) return

        isNfcRegistrationMode = !isNfcRegistrationMode
        if (isNfcRegistrationMode) {
            binding.btnNfcMode.text = "DISABLE NFC SCANNING RADAR"
            binding.btnNfcMode.setBackgroundColor(getColor(R.color.danger))
            binding.tvRadarStatus.text = "🎯 RADAR ACTIVE - TAP REGISTERING SMART CARD NOW"
            binding.tvRadarStatus.setTextColor(getColor(R.color.success))
            
            // Enable foreground collection immediately
            nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
        } else {
            binding.btnNfcMode.text = "ACTIVATE NFC SCANNING RADAR"
            binding.btnNfcMode.setBackgroundColor(getColor(R.color.border_color))
            binding.tvRadarStatus.text = "SCANNER RADAR INACTIVE"
            binding.tvRadarStatus.setTextColor(getColor(R.color.text_secondary))
            
            nfcAdapter?.disableForegroundDispatch(this)
        }
    }

    override fun onResume() {
        super.onResume()
        if (isNfcRegistrationMode) {
            nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
        }
    }

    override fun onPause() {
        super.onPause()
        if (isNfcRegistrationMode) {
            nfcAdapter?.disableForegroundDispatch(this)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (!isNfcRegistrationMode) return

        val action = intent.action
        if (NfcAdapter.ACTION_TAG_DISCOVERED == action || 
            NfcAdapter.ACTION_TECH_DISCOVERED == action) {
            
            // Extract raw tag structure
            val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
            val scannedUid = NfcUtils.getTagUid(tag)
            
            if (scannedUid != null) {
                binding.etNfcTagId.setText(scannedUid)
                Toast.makeText(this, "NFC Token UID read success: $scannedUid", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Card ID extraction failed.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun saveDriverToFirestore() {
        val name = binding.etDriverName.text.toString().trim()
        val email = binding.etDriverEmail.text.toString().trim()
        val fileNumber = binding.etDriverFileid.text.toString().trim()
        val password = binding.etDriverPassword.text.toString().trim()
        val nfcTagId = binding.etNfcTagId.text.toString().trim()

        if (name.isEmpty() || email.isEmpty() || fileNumber.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please satisfy all form metrics.", Toast.LENGTH_SHORT).show()
            return
        }

        val uid = "drv_${fileNumber}"
        val driverPayload = hashMapOf(
            "uid" to uid,
            "name" to name,
            "email" to email,
            "role" to "driver",
            "fileNumber" to fileNumber,
            "password" to password,
            "nfc_tag_id" to nfcTagId
        )

        binding.btnSaveDriver.isEnabled = false
        binding.btnSaveDriver.text = "WRITING SEGMENT..."

        // Write directly to `/users` collection mapping unique user specs
        db.collection("users").document(uid)
            .set(driverPayload)
            .addOnSuccessListener {
                Toast.makeText(this, "Driver details saved safely in Firestore Database!", Toast.LENGTH_LONG).show()
                clearForm()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Database Write Failed: ${e.message}", Toast.LENGTH_LONG).show()
                binding.btnSaveDriver.isEnabled = true
                binding.btnSaveDriver.text = "SAVE PROFILE TO FIRESTORE"
            }
    }

    private fun clearForm() {
        binding.etDriverName.text.clear()
        binding.etDriverEmail.text.clear()
        binding.etDriverFileid.text.clear()
        binding.etDriverPassword.text.clear()
        binding.etNfcTagId.text.clear()
        
        binding.btnSaveDriver.isEnabled = true
        binding.btnSaveDriver.text = "SAVE PROFILE TO FIRESTORE"

        // Ensure we gracefully spin off NFC radar if left open
        if (isNfcRegistrationMode) {
            toggleNfcRegistrationRadar()
        }
    }
}
