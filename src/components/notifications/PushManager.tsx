"use client";

import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA-P7g", // From Firebase Console
  authDomain: "mannadayli.firebaseapp.com",
  projectId: "mannadayli",
  storageBucket: "mannadayli.firebasestorage.app",
  messagingSenderId: "767630557552",
  appId: "1:767630557552:web:...", // Add web app in Firebase Console
};

const vapidKey = "BLpSCooHMRuGAdAHosGkpf9bHTCGypv9ztU2U3Hi5cT-7vroONP901ur8MVIRXJfA6aVQKwEnvZepxe1F8aP-yo";

export default function PushManager({ userId }: { userId?: string }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const setupFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // Demander la permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        // Enregistrer le service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        
        // Obtenir le token FCM
        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          setToken(currentToken);
          console.log("FCM Token:", currentToken);
          
          // Envoyer le token au serveur
          if (userId) {
            await fetch("/api/push/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, token: currentToken }),
            });
          }
        }

        // Écouter les messages en foreground
        onMessage(messaging, (payload) => {
          console.log("Message received:", payload);
          new Notification(payload.notification?.title || "MannaDaily", {
            body: payload.notification?.body,
            icon: "/icons/icon-192.png",
          });
        });
      } catch (err) {
        console.error("Firebase setup error:", err);
      }
    };

    setupFirebase();
  }, [userId]);

  return null;
}
