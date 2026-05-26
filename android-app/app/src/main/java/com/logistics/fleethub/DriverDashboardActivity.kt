package com.logistics.fleethub

import android.app.PendingIntent
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.databinding.ActivityDriverDashboardBinding
import com.logistics.fleethub.utils.NfcUtils
import java.text.SimpleDateFormat
import java.util.*

class DriverDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDriverDashboardBinding
    private val db = FirebaseFirestore.getInstance()

    // Active Driver Profile Session
    private lateinit var currentUid: String
    private lateinit var currentName: String
    private lateinit var currentEmail: String
    private var driverNfcId: String? = null

    // NFC Adapter
    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null

    // Attendance State
    private var todayLogId: String? = null
    private var todayCheckInTime: String? = null
    private var isCheckedIn = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityDriverDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Parse driver intent parameters
        currentUid = intent.getStringExtra("uid") ?: "drv_unknown"
        currentName = intent.getStringExtra("name") ?: "Unnamed Driver"
        currentEmail = intent.getStringExtra("email") ?: ""

        binding.tvWelcomeDriver.text = currentName
        binding.tvDriverEmail.text = currentEmail

        // Initialize NFC Adapter
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        val launchIntent = Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags)

        // Set up Maintenance Log categories for Toyota Fortuner
        val categories = arrayOf("Regular Service", "Interim Repairs", "Spare Parts Replacement")
        val spinnerAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, categories)
        binding.spnCategory.adapter = spinnerAdapter

        // Click listeners
        binding.btnSaveMaint.setOnClickListener {
            submitMaintenanceLog()
        }

        binding.btnLogoutDriver.setOnClickListener {
            performLogout()
        }

        // Fetch user metadata to cache registered NFC tag ID
        fetchDriverMetadata()

        // Fetch today's current attendance state from Firebase
        checkTodayAttendanceState()
    }

    private fun fetchDriverMetadata() {
        db.collection("users").document(currentUid)
            .get()
            .addOnSuccessListener { doc ->
                if (doc != null && doc.exists()) {
                    driverNfcId = doc.getString("nfc_tag_id")
                    if (driverNfcId.isNullOrEmpty()) {
                        binding.tvNfcHud.text = "⚠️ NO NFC CARD ASSOCIATED - DISPATCH ADMIN"
                        binding.tvNfcHud.setTextColor(getColor(R.color.danger))
                    }
                }
            }
    }

    private fun checkTodayAttendanceState() {
        val todayDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        
        db.collection("attendance")
            .whereEqualTo("uid", currentUid)
            .whereEqualTo("date", todayDateStr)
            .get()
            .addOnSuccessListener { query ->
                if (!query.isEmpty) {
                    val doc = query.documents[0]
                    todayLogId = doc.id
                    todayCheckInTime = doc.getString("checkIn")
                    val todayCheckOutTime = doc.getString("checkOut")

                    if (!todayCheckInTime.isNullOrEmpty() && todayCheckOutTime.isNullOrEmpty()) {
                        // Driver is currently Checked In
                        setCheckInState(todayCheckInTime!!)
                    } else if (!todayCheckInTime.isNullOrEmpty() && !todayCheckOutTime.isNullOrEmpty()) {
                        // Both exist - completed shift for today
                        setCompletedShiftState(todayCheckInTime!!, todayCheckOutTime)
                    }
                } else {
                    setCheckOutState()
                }
            }
    }

    private fun setCheckInState(checkInTime: String) {
        isCheckedIn = true
        binding.vStatus_dot.setBackgroundResource(R.drawable.circle_green) // Need standard drawable or dynamic manipulation
        binding.tvAttendance_status.text = "STATUS: ACTIVE DUTY (CHECKED IN)"
        binding.tvAttendance_status.setTextColor(getColor(R.color.success))
        binding.tvPunchInLabel.text = "PUNCH-IN TIME: $checkInTime"
        binding.tvPunchOutLabel.text = "PUNCH-OUT TIME: -- : --"
    }

    private fun setCheckOutState() {
        isCheckedIn = false
        binding.vStatus_dot.setBackgroundResource(R.drawable.circle_red)
        binding.tvAttendance_status.text = "STATUS: VACANT (NOT PUNCHED IN)"
        binding.tvAttendance_status.setTextColor(getColor(R.color.text_secondary))
        binding.tvPunchInLabel.text = "PUNCH-IN TIME: -- : --"
        binding.tvPunchOutLabel.text = "PUNCH-OUT TIME: -- : --"
    }

    private fun setCompletedShiftState(inTime: String, outTime: String) {
        isCheckedIn = false
        binding.vStatus_dot.setBackgroundResource(R.drawable.circle_red)
        binding.tvAttendance_status.text = "STATUS: SHIFT CONCLUDED TODAY"
        binding.tvAttendance_status.setTextColor(getColor(R.color.text_secondary))
        binding.tvPunchInLabel.text = "PUNCH-IN TIME: $inTime"
        binding.tvPunchOutLabel.text = "PUNCH-OUT TIME: $outTime"
        
        // Disable NFC HUD as shift is already concluded for safety
        binding.tvNfcHud.text = "SHIFT CONCLUDED"
    }

    override fun onResume() {
        super.onResume()
        nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val action = intent.action
        if (NfcAdapter.ACTION_TAG_DISCOVERED == action || 
            NfcAdapter.ACTION_TECH_DISCOVERED == action) {
            
            val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
            val scannedUid = NfcUtils.getTagUid(tag)

            if (scannedUid == null) {
                Toast.makeText(this, "⚠️ Tag reading error. Try again.", Toast.LENGTH_SHORT).show()
                return
            }

            verifyNfcTagPulse(scannedUid)
        }
    }

    private fun verifyNfcTagPulse(scannedUid: String) {
        if (driverNfcId == null) {
            Toast.makeText(this, "⚠️ Loading driver information. Please wait.", Toast.LENGTH_SHORT).show()
            return
        }

        if (driverNfcId != scannedUid) {
            Toast.makeText(this, "❌ NFC Card does not match this driver session!", Toast.LENGTH_LONG).show()
            return
        }

        // Tag verified! Perform Shift Punch-In/Out
        val now = Date()
        val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val currentTimeStr = timeFormatter.format(now)
        val currentDateStr = dateFormatter.format(now)

        if (!isCheckedIn) {
            // Scenario A: Punch In
            val entryId = "nfc-${currentUid}-${currentDateStr}"
            val attendanceRecord = hashMapOf(
                "logId" to entryId,
                "uid" to currentUid,
                "date" to currentDateStr,
                "checkIn" to currentTimeStr,
                "checkOut" to null,
                "punchMethod" to "NFC",
                "timestamp" to FieldValue.serverTimestamp() // Tamper-proof
            )

            db.collection("attendance").document(entryId)
                .set(attendanceRecord)
                .addOnSuccessListener {
                    Toast.makeText(this, "✅ Punch-In Registered successfully!", Toast.LENGTH_LONG).show()
                    setCheckInState(currentTimeStr)
                    todayLogId = entryId
                    todayCheckInTime = currentTimeStr
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Punch Failed: ${e.message}", Toast.LENGTH_LONG).show()
                }

        } else {
            // Scenario B: Punch Out
            val logIdToUpdate = todayLogId ?: "nfc-${currentUid}-${currentDateStr}"
            
            // Calculate Total shift Hours
            var totalHours = 0.0
            if (todayCheckInTime != null) {
                try {
                    val inDate = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).parse(todayCheckInTime!!)
                    val outDate = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).parse(currentTimeStr)
                    if (inDate != null && outDate != null) {
                        val diff = outDate.time - inDate.time
                        totalHours = (diff.toDouble() / (1000 * 60 * 60))
                    }
                } catch (e: Exception) {
                    totalHours = 8.0 // default fallback
                }
            }

            val regularHours = Math.min(totalHours, 8.0)
            val otHours = Math.max(0.0, totalHours - 8.0)

            db.collection("attendance").document(logIdToUpdate)
                .update(
                    mapOf(
                        "checkOut" to currentTimeStr,
                        "totalHours" to totalHours,
                        "regularHours" to regularHours,
                        "otHours" to otHours,
                        "outTimestamp" to FieldValue.serverTimestamp()
                    )
                )
                .addOnSuccessListener {
                    Toast.makeText(this, "🏁 Punch-Out Logged. Shift Completed!", Toast.LENGTH_LONG).show()
                    setCompletedShiftState(todayCheckInTime ?: "", currentTimeStr)
                    
                    // Safely close session on second stamp
                    binding.root.postDelayed({
                        performLogout()
                    }, 2500)
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Punch Out Failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
        }
    }

    private fun submitMaintenanceLog() {
        val category = binding.spnCategory.selectedItem.toString()
        val odoStr = binding.etMaintOdo.text.toString().trim()
        val costStr = binding.etMaintCost.text.toString().trim()
        val partCodes = binding.etPartCodes.text.toString().trim()

        if (odoStr.isEmpty() || costStr.isEmpty()) {
            Toast.makeText(this, "Please satisfy current Odometer and Cost.", Toast.LENGTH_SHORT).show()
            return
        }

        val odo = odoStr.toInt()
        val cost = costStr.toDouble()

        binding.btnSaveMaint.isEnabled = false
        binding.btnSaveMaint.text = "WRITING SERVICE LOG..."

        val logId = "maint_${System.currentTimeMillis()}"
        val maintPayload = hashMapOf(
            "logId" to logId,
            "driverId" to currentUid,
            "driverName" to currentName,
            "vehicle" to "Toyota Fortuner Fleet",
            "category" to category,
            "odometer" to odo,
            "cost" to cost,
            "partCodes" to partCodes,
            "timestamp" to FieldValue.serverTimestamp()
        )

        db.collection("maintenance").document(logId)
            .set(maintPayload)
            .addOnSuccessListener {
                Toast.makeText(this, "🔧 Maintenance Log registered seamlessly!", Toast.LENGTH_LONG).show()
                binding.etMaintOdo.text.clear()
                binding.etMaintCost.text.clear()
                binding.etPartCodes.text.clear()
                binding.btnSaveMaint.isEnabled = true
                binding.btnSaveMaint.text = "SUBMIT SERVICE LOG"
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Submission Error: ${e.message}", Toast.LENGTH_LONG).show()
                binding.btnSaveMaint.isEnabled = true
                binding.btnSaveMaint.text = "SUBMIT SERVICE LOG"
            }
    }

    private fun performLogout() {
        Toast.makeText(this, "Session closed.", Toast.LENGTH_SHORT).show()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
