"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

interface PushOptInProps {
  vapidPublicKey: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushOptIn({ vapidPublicKey }: PushOptInProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }

    // Récupérer l'état initial de la permission
    setPermission(Notification.permission);

    // Utiliser getRegistration pour éviter de bloquer indéfiniment sur .ready si aucun SW n'est enregistré
    navigator.serviceWorker.getRegistration()
      .then((registration) => {
        if (!registration) {
          setIsSubscribed(false);
          setLoading(false);
          return;
        }
        return registration.pushManager.getSubscription()
          .then((subscription) => {
            setIsSubscribed(!!subscription);
          });
      })
      .catch((err) => {
        console.error("Erreur de récupération de l'état push :", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async () => {
    if (!vapidPublicKey) {
      setErrorMsg("Configuration push manquante sur le serveur.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Enregistrer le Service Worker si nécessaire
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // 2. Attendre que le SW soit prêt
      await navigator.serviceWorker.ready;

      // 3. Demander la permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setErrorMsg("L'autorisation de notification a été refusée. Activez-la dans les réglages du navigateur.");
        setLoading(false);
        return;
      }

      // 4. Souscrire au Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 5. Envoyer la souscription à notre API
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer l'abonnement sur le serveur.");
      }

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Erreur d'activation push :", err);
      setErrorMsg(err.message || "Une erreur est survenue lors de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Désabonner du Push Manager
        await subscription.unsubscribe();

        // Informer le serveur de supprimer l'endpoint
        await fetch("/api/push/unsubscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Erreur de désactivation push :", err);
      setErrorMsg("Impossible de désactiver les notifications push.");
    } finally {
      setLoading(false);
    }
  };

  // Si le navigateur ne supporte pas les notifications push
  if (typeof window !== "undefined" && !("PushManager" in window)) {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
      <div className="flex items-start gap-3.5">
        <div className={`p-3 rounded-xl border ${
          isSubscribed 
            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
            : "bg-indigo-50 border-indigo-100 text-indigo-600"
        }`}>
          {isSubscribed ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
            Notifications Quotidiennes
            {isSubscribed && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Activé
              </span>
            )}
          </h4>
          <p className="text-slate-500 font-medium text-xs max-w-md">
            Reçois les rappels de méditation de nos mascottes directement sur ton appareil pour ne jamais briser ton streak !
          </p>
          {errorMsg && (
            <p className="text-rose-500 font-semibold text-xs animate-shake">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      <div className="w-full md:w-auto flex-shrink-0">
        {loading ? (
          <button
            disabled
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 font-bold text-sm rounded-xl border border-slate-200"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Vérification...
          </button>
        ) : isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-sm rounded-xl border border-slate-200 transition-all active:scale-98"
          >
            <BellOff className="w-4 h-4" />
            Désactiver
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <Bell className="w-4 h-4" />
            Activer les notifications
          </button>
        )}
      </div>
    </div>
  );
}
