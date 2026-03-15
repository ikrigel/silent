package com.ikrigel.silent

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Persists robot recordings in Android SharedPreferences as JSON.
 * Built-in recordings are never stored here — they come from BuiltInRecordings.ALL.
 */
object WEARobotStorage {
    private const val PREFS = "WEARobotRecordings"
    private const val KEY   = "recordings"

    /** Load all user-created recordings from SharedPreferences */
    fun getRecordings(context: Context): List<RobotRecording> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val json  = prefs.getString(KEY, "[]") ?: "[]"
        return parseRecordings(json)
    }

    /** Persist a new or updated recording */
    fun saveRecording(context: Context, recording: RobotRecording) {
        val all = getRecordings(context).toMutableList()
        val idx = all.indexOfFirst { it.id == recording.id }
        if (idx >= 0) all[idx] = recording else all.add(recording)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY, serializeRecordings(all)).apply()
    }

    /** Delete a user recording by ID (built-ins are ignored) */
    fun deleteRecording(context: Context, id: String) {
        val all = getRecordings(context).filter { it.id != id }
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY, serializeRecordings(all)).apply()
    }

    /** Find a recording by ID, checking built-ins first then user recordings */
    fun findRecording(context: Context, id: String): RobotRecording? =
        BuiltInRecordings.ALL.firstOrNull { it.id == id }
            ?: getRecordings(context).firstOrNull { it.id == id }

    // ── Serialization helpers ────────────────────────────────────────────────

    private fun serializeStep(step: RobotStep) = JSONObject().apply {
        put("action", step.action)
        put("text",   step.text)
        put("desc",   step.description)
    }

    private fun serializeRecordings(list: List<RobotRecording>): String {
        val arr = JSONArray()
        list.forEach { rec ->
            val steps = JSONArray()
            rec.steps.forEach { steps.put(serializeStep(it)) }
            arr.put(JSONObject().apply {
                put("id",        rec.id)
                put("name",      rec.name)
                put("createdAt", rec.createdAt)
                put("steps",     steps)
            })
        }
        return arr.toString()
    }

    private fun parseStep(obj: JSONObject) = RobotStep(
        action      = obj.getString("action"),
        text        = obj.getString("text"),
        description = obj.optString("desc", ""),
    )

    private fun parseRecordings(json: String): List<RobotRecording> {
        val arr  = JSONArray(json)
        val list = mutableListOf<RobotRecording>()
        for (i in 0 until arr.length()) {
            val obj   = arr.getJSONObject(i)
            val steps = obj.getJSONArray("steps")
            list.add(RobotRecording(
                id        = obj.getString("id"),
                name      = obj.getString("name"),
                createdAt = obj.getString("createdAt"),
                isBuiltIn = false,
                steps     = (0 until steps.length()).map { parseStep(steps.getJSONObject(it)) },
            ))
        }
        return list
    }
}
