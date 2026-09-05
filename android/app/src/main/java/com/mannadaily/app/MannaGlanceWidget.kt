package com.mannadaily.app

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class MannaGlanceWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            WidgetContent(context)
        }
    }

    @Composable
    private fun WidgetContent(context: Context) {
        var mood = "neutral"
        var message = "Ouvre l'app pour synchroniser."
        var streak = 0
        var bgColor = Color(0xFF4F46E5)

        try {
            val url = URL("https://mannadaily.vercel.app/api/widget-data")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            connection.doInput = true

            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                val response = BufferedReader(InputStreamReader(connection.inputStream, "UTF-8")).use { it.readText() }
                val json = JSONObject(response)
                mood = json.optString("mood", "neutral")
                message = json.optString("message", "")
                val streakObj = json.optJSONObject("streak")
                streak = streakObj?.optInt("currentStreak", 0) ?: 0

                bgColor = when (mood) {
                    "happy", "excited" -> Color(0xFFF59E0B)
                    "encouraging", "thinking" -> Color(0xFF3B82F6)
                    "celebrating" -> Color(0xFF10B981)
                    "sad", "disappointed" -> Color(0xFF6B7280)
                    "crying", "scared" -> Color(0xFFEF4444)
                    "panicked" -> Color(0xFFDC2626)
                    "angry" -> Color(0xFFB91C1C)
                    "worried" -> Color(0xFFF97316)
                    else -> Color(0xFF4F46E5)
                }
            }
        } catch (e: Exception) {
            Log.w("MannaGlanceWidget", "Fetch error", e)
        }

        val mannyRes = when (mood) {
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

        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.setPackage(context.packageName)

        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(bgColor))
                .padding(16.dp)
                .clickable(actionStartActivity(intent)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Image(
                    provider = ImageProvider(mannyRes),
                    contentDescription = "MannaDaily mascot",
                    modifier = GlanceModifier.size(64.dp)
                )

                Spacer(modifier = GlanceModifier.height(8.dp))

                Text(
                    text = "🔥 $streak jours",
                    style = TextStyle(
                        color = ColorProvider(Color.White),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                )

                Spacer(modifier = GlanceModifier.height(4.dp))

                Text(
                    text = message,
                    style = TextStyle(
                        color = ColorProvider(Color(0xFFE0E7FF)),
                        fontSize = 11.sp
                    )
                )
            }
        }
    }
}
