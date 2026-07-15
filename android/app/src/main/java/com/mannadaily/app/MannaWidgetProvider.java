package com.mannadaily.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.webkit.CookieManager;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;

public class MannaWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "MannaWidgetProvider";
    private static final String WIDGET_DATA_URL = "https://mannadaily.vercel.app/api/widget-data";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_manna);
        views.setTextViewText(R.id.widgetStreak, "Jours 🔥 --");
        views.setTextViewText(R.id.widgetMannyMood, "😐");
        views.setTextViewText(R.id.widgetVerse, "Ouvrez l'app pour voir votre verset.");

        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setPackage(context.getPackageName());

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
        fetchWidgetData(context, appWidgetManager, appWidgetId);
    }

    private static void fetchWidgetData(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        new Thread(() -> {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_manna);
            try {
                URL url = new URL(WIDGET_DATA_URL);
                HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setDoInput(true);

                String cookie = CookieManager.getInstance().getCookie(WIDGET_DATA_URL);
                if (cookie != null) {
                    connection.setRequestProperty("Cookie", cookie);
                }

                int responseCode = connection.getResponseCode();

                if (responseCode == HttpURLConnection.HTTP_OK) {
                    String response = readStream(connection.getInputStream());
                    JSONObject json = new JSONObject(response);
                    JSONObject streak = json.optJSONObject("streak");
                    JSONObject progress = json.optJSONObject("progress");
                    String verseText = json.optString("verse", "Ouvrez l'app pour le verset du jour.");

                    int currentStreak = streak != null ? streak.optInt("currentStreak", 0) : 0;
                    views.setTextViewText(R.id.widgetStreak, "Jours 🔥 " + currentStreak);
                    views.setTextViewText(R.id.widgetVerse, verseText);
                    views.setTextViewText(R.id.widgetMannyMood, getMoodEmoji(progress));
                } else if (responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
                    views.setTextViewText(R.id.widgetStreak, "Connectez-vous");
                    views.setTextViewText(R.id.widgetMannyMood, "🙁");
                    views.setTextViewText(R.id.widgetVerse, "Ouvrez l'application pour synchroniser.");
                } else {
                    views.setTextViewText(R.id.widgetStreak, "Mise à jour impossible");
                    views.setTextViewText(R.id.widgetMannyMood, "😔");
                    views.setTextViewText(R.id.widgetVerse, "Vérifiez votre connexion.");
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to fetch widget data", e);
                views.setTextViewText(R.id.widgetStreak, "Erreur réseau");
                views.setTextViewText(R.id.widgetMannyMood, "😕");
                views.setTextViewText(R.id.widgetVerse, "Impossible de charger les données.");
            }

            Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://mannadaily.vercel.app/meditate"));
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setPackage(context.getPackageName());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
            views.setOnClickPendingIntent(R.id.widgetMeditateButton, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }).start();
    }

    private static String getMoodEmoji(JSONObject progress) {
        if (progress == null) {
            return "😐";
        }
        boolean morning = progress.optBoolean("morningSessionToday", false);
        boolean evening = progress.optBoolean("eveningSessionToday", false);
        boolean done = progress.optBoolean("dayCompleted", false);

        if (done || (morning && evening)) {
            return "🎉";
        }
        if (morning || evening) {
            return "😊";
        }
        return "😢";
    }

    private static String readStream(InputStream inputStream) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"));
        StringBuilder builder = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            builder.append(line);
        }
        reader.close();
        return builder.toString();
    }
}
