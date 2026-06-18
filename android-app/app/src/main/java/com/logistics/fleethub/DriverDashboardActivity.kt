package com.logistics.fleethub

import android.app.PendingIntent
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.databinding.ActivityDriverDashboardBinding
import com.logistics.fleethub.utils.NfcUtils
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DriverDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDriverDashboardBinding
    private val db = FirebaseFirestore.getInstance()
    private val fuelBudgetRepo = com.logistics.fleethub.repository.FuelBudgetRepository()

    // Multi-Company Tenant ID
    private lateinit var currentCompanyId: String
    private lateinit var currentUid: String
    private lateinit var currentName: String
    private lateinit var currentEmail: String

    // NFC variables
    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private var driverNfcId: String? = null
    private var todayLogId: String? = null
    private var todayCheckInTime: String? = null
    private var isCheckedIn = false

    // Daily attendance dashboard metrics widgets
    private lateinit var textStartOdometer: TextView
    private lateinit var textEndOdometer: TextView
    private lateinit var textDuration: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Setup view bindings
        binding = ActivityDriverDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Parse user login session details
        val prefs = getSharedPreferences("FleetHubPrefs", MODE_PRIVATE)
        currentUid = intent.getStringExtra("uid") ?: prefs.getString("uid", "") ?: "drv_unknown"
        currentCompanyId = intent.getStringExtra("companyId") ?: prefs.getString("companyId", "") ?: "COM_DEFAULT"
        currentName = intent.getStringExtra("name") ?: prefs.getString("name", "") ?: "Active Driver"
        currentEmail = intent.getStringExtra("email") ?: prefs.getString("email", "") ?: ""

        // Welcome widgets mapping
        binding.tvWelcomeDriver.text = currentName
        binding.tvDriverEmail.text = currentEmail

        // Initialize dashboard text metrics widgets
        textStartOdometer = binding.tvStartOdometer
        textEndOdometer = binding.tvEndOdometer
        textDuration = binding.tvDuration

        // Load today's system reports
        val todayDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        loadDashboardData(todayDateStr)

        // Initialize NFC Adapter
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        val launchIntent = Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags)

        if (nfcAdapter == null) {
            binding.tvNfcHud.text = "⚠️ DEV NFC HARDWARE MISSING"
            binding.tvNfcHud.setTextColor(getColor(R.color.danger))
        }

        // Setup Spinners dropdown
        val categories = arrayOf("ENGINE OIL SERVICE", "BRAKE INSPECTION", "TYRE REPLACEMENT", "FUEL REFILL LOG")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, categories)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spnCategory.adapter = adapter

        // Submit maintenance log
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

        // Fetch today's fuel budget metrics
        refreshBudgetMetrics()
    }

    private fun refreshBudgetMetrics() {
        fuelBudgetRepo.fetchFuelBudgetStats(
            companyId = currentCompanyId,
            driverId = currentUid,
            onSuccess = { stats ->
                binding.tvAllocatedBudget.text = "Allocated Budget: ${String.format(Locale.US, "%.3f", stats.totalAllocated)} KD"
                binding.tvRemainingBudget.text = "Remaining Budget: ${String.format(Locale.US, "%.3f", stats.remainingBudget)} KD"
                binding.tvAdditionalSpent.text = "Additional Spent: ${String.format(Locale.US, "%.3f", stats.additionalSpent)} KD"
            },
            onFailure = { e ->
                binding.tvAllocatedBudget.text = "Allocated Budget: -- KD"
                binding.tvRemainingBudget.text = "Remaining Budget: -- KD"
                binding.tvAdditionalSpent.text = "Additional Spent: -- KD"
                Toast.makeText(this, "Failed to load budget report: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        )
    }

    private fun fetchDriverMetadata() {
        db.collection("Companies").document(currentCompanyId)
            .collection("users").document(currentUid)
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
        val documentId = "${todayDateStr}_${currentUid}"

        db.collection("Companies").document(currentCompanyId)
            .collection("Daily_Attendance")
            .document(documentId)
            .get()
            .addOnSuccessListener { doc ->
                if (doc != null && doc.exists()) {
                    todayLogId = doc.id
                    todayCheckInTime = doc.getString("checkIn") ?: doc.getString("startTime")
                    val todayCheckOutTime = doc.getString("checkOut") ?: doc.getString("endTime")

                    if (!todayCheckInTime.isNullOrEmpty() && todayCheckOutTime.isNullOrEmpty()) {
                        setCheckInState(todayCheckInTime!!)
                    } else if (!todayCheckInTime.isNullOrEmpty() && !todayCheckOutTime.isNullOrEmpty()) {
                        setCompletedShiftState(todayCheckInTime!!, todayCheckOutTime)
                    }
                } else {
                    setCheckOutState()
                }
            }
    }

    private fun setCheckInState(checkInTime: String) {
        isCheckedIn = true
        binding.vStatus_dot.setBackgroundResource(R.drawable.circle_green)
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

        val now = Date()
        val timeFormatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val currentTimeStr = timeFormatter.format(now)
        val currentDateStr = dateFormatter.format(now)

        val documentId = "${currentDateStr}_${currentUid}"

        if (!isCheckedIn) {
            // Punch In Log Record
            val attendanceRecord = hashMapOf(
                "date" to currentDateStr,
                "uid" to currentUid,
                "startOdometer" to 120500, // Custom localized initial metrics
                "endOdometer" to 0,
                "startTime" to currentTimeStr,
                "endTime" to "",
                "totalDurationMinutes" to 0,
                "checkIn" to currentTimeStr,
                "checkOut" to null,
                "punchMethod" to "NFC",
                "timestamp" to FieldValue.serverTimestamp()
            )

            db.collection("Companies").document(currentCompanyId)
                .collection("Daily_Attendance").document(documentId)
                .set(attendanceRecord)
                .addOnSuccessListener {
                    Toast.makeText(this, "✅ Punch-In Registered successfully inside company tenant!", Toast.LENGTH_LONG).show()
                    setCheckInState(currentTimeStr)
                    todayLogId = documentId
                    todayCheckInTime = currentTimeStr

                    // Refresh Dashboard statistics
                    loadDashboardData(currentDateStr)
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Punch Failed: ${e.message}", Toast.LENGTH_LONG).show()
                }

        } else {
            // Punch Out Log Record
            val logIdToUpdate = todayLogId ?: documentId
            
            var totalHours = 0.0
            var totalMinutes = 0
            if (todayCheckInTime != null) {
                try {
                    val inDate = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).parse(todayCheckInTime!!)
                    val outDate = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).parse(currentTimeStr)
                    if (inDate != null && outDate != null) {
                        val diff = outDate.time - inDate.time
                        totalHours = (diff.toDouble() / (1000 * 60 * 60))
                        totalMinutes = (diff / (1000 * 60)).toInt()
                    }
                } catch (e: Exception) {
                    totalHours = 8.0
                    totalMinutes = 480
                }
            }

            val regularHours = Math.min(totalHours, 8.0)
            val otHours = Math.max(0.0, totalHours - 8.0)

            db.collection("Companies").document(currentCompanyId)
                .collection("Daily_Attendance").document(logIdToUpdate)
                .update(
                    mapOf(
                        "endTime" to currentTimeStr,
                        "checkOut" to currentTimeStr,
                        "endOdometer" to 120680, // Simulation odometer progression
                        "totalDurationMinutes" to totalMinutes,
                        "totalHours" to totalHours,
                        "regularHours" to regularHours,
                        "otHours" to otHours,
                        "outTimestamp" to FieldValue.serverTimestamp()
                    )
                )
                .addOnSuccessListener {
                    Toast.makeText(this, "🏁 Punch-Out Logged. Shift Completed!", Toast.LENGTH_LONG).show()
                    setCompletedShiftState(todayCheckInTime ?: "", currentTimeStr)
                    
                    // Refresh Dashboard statistics
                    loadDashboardData(currentDateStr)

                    // Safely clear session on second stamp
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

        val logId = "log_${System.currentTimeMillis()}"
        val nowPattern = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        if (category.contains("FUEL")) {
            // FUEL LOG COLLECTION PATH
            val isAdditional = binding.cbAdditionalAmount.isChecked
            val fuelLogObj = com.logistics.fleethub.models.FuelLog(
                date = nowPattern,
                fuelOdometer = odo,
                liters = cost / 0.50,
                amount = cost,
                isAdditional = isAdditional,
                driverId = currentUid,
                timestamp = System.currentTimeMillis()
            )

            fuelBudgetRepo.saveFuelLog(
                companyId = currentCompanyId,
                driverId = currentUid,
                fuelLog = fuelLogObj,
                onSuccess = {
                    Toast.makeText(this, "⛽ Fuel Log registered seamlessly inside tenant node!", Toast.LENGTH_LONG).show()
                    clearMaintenanceForm()
                    refreshBudgetMetrics()
                },
                onFailure = { e ->
                    Toast.makeText(this, "Fuel Log Submission Error: ${e.message}", Toast.LENGTH_LONG).show()
                    resetMaintenanceButton()
                }
            )
        } else {
            // MAINTENANCE SERVICE LOG COLLECTION PATH
            val servicePayload = hashMapOf(
                "date" to nowPattern,
                "serviceOdometer" to odo,
                "serviceDetails" to "$category: $partCodes",
                "cost" to cost,
                "driverId" to currentUid,
                "driverName" to currentName,
                "timestamp" to FieldValue.serverTimestamp()
            )

            db.collection("Companies").document(currentCompanyId)
                .collection("Service_Log").document(logId)
                .set(servicePayload)
                .addOnSuccessListener {
                    Toast.makeText(this, "🔧 Service Log registered seamlessly inside tenant node!", Toast.LENGTH_LONG).show()
                    clearMaintenanceForm()
                }
                .addOnFailureListener { e ->
                    Toast.makeText(this, "Service Log Submission Error: ${e.message}", Toast.LENGTH_LONG).show()
                    resetMaintenanceButton()
                }
        }
    }

    private fun clearMaintenanceForm() {
        binding.etMaintOdo.text.clear()
        binding.etMaintCost.text.clear()
        binding.etPartCodes.text.clear()
        resetMaintenanceButton()
    }

    private fun resetMaintenanceButton() {
        binding.btnSaveMaint.isEnabled = true
        binding.btnSaveMaint.text = "SUBMIT SERVICE LOG"
    }

    private fun performLogout() {
        val prefs = getSharedPreferences("FleetHubPrefs", MODE_PRIVATE)
        prefs.edit().clear().apply()

        Toast.makeText(this, "Session closed.", Toast.LENGTH_SHORT).show()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    // Fetching only Attendance data for Dashboard to calculate duration and true kilometers
    fun loadDashboardData(todayDate: String) {
        val documentId = "${todayDate}_${currentUid}"

        db.collection("Companies").document(currentCompanyId)
            .collection("Daily_Attendance")
            .document(documentId)
            .get()
            .addOnSuccessListener { document ->
                if (document != null && document.exists()) {
                    val startOdo = document.getLong("startOdometer") ?: 0
                    val endOdo = document.getLong("endOdometer") ?: 0
                    val startTime = document.getString("startTime") ?: ""
                    val endTime = document.getString("endTime") ?: ""
                    
                    // Displays pure start and close metrics. Fuel/Service readings won't interfere here.
                    textStartOdometer.text = "Start: $startOdo km"
                    textEndOdometer.text = "End: $endOdo km"
                    textDuration.text = "Duration: $startTime - $endTime"
                } else {
                    textStartOdometer.text = "Start: -- km"
                    textEndOdometer.text = "End: -- km"
                    textDuration.text = "Duration: -- "
                }
            }
            .addOnFailureListener {
                textStartOdometer.text = "Start: -- km"
                textEndOdometer.text = "End: -- km"
                textDuration.text = "Duration: -- "
            }
    }
}
