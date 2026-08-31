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
        // Déterminer le layout selon la taille du widget
        val appWidgetOptions = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val minWidth = appWidgetOptions.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
        val minHeight = appWidgetOptions.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)

        // Petit format (2x1) si hauteur < 100dp, sinon grand format
        val isSmallFormat = minHeight < 100
        val layoutId = if (isSmallFormat) R.layout.widget_manna_small else R.layout.widget_manna

        val views = RemoteViews(context.packageName, layoutId)

        // Données par défaut
        if (isSmallFormat) {
            views.setTextViewText(R.id.widgetSmallStreak, "🔥 0 jours")
            views.setTextViewText(R.id.widgetSmallMessage, "Ouvre l'app pour synchroniser.")
            views.setTextViewText(R.id.widgetSmallMood, "😐")
        } else {
            views.setTextViewText(R.id.widgetStreak, "Jours 🔥 --")
            views.setTextViewText(R.id.widgetMannyMood, "😐")
            views.setTextViewText(R.id.widgetMessage, "Ouvre l'app pour synchroniser.")
            views.setTextViewText(R.id.widgetVerse, "")
            views.setInt(R.id.widgetContainer, "setBackgroundColor", Color.parseColor("#4F46E5"))
        }

        // Intent pour ouvrir l'app
        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.setPackage(context.packageName)
        var flags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = flags or PendingIntent.FLAG_IMMUTABLE
        }
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, flags)

        if (isSmallFormat) {
            views.setOnClickPendingIntent(R.id.widgetSmallContainer, pendingIntent)
        } else {
            views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
        fetchData(context, appWidgetManager, appWidgetId, isSmallFormat)
    }

    private fun fetchData(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, isSmallFormat: Boolean) {
        Thread {
            val layoutId = if (isSmallFormat) R.layout.widget_manna_small else R.layout.widget_manna
            val views = RemoteViews(context.packageName, layoutId)
            try {
                val url = URL(WIDGET_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                connection.doInput = true

                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = readStream(connection.inputStream)
                    val json = JSONObject(response)

                    val streak = json.optJSONObject("streak")
                    val currentStreak = streak?.optInt("currentStreak", 0) ?: 0
                    val mood = json.optString("mood", "neutral")
                    val message = json.optString("message", "")

                    // Couleur selon humeur
                    val bgColor = when (mood) {
                        "happy", "excited" -> Color.parseColor("#F59E0B")
                        "encouraging", "thinking" -> Color.parseColor("#3B82F6")
                        "celebrating" -> Color.parseColor("#10B981")
                        "sad", "disappointed" -> Color.parseColor("#6B7280")
                        "crying", "scared" -> Color.parseColor("#EF4444")
                        "panicked" -> Color.parseColor("#DC2626")
                        "angry" -> Color.parseColor("#B91C1C")
                        else -> Color.parseColor("#4F46E5")
                    }

                    // Emoji selon humeur
                    val emoji = when (mood) {
                        "happy" -> "😊"
                        "excited" -> "🎉"
                        "encouraging" -> "💪"
                        "thinking" -> "🤔"
                        "celebrating" -> "🏆"
                        "sad" -> "😢"
                        "crying" -> "😭"
                        "scared" -> "😨"
                        "panicked" -> "😱"
                        "angry" -> "😤"
                        "disappointed" -> "😞"
                        "praying" -> "🙏"
                        else -> "😐"
                    }

                    if (isSmallFormat) {
                        views.setTextViewText(R.id.widgetSmallStreak, "🔥 $currentStreak jours")
                        views.setTextViewText(R.id.widgetSmallMessage, message)
                        views.setTextViewText(R.id.widgetSmallMood, emoji)
                    } else {
                        val sessionsCompleted = json.optInt("sessionsCompleted", 0)
                        val verse = json.optString("verse", "")

                        views.setTextViewText(R.id.widgetStreak, "🔥 $currentStreak jours")
                        views.setTextViewText(R.id.widgetMannyMood, emoji)
                        views.setTextViewText(R.id.widgetMessage, message)
                        views.setTextViewText(R.id.widgetVerse, if (verse.length > 80) verse.substring(0, 80) + "..." else verse)
                        views.setInt(R.id.widgetContainer, "setBackgroundColor", bgColor)

                        // Bouton rouge si urgence
                        val btnColor = if (mood == "panicked" || mood == "angry" || mood == "scared") {
                            Color.parseColor("#DC2626")
                        } else {
                            Color.parseColor("#FFFFFF")
                        }
                        views.setInt(R.id.widgetMeditateButton, "setBackgroundColor", btnColor)
                    }
                } else if (responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
                    if (isSmallFormat) {
                        views.setTextViewText(R.id.widgetSmallStreak, "Connecte-toi")
                        views.setTextViewText(R.id.widgetSmallMessage, "Ouvre l'app.")
                        views.setTextViewText(R.id.widgetSmallMood, "🙁")
                    } else {
                        views.setTextViewText(R.id.widgetStreak, "Connecte-toi")
                        views.setTextViewText(R.id.widgetMannyMood, "🙁")
                        views.setTextViewText(R.id.widgetMessage, "Ouvre l'app pour synchroniser.")
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Fetch error", e)
                if (isSmallFormat) {
                    views.setTextViewText(R.id.widgetSmallStreak, "Erreur réseau")
                    views.setTextViewText(R.id.widgetSmallMessage, "Vérifie ta connexion.")
                    views.setTextViewText(R.id.widgetSmallMood, "😕")
                } else {
                    views.setTextViewText(R.id.widgetStreak, "Erreur réseau")
                    views.setTextViewText(R.id.widgetMannyMood, "😕")
                    views.setTextViewText(R.id.widgetMessage, "Vérifie ta connexion.")
                }
            }

            val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.setPackage(context.packageName)
            var flags = PendingIntent.FLAG_UPDATE_CURRENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags = flags or PendingIntent.FLAG_IMMUTABLE
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, flags)

            if (isSmallFormat) {
                views.setOnClickPendingIntent(R.id.widgetSmallContainer, pendingIntent)
            } else {
                views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent)
            }

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
