package com.logistics.fleethub.models

data class DailyAttendance(
    val date: String = "",
    val startOdometer: Int = 0,
    val endOdometer: Int = 0,
    val startTime: String = "",
    val endTime: String = "",
    val totalDurationMinutes: Int = 0
)

data class FuelLog(
    val date: String = "",
    val fuelOdometer: Int = 0,
    val liters: Double = 0.0,
    val amount: Double = 0.0,
    val isAdditional: Boolean = false,
    val driverId: String = "",
    val timestamp: Long = 0
)

data class ServiceLog(
    val date: String = "",
    val serviceOdometer: Int = 0,
    val serviceDetails: String = ""
)

data class DriverProfile(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "driver",
    val fileNumber: String = "",
    val nfcTagId: String = "",
    val fuelBudget: Double = 0.0,
    val additionalExpenses: Double = 0.0
)

data class FuelEntry(
    val amountSpent: Double = 0.0,
    val isAdditionalAmount: Boolean = false, // Checkbox state from UI
    val date: String = ""
)

data class FuelBudget(
    val allocatedBudget: Double = 80.0, // Admin set amount (e.g., 80 KD)
    val remainingBudget: Double = 80.0,
    val totalAdditionalSpent: Double = 0.0
)

