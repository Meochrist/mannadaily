package com.mannadaily.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class MannaWidgetProvider : AppWidgetProvider() {
    companion object {
        private const val TAG = "MannaWidget"
        private const val WIDGET_URL = "https://mannadaily.vercel.app/api/widget-data"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val layoutId = R.layout.widget_manna
        val views = RemoteViews(context.packageName, layoutId)

        // Données par défaut
        views.setTextViewText(R.id.widgetStreak, "🔥 0 jours")
        views.setImageViewResource(R.id.widgetMannyIcon, R.drawable.mascotte_neutral)
        views.setTextViewText(R.id.widgetMessage, "Ouvre l'app pour synchroniser.")
        views.setTextViewText(R.id.widgetVerse, "")
        views.setInt(R.id.widgetContainer, "setBackgroundColor", Color.parseColor("#4F46E5"))

        // Intent pour ouvrir l'app
        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.setPackage(context.packageName)
        var flags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = flags or PendingIntent.FLAG_IMMUTABLE
        }
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, flags)
        views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
        fetchData(context, appWidgetManager, appWidgetId)
    }

    private fun fetchData(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        Thread {
            val views = RemoteViews(context.packageName, R.layout.widget_manna)
            try {
                val url = URL(WIDGET_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                connection.doInput = true

                if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                    val response = readStream(connection.inputStream)
                    val json = JSONObject(response)

                    val streak = json.optJSONObject("streak")
                    val currentStreak = streak?.optInt("currentStreak", 0) ?: 0
                    val mood = json.optString("mood", "neutral")
                    val message = json.optString("message", "")
                    val verse = json.optString("verse", "")

                    val bgColor = when (mood) {
                        "happy", "excited" -> Color.parseColor("#F59E0B")
                        "encouraging", "thinking" -> Color.parseColor("#3B82F6")
                        "celebrating" -> Color.parseColor("#10B981")
                        "sad", "disappointed" -> Color.parseColor("#6B7280")
                        "crying", "scared" -> Color.parseColor("#EF4444")
                        "panicked" -> Color.parseColor("#DC2626")
                        "angry" -> Color.parseColor("#B91C1C")
                        "worried" -> Color.parseColor("#F97316")
                        else -> Color.parseColor("#4F46E5")
                    }

                    val mannyDrawable = when (mood) {
                        "happy" -> R.drawable.mascotte_happy
                        "excited" -> R.drawable.mascotte_excited
                        "celebrating" -> R.drawable.mascotte_celebrating
                        "encouraging" -> R.drawable.mascotte_encouraging
                        "thinking" -> R.drawable.mascotte_thinking
                        "praying" -> R.drawable.mascotte_praying
                        "worried" -> R.drawable.mascotte_worried
                        "sad" -> R.drawable.mascotte_sad
                        "disappointed" -> R.drawable.mascotte_disappointed
                        "crying" -> R.drawable.mascotte_crying
                        "scared" -> R.drawable.mascotte_scared
                        "panicked" -> R.drawable.mascotte_panicked
                        "angry" -> R.drawable.mascotte_angry
                        "sleeping" -> R.drawable.mascotte_sleeping
                        else -> R.drawable.mascotte_neutral
                    }

                    views.setTextViewText(R.id.widgetStreak, "🔥 $currentStreak jours")
                    views.setImageViewResource(R.id.widgetMannyIcon, mannyDrawable)
                    views.setTextViewText(R.id.widgetMessage, message)
                    views.setTextViewText(R.id.widgetVerse, if (verse.length > 80) verse.substring(0, 80) + "..." else verse)
                    views.setInt(R.id.widgetContainer, "setBackgroundColor", bgColor)

                    val btnColor = if (mood == "panicked" || mood == "angry" || mood == "scared") {
                        Color.parseColor("#DC2626")
                    } else {
                        Color.parseColor("#FFFFFF")
                    }
                    views.setInt(R.id.widgetMeditateButton, "setBackgroundColor", btnColor)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Fetch error", e)
                views.setTextViewText(R.id.widgetStreak, "Erreur réseau")
                views.setImageViewResource(R.id.widgetMannyIcon, R.drawable.mascotte_worried)
                views.setTextViewText(R.id.widgetMessage, "Vérifie ta connexion.")
            }

            val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.setPackage(context.packageName)
            var flags = PendingIntent.FLAG_UPDATE_CURRENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags = flags or PendingIntent.FLAG_IMMUTABLE
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, flags)
            views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }.start()
    }

    private fun readStream(inputStream: InputStream): String {
        val reader = BufferedReader(InputStreamReader(inputStream, "UTF-8"))
        val builder = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            builder.append(line)
        }
        reader.close()
        return builder.toString()
    }
}
