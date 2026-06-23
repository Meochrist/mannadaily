"use client";

import React, { useState } from "react";
import MannyMessage from "@/components/mascot/MannyMessage";
import { 
  ShoppingBag, 
  Coins, 
  Snowflake, 
  Crown, 
  Loader2,
  Sparkles
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  badge?: string;
}

export default function ShopPage() {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const products: Product[] = [
    {
      id: "lingots_100",
      name: "100 Lingots Célestes",
      price: 500,
      priceLabel: "500 FCFA",
      description: "Augmente ton trésor de lingots pour acheter des aides et personnaliser ton expérience.",
      icon: <Coins className="w-12 h-12 text-amber-500" />,
      colorClass: "from-amber-50 to-orange-50 border-amber-100 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-900/50",
    },
    {
      id: "lingots_500",
      name: "500 Lingots Célestes",
      price: 2000,
      priceLabel: "2 000 FCFA",
      description: "Un grand coffre de lingots pour les plus fervents étudiants. Économise 20% !",
      icon: <Coins className="w-12 h-12 text-amber-500 filter drop-shadow-md" />,
      colorClass: "from-amber-100 to-yellow-50 border-amber-200 dark:from-amber-950/40 dark:to-yellow-950/20 dark:border-amber-900/70",
      badge: "Meilleure Valeur 🔥",
    },
    {
      id: "freeze_pack",
      name: "Pack 5 Streak Freezes",
      price: 1000,
      priceLabel: "1 000 FCFA",
      description: "Protège ta série (streak) de fidélité contre les oublis. Permet de geler 5 jours.",
      icon: <Snowflake className="w-12 h-12 text-sky-500" />,
      colorClass: "from-sky-50 to-blue-50 border-sky-100 dark:from-sky-950/20 dark:to-blue-950/20 dark:border-sky-900/50",
    },
    {
      id: "premium_month",
      name: "Premium MannaDaily",
      price: 3000,
      priceLabel: "3 000 FCFA / mois",
      description: "Accès à des versets exclusifs, exégèses et commentaires avancés de chapitres par l'IA.",
      icon: <Crown className="w-12 h-12 text-indigo-650" />,
      colorClass: "from-indigo-50 to-violet-50 border-indigo-150 dark:from-indigo-950/20 dark:to-violet-950/20 dark:border-indigo-900/50",
      badge: "Recommandé 👑",
    },
  ];

  const handleBuy = async (productId: string) => {
    try {
      setLoadingProductId(productId);
      setError(null);

      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible d'initier le paiement");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("URL de paiement manquante");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'achat");
    } finally {
      setLoadingProductId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-indigo-650" />
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Boutique Céleste 🏪</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Soutiens le projet et équipe-toi pour grandir dans ta marche spirituelle quotidienne.
          </p>
        </div>
      </section>

      <section className="flex justify-center md:justify-start">
        <MannyMessage
          mood="excited"
          message={`"Bienvenue dans la Boutique Céleste !"\nTu peux acquérir des lingots ou activer le mode Premium pour débloquer toute la profondeur de la Parole !`}
          size={110}
        />
      </section>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold rounded-2xl text-center border border-red-100 dark:border-red-900/50">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((product) => {
          const isLoading = loadingProductId === product.id;
          return (
            <div 
              key={product.id}
              className={`relative bg-gradient-to-br ${product.colorClass} border-2 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
            >
              {product.badge && (
                <span className="absolute -top-3 right-6 bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {product.badge}
                </span>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100/50 dark:border-slate-850/50">
                    {product.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {product.priceLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleBuy(product.id)}
                  disabled={loadingProductId !== null}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-center transition-all duration-200 flex items-center justify-center gap-2 ${
                    product.id === "premium_month"
                      ? "bg-indigo-650 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                      : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connexion sécurisée...</span>
                    </>
                  ) : (
                    <span>Acheter maintenant</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
