import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initServerDb } from '@/server/db';

// Générer un JWT simple (HS256) sans dépendance externaire
function generateJWT(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 30 * 24 * 60 * 60; // 30 jours
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp,
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  
  // Signature avec une clé secrète (en production, utiliser une variable d'environnement)
  const secret = process.env.JWT_SECRET || 'mannadaily-secret-key-change-in-production';
  const signature = btoa(
    Array.from(
      new Uint8Array(
        new TextEncoder().encode(encodedHeader + '.' + encodedPayload + secret)
      )
    ).map((b) => String.fromCharCode(b)).join('')
  );
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const db = initServerDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const token = generateJWT({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    console.error('Error in login API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
