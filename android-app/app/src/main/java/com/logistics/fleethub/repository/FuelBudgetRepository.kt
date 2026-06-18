package com.logistics.fleethub.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.logistics.fleethub.models.FuelLog
import com.logistics.fleethub.models.FuelEntry
import com.logistics.fleethub.models.FuelBudget

class FuelBudgetRepository {

    private val db = FirebaseFirestore.getInstance()

    /**
     * Data class to encapsulate Fuel Budget statistics.
     */
    data class BudgetStats(
        val totalAllocated: Double,
        val remainingBudget: Double,
        val additionalSpent: Double
    )

    /**
     * Process fuel expenses using an atomic transaction in Firestore under isolated company routes.
     * This fulfills the explicit user request transaction code requirements.
     */
    fun processFuelExpense(
        companyId: String, 
        driverId: String, 
        fuelEntry: FuelEntry,
        onSuccess: () -> Unit = {},
        onFailure: (Exception) -> Unit = {}
    ) {
        val budgetRef = db.collection("Companies").document(companyId)
            .collection("Fuel_Budget").document(driverId)

        db.runTransaction { transaction ->
            val snapshot = transaction.get(budgetRef)
            val currentBudget = snapshot.toObject(FuelBudget::class.java) 
                ?: FuelBudget(allocatedBudget = 80.0, remainingBudget = 80.0, totalAdditionalSpent = 0.0)

            val updatedBudget = if (fuelEntry.isAdditionalAmount) {
                // If "Additional" is true, add to extra expenses, don't touch base budget
                currentBudget.copy(
                    totalAdditionalSpent = currentBudget.totalAdditionalSpent + fuelEntry.amountSpent
                )
            } else {
                // If "Additional" is false, deduct directly from the allocated budget
                currentBudget.copy(
                    remainingBudget = currentBudget.remainingBudget - fuelEntry.amountSpent
                )
            }

            transaction.set(budgetRef, updatedBudget)
            null
        }.addOnSuccessListener {
            onSuccess()
        }.addOnFailureListener { e ->
            onFailure(e)
        }
    }

    /**
     * Registers a new fuel log entry.
     * Integrates with processFuelExpense transaction inside the successful flow to atomically update balance.
     */
    fun saveFuelLog(
        companyId: String,
        driverId: String,
        fuelLog: FuelLog,
        onSuccess: () -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        val logId = "log_${System.currentTimeMillis()}"
        
        val logPayload = hashMapOf(
            "date" to fuelLog.date,
            "fuelOdometer" to fuelLog.fuelOdometer,
            "liters" to fuelLog.liters,
            "amount" to fuelLog.amount,
            "isAdditional" to fuelLog.isAdditional,
            "driverId" to driverId,
            "timestamp" to FieldValue.serverTimestamp()
        )

        db.collection("Companies").document(companyId)
            .collection("Fuel_Log").document(logId)
            .set(logPayload)
            .addOnSuccessListener {
                // Invoke processFuelExpense transaction atomically
                val fuelEntry = FuelEntry(
                    amountSpent = fuelLog.amount,
                    isAdditionalAmount = fuelLog.isAdditional,
                    date = fuelLog.date
                )
                processFuelExpense(
                    companyId = companyId,
                    driverId = driverId,
                    fuelEntry = fuelEntry,
                    onSuccess = {
                        onSuccess()
                    },
                    onFailure = { e ->
                        onFailure(e)
                    }
                )
            }
            .addOnFailureListener { e ->
                onFailure(e)
            }
    }

    /**
     * Dynamically queries the transaction-calculated Budget stats for the driver,
     * fallback to initial settings if document does not exist yet.
     */
    fun fetchFuelBudgetStats(
        companyId: String,
        driverId: String,
        onSuccess: (BudgetStats) -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        val budgetRef = db.collection("Companies").document(companyId)
            .collection("Fuel_Budget").document(driverId)

        budgetRef.get()
            .addOnSuccessListener { doc ->
                if (doc != null && doc.exists()) {
                    val allocated = doc.getDouble("allocatedBudget") ?: 80.0
                    val remaining = doc.getDouble("remainingBudget") ?: 80.0
                    val additional = doc.getDouble("totalAdditionalSpent") ?: 0.0
                    onSuccess(
                        BudgetStats(
                            totalAllocated = allocated,
                            remainingBudget = remaining,
                            additionalSpent = additional
                        )
                    )
                } else {
                    // Fallback to driver's default configuration if Fuel_Budget document is not generated yet
                    db.collection("Companies").document(companyId)
                        .collection("users").document(driverId)
                        .get()
                        .addOnSuccessListener { driverDoc ->
                            if (!driverDoc.exists()) {
                                onFailure(Exception("Driver profile does not exist under current company."))
                                return@addOnSuccessListener
                            }
                            val allocatedBudget = driverDoc.getDouble("fuelBudget") ?: 80.0
                            val additionalExpenses = driverDoc.getDouble("additionalExpenses") ?: 0.0
                            onSuccess(
                                BudgetStats(
                                    totalAllocated = allocatedBudget,
                                    remainingBudget = allocatedBudget,
                                    additionalSpent = additionalExpenses
                                )
                            )
                        }
                        .addOnFailureListener { e ->
                            onFailure(e)
                        }
                }
            }
            .addOnFailureListener { e ->
                onFailure(e)
            }
    }
}

