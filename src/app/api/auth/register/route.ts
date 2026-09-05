import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerDb, initServerDb } from '@/server/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir entre 8 et 128 caractères' }, { status: 400 });
    }

    const db = initServerDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Cette adresse e-mail est déjà utilisée' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, hashedPassword, now, now);

    db.prepare(`
      INSERT INTO streaks (id, userId, currentStreak, longestStreak, lastActivityAt)
      VALUES (?, ?, 0, 0, ?)
    `).run(crypto.randomUUID(), userId, now);

    db.prepare(`
      INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
      VALUES (?, ?, 0, 'Semence', 0, 0, 0)
    `).run(crypto.randomUUID(), userId);

    return NextResponse.json({ message: 'Utilisateur créé avec succès', userId });
  } catch (error: unknown) {
    console.error('Error in registration API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
