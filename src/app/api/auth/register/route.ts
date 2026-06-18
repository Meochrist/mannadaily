import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { trackEvent } from "@/lib/posthog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format d'adresse e-mail invalide" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      await tx.userProgress.create({
        data: {
          userId: newUser.id,
          totalXP: 0,
          level: "Semence",
          versesLearned: 0,
          sessionsTotal: 0,
        },
      });

      await tx.streak.create({
        data: {
          userId: newUser.id,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });

      return newUser;
    });

    // PostHog event tracking (Tâche #79)
    trackEvent(user.id, "user_registered", {});

    return NextResponse.json({ message: "Utilisateur créé avec succès", userId: user.id });
  } catch (error: unknown) {
    console.error("Error in registration API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
