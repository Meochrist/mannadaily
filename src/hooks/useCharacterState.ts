"use client";

import { useEffect, useState } from "react";

export type CharacterPose = "idle" | "jumping" | "sad" | "running";
export type CharacterExpression = "neutral" | "happy" | "sweating" | "crying";
export type CharacterOutfit = "default" | "winter" | "beach" | "halloween";

interface UserContextInput {
  currentStreak: number;
  sessionsTotal: number;
  inactivityDays: number; // Jours depuis la dernière session
  dayProgress: boolean; // Vrai si a médité aujourd'hui
}

interface WeatherData {
  temp: number;
  isRainy: boolean;
  isSnowy: boolean;
  loading: boolean;
}

export function useCharacterState(userContext: UserContextInput) {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 20,
    isRainy: false,
    isSnowy: false,
    loading: true,
  });

  // 1. Récupération de l'heure locale et saison
  const now = new Date();
  const hours = now.getHours();
  const month = now.getMonth(); // 0 = Janvier, 11 = Décembre
  const date = now.getDate();

  const isNight = hours < 6 || hours > 20;

  // Calcul de la saison
  let season: "winter" | "spring" | "summer" | "autumn" = "spring";
  if (month === 11 || month <= 1) {
    season = "winter";
  } else if (month >= 2 && month <= 4) {
    season = "spring";
  } else if (month >= 5 && month <= 7) {
    season = "summer";
  } else {
    season = "autumn";
  }

  // Événements spéciaux
  const isHalloween = month === 9 && date >= 28 && date <= 31; // Fin Octobre

  // 2. Appel API Météo (Open-Meteo sans clé d'API)
  useEffect(() => {
    let active = true;
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        if (!response.ok) throw new Error("Erreur de récupération météo");
        const data = await response.json();
        
        if (active) {
          const currentTemp = data.current.temperature_2m;
          const code = data.current.weather_code;
          
          // Codes météo WMO : 51-67 = Pluie/Bruine, 71-86 = Neige
          const isRainy = code >= 51 && code <= 67;
          const isSnowy = code >= 71 && code <= 86;

          setWeather({
            temp: currentTemp,
            isRainy,
            isSnowy,
            loading: false,
          });
        }
      } catch (err) {
        console.error("[Météo API] Impossible de lire la météo :", err);
        if (active) {
          setWeather((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    // Obtenir la position de l'utilisateur ou repli sur Paris
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback Paris
          fetchWeather(48.8566, 2.3522);
        }
      );
    } else {
      fetchWeather(48.8566, 2.3522);
    }

    return () => {
      active = false;
    };
  }, []);

  // 3. TABLE DE CORRESPONDANCE DYNAMIQUE (10 VARIANTES)
  const getCharacterState = (): {
    pose: CharacterPose;
    expression: CharacterExpression;
    outfit: CharacterOutfit;
    variantId: number;
    reason: string;
  } => {
    // ----------------------------------------------------
    // OUTFIT SELECTION (Prioritaire)
    // ----------------------------------------------------
    let outfit: CharacterOutfit = "default";
    if (isHalloween) {
      outfit = "halloween";
    } else if (weather.temp > 30) {
      outfit = "beach";
    } else if (weather.temp < 10 || season === "winter" || weather.isSnowy) {
      outfit = "winter";
    }

    // ----------------------------------------------------
    // CROISEMENT DES VARIANTES (10 SQUELETTES ÉLÉGANTS)
    // ----------------------------------------------------

    // VARIANTE 8 : Halloween (Priorité saisonnière)
    if (isHalloween) {
      return {
        pose: "jumping",
        expression: "happy",
        outfit: "halloween",
        variantId: 8,
        reason: "C'est Halloween ! Costume festif activé.",
      };
    }

    // VARIANTE 2 : Très chaud + Réussite ou repos
    if (weather.temp > 30) {
      return {
        pose: "idle",
        expression: "sweating",
        outfit: "beach",
        variantId: 2,
        reason: "Il fait trop chaud ! Lunettes de soleil et climat tropical.",
      };
    }

    // VARIANTE 5 : Froid extrême (< 5°C) + En retard
    if (weather.temp < 5 && !userContext.dayProgress) {
      return {
        pose: "sad",
        expression: "sweating", // Sue d'angoisse sous le gel
        outfit: "winter",
        variantId: 5,
        reason: "Il fait un froid glacial et tu n'as pas encore médité. Tu grelottes !",
      };
    }

    // VARIANTE 10 : Grand froid + Objectif complété
    if (weather.temp < 10 && userContext.dayProgress) {
      return {
        pose: "jumping",
        expression: "happy",
        outfit: "winter",
        variantId: 10,
        reason: "Au chaud sous ton bonnet, tu célèbres ta méditation du jour !",
      };
    }

    // VARIANTE 9 : Pluie / Tempête en cours
    if (weather.isRainy) {
      return {
        pose: "idle",
        expression: "sweating",
        outfit,
        variantId: 9,
        reason: "Il pleut dehors, le temps est orageux.",
      };
    }

    // VARIANTE 3 : Nuit étoilée + Objectif complété
    if (isNight && userContext.dayProgress) {
      return {
        pose: "idle",
        expression: "neutral",
        outfit,
        variantId: 3,
        reason: "La nuit est tombée, repos serein après une journée de fidélité.",
      };
    }

    // VARIANTE 6 : Fin de journée + Streak en danger
    if (hours >= 19 && !userContext.dayProgress && userContext.currentStreak > 0) {
      return {
        pose: "sad",
        expression: "crying",
        outfit,
        variantId: 6,
        reason: "Urgence ! Il est tard et ta série de jours consécutifs va être brisée !",
      };
    }

    // VARIANTE 7 : Absent depuis 2 jours ou plus (Inactivité)
    if (userContext.inactivityDays >= 2) {
      return {
        pose: "sad",
        expression: "sweating",
        outfit,
        variantId: 7,
        reason: "Cela fait plus de 2 jours... Ton compagnon s'inquiète pour toi.",
      };
    }

    // VARIANTE 4 : Haute performance (Streak >= 7) + Objectif du jour complété
    if (userContext.currentStreak >= 7 && userContext.dayProgress) {
      return {
        pose: "running",
        expression: "happy",
        outfit,
        variantId: 4,
        reason: "Série de jours de niveau olympique ! Tu cours vers de nouveaux succès.",
      };
    }

    // VARIANTE 1 : Objectif complété classique en journée
    if (userContext.dayProgress) {
      return {
        pose: "jumping",
        expression: "happy",
        outfit,
        variantId: 1,
        reason: "Objectif quotidien accompli ! Joie et célébration.",
      };
    }

    // PAR DÉFAUT (En attente de méditation)
    return {
      pose: "idle",
      expression: "neutral",
      outfit,
      variantId: 0,
      reason: "Prêt et disposé à lire la Parole aujourd'hui.",
    };
  };

  const state = getCharacterState();

  // Calculer l'état sémantique DiceBear (mascotState)
  const getMascotState = (): "SPORT" | "WEATHER_HOT" | "WEATHER_COLD" | "NIGHT_MODE" | "CRITICAL_STREAK" | "DEFAULT" => {
    // 1. Urgence Streak (Inactivité >= 2 jours ou soirée sans dévotion et streak actif)
    if (userContext.inactivityDays >= 2 || (hours >= 19 && !userContext.dayProgress && userContext.currentStreak > 0)) {
      return "CRITICAL_STREAK";
    }
    // 2. Mode nuit tardif (après 22h)
    if (hours >= 22 || hours < 6) {
      return "NIGHT_MODE";
    }
    // 3. Sport / Effort (Série active >= 7 jours et dévotion complétée)
    if (userContext.currentStreak >= 7 && userContext.dayProgress) {
      return "SPORT";
    }
    // 4. Météo chaude (> 28°C ou été)
    if (weather.temp > 28 || season === "summer") {
      return "WEATHER_HOT";
    }
    // 5. Météo froide (< 10°C ou hiver)
    if (weather.temp < 10 || season === "winter" || weather.isSnowy) {
      return "WEATHER_COLD";
    }
    return "DEFAULT";
  };

  const mascotState = getMascotState();

  return {
    ...state,
    weather,
    isNight,
    season,
    mascotState,
  };
}
