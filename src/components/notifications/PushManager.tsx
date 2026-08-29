"use client";

import { useEffect, useState } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

interface PushManagerProps {
  userId?: string;
}

export default function PushManager({ userId }: PushManagerProps) {
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupPush = async () => {
      try {
        // Vérifier si déjà autorisé
        const status = await PushNotifications.checkPermissions();
        if (status.receive === "granted") {
          setPermission("granted");
          await PushNotifications.register();
          return;
        }

        // Demander la permission
        const result = await PushNotifications.requestPermissions();
        if (result.receive === "granted") {
          setPermission("granted");
          await PushNotifications.register();
        } else {
          setPermission("denied");
        }
      } catch (err) {
        console.error("Push setup error:", err);
      }
    };

    setupPush();
  }, [userId]);

  return null;
}
