import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { readingReminders, notificationTime } = body;

    // Validation des préférences
    const dataToUpdate: any = {};
    
    if (readingReminders !== undefined) {
      dataToUpdate.readingReminders = Boolean(readingReminders);
    }
    
    if (notificationTime !== undefined) {
      // Les valeurs autorisées d'heures (format HH:MM)
      const allowedTimes = ["07:00", "12:00", "19:00", "21:00"];
      if (allowedTimes.includes(notificationTime)) {
        dataToUpdate.notificationTime = notificationTime;
      } else {
        return NextResponse.json({ error: "Heure de notification invalide" }, { status: 400 });
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        readingReminders: true,
        notificationTime: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Error in POST /api/user/preferences:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        readingReminders: true,
        notificationTime: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ preferences: user });
  } catch (error: any) {
    console.error("Error in GET /api/user/preferences:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
