package com.mannadaily.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MannaFirebaseService : FirebaseMessagingService() {
    companion object {
        private const val TAG = "MannaFCM"
        private const val CHANNEL_ID = "mannadaily_notifications"
        private const val CHANNEL_NAME = "MannaDaily"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM Token: $token")
        // TODO: Envoyer le token au serveur pour associer à l'utilisateur
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        val title = remoteMessage.notification?.title ?: "MannaDaily"
        val body = remoteMessage.notification?.body ?: ""
        val data = remoteMessage.data
        
        showNotification(title, body, data)
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Canal de notification (Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Rappels de méditation MannaDaily"
                enableLights(true)
                lightColor = Color.parseColor("#4F46E5")
                enableVibration(true)
                vibrationPattern = longArrayOf(200, 100, 200)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Intent pour ouvrir l'app
        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"))
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.setPackage(packageName)
        var flags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = flags or PendingIntent.FLAG_IMMUTABLE
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, flags)

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setVibrate(longArrayOf(200, 100, 200))
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setColor(Color.parseColor("#4F46E5"))

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
