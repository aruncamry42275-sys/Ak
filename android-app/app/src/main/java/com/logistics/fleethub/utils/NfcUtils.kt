package com.logistics.fleethub.utils

import android.nfc.Tag

object NfcUtils {
    /**
     * Converts raw bytes from NfcAdapter card scanner to standard upper-case hex format.
     */
    fun toHexString(bytes: ByteArray): String {
        val sb = StringBuilder()
        for (i in bytes.indices) {
            val hex = Integer.toHexString(0xFF and bytes[i].toInt())
            if (hex.length == 1) {
                sb.append('0')
            }
            sb.append(hex)
            if (i < bytes.size - 1) {
                sb.append(":")
            }
        }
        return sb.toString().uppercase()
    }

    /**
     * Parses the scanned raw NFC Tag and returns its Unique Identifier (UID) string.
     */
    fun getTagUid(tag: Tag?): String? {
        if (tag == null) return null
        val idBytes = tag.id
        return toHexString(idBytes)
    }
}
